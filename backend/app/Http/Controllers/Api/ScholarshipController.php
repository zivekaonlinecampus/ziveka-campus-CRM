<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Scholarship;
use App\Models\Lead;
use App\Models\Student;
use App\Models\Enrolment;
use App\Models\Representative;
use App\Models\AuditLog;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScholarshipController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Scholarship::with(['district', 'course', 'representative.user', 'lead', 'student', 'reviewer']);

        if ($user->isRepresentative()) {
            $rep = Representative::where('user_id', $user->id)->first();
            if ($rep) {
                $query->where('representative_id', $rep->id);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        $scholarships = $query->latest()->get();

        $quotaTotal = (int)SystemSetting::getVal('scholarship_quota', 10);
        $quotaApproved = Scholarship::where('status', 'approved')->count();
        $quotaRemaining = max(0, $quotaTotal - $quotaApproved);
        $totalWaiverValue = Scholarship::where('status', 'approved')->sum('waiver_amount');

        return response()->json([
            'scholarships' => $scholarships,
            'quota' => [
                'total' => $quotaTotal,
                'used' => $quotaApproved,
                'remaining' => $quotaRemaining,
                'total_waiver_value' => (float)$totalWaiverValue,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'applicant_name' => 'required|string|max:255',
            'nic_passport' => 'nullable|string|max:30',
            'district_id' => 'required|exists:districts,id',
            'course_id' => 'required|exists:courses,id',
            'financial_need_summary' => 'required|string',
            'academic_motivation' => 'nullable|string',
            'lead_id' => 'nullable|exists:leads,id',
        ]);

        $user = $request->user();
        $repId = null;
        if ($user->isRepresentative()) {
            $rep = Representative::where('user_id', $user->id)->first();
            $repId = $rep?->id;
        }

        $count = Scholarship::count() + 1;
        $appId = sprintf('SCH-2026-%04d', $count);

        $scholarship = Scholarship::create([
            'application_id' => $appId,
            'lead_id' => $request->lead_id,
            'representative_id' => $repId,
            'applicant_name' => $request->applicant_name,
            'nic_passport' => $request->nic_passport,
            'district_id' => $request->district_id,
            'course_id' => $request->course_id,
            'financial_need_summary' => $request->financial_need_summary,
            'academic_motivation' => $request->academic_motivation,
            'quota_period' => '2026-Q3',
            'waiver_amount' => 40000.00,
            'status' => 'submitted',
        ]);

        AuditLog::record(
            $user,
            'create',
            'Scholarship',
            (string)$scholarship->id,
            null,
            ['application_id' => $appId, 'applicant_name' => $request->applicant_name],
            'Scholarship application submitted'
        );

        return response()->json([
            'message' => 'Scholarship nomination submitted successfully',
            'scholarship' => $scholarship->load(['district', 'course', 'representative.user']),
        ], 201);
    }

    public function decision(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isCampusAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin committee approval required.'], 403);
        }

        $request->validate([
            'status' => 'required|in:approved,waitlisted,rejected,under_review',
            'score' => 'nullable|numeric|min:0|max:100',
            'review_notes' => 'nullable|string',
        ]);

        $scholarship = Scholarship::with(['lead', 'course'])->findOrFail($id);

        return DB::transaction(function () use ($scholarship, $request, $user) {
            $scholarship->update([
                'status' => $request->status,
                'score' => $request->score ?? $scholarship->score,
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
                'review_notes' => $request->review_notes ?? $scholarship->review_notes,
            ]);

            // When approved: apply 100% fee waiver, create student & zero-commission enrolment
            if ($request->status === 'approved') {
                if ($scholarship->lead_id) {
                    $lead = $scholarship->lead;
                    $lead->update(['status' => 'scholarship']);
                }

                $studentCount = Student::count() + 1;
                $studentId = sprintf('STU-SCH-%04d', $studentCount);

                $student = Student::firstOrCreate(
                    ['lead_id' => $scholarship->lead_id ?? Lead::create([
                        'lead_id' => 'LEAD-SCH-' . $studentCount,
                        'full_name' => $scholarship->applicant_name,
                        'mobile' => '0000000000',
                        'normalized_mobile' => '0000000000',
                        'district_id' => $scholarship->district_id,
                        'course_id' => $scholarship->course_id,
                        'status' => 'scholarship',
                    ])->id],
                    [
                        'student_id' => $studentId,
                        'full_name' => $scholarship->applicant_name,
                        'mobile' => '0000000000',
                        'nic_passport' => $scholarship->nic_passport,
                        'district_id' => $scholarship->district_id,
                        'enrolment_date' => now()->toDateString(),
                        'day_30_active' => true,
                    ]
                );

                $scholarship->update(['student_id' => $student->id]);

                Enrolment::firstOrCreate(
                    ['student_id' => $student->id, 'course_id' => $scholarship->course_id],
                    [
                        'representative_id' => $scholarship->representative_id,
                        'intake' => '2026-Q3',
                        'total_fee' => 40000.00,
                        'discount_amount' => 40000.00, // 100% waiver
                        'paid_amount' => 0.00,
                        'is_scholarship' => true,
                        'status' => 'waived',
                        'enrolled_at' => now(),
                    ]
                );
            }

            AuditLog::record(
                $user,
                'approve',
                'Scholarship',
                (string)$scholarship->id,
                null,
                ['status' => $request->status, 'score' => $request->score],
                "Scholarship decision: {$request->status}"
            );

            return response()->json([
                'message' => "Scholarship marked as {$request->status}",
                'scholarship' => $scholarship->fresh(['district', 'course', 'reviewer']),
            ]);
        });
    }
}

