<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Representative;
use App\Models\ReferralCode;
use App\Models\Activity;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LeadController extends Controller
{
    private function normalizePhone(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($cleaned, '94') && strlen($cleaned) > 9) {
            $cleaned = '0' . substr($cleaned, 2);
        }
        return $cleaned;
    }

    private function normalizeNic(?string $nic): ?string
    {
        if (!$nic) return null;
        return strtoupper(trim(str_replace([' ', '-'], '', $nic)));
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Lead::with(['district', 'course', 'representative.user', 'counsellor', 'student.enrolments.payments']);

        // Representative restricted access (SRS Section 3 & 3.1)
        if ($user->isRepresentative()) {
            $rep = Representative::where('user_id', $user->id)->first();
            if ($rep) {
                $query->where('representative_id', $rep->id);
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($request->filled('representative_id')) {
            $query->where('representative_id', $request->representative_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('district_id')) {
            $query->where('district_id', $request->district_id);
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        if ($request->filled('is_duplicate')) {
            $query->where('is_duplicate', filter_var($request->is_duplicate, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('full_name', 'like', "%{$s}%")
                  ->orWhere('lead_id', 'like', "%{$s}%")
                  ->orWhere('mobile', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('nic_passport', 'like', "%{$s}%");
            });
        }

        $leads = $query->latest()->get();

        return response()->json([
            'leads' => $leads,
        ]);
    }

    public function show($id)
    {
        $lead = Lead::with([
            'district',
            'course',
            'representative.user',
            'counsellor',
            'activities.user',
            'student.enrolments.payments',
            'student.enrolments.commission',
            'scholarships',
            'duplicateOf',
        ])->findOrFail($id);

        return response()->json([
            'lead' => $lead,
        ]);
    }

    public function checkDuplicate(Request $request)
    {
        $mobile = $request->filled('mobile') ? $this->normalizePhone($request->mobile) : null;
        $nic = $this->normalizeNic($request->nic_passport);
        $email = $request->filled('email') ? strtolower(trim($request->email)) : null;

        $match = null;
        $matchType = null;

        if ($mobile) {
            $match = Lead::where('normalized_mobile', $mobile)->with('representative.user')->first();
            if ($match) $matchType = 'exact_mobile';
        }

        if (!$match && $nic) {
            $match = Lead::where('normalized_nic', $nic)->with('representative.user')->first();
            if ($match) $matchType = 'exact_nic';
        }

        if (!$match && $email) {
            $match = Lead::where('normalized_email', $email)->with('representative.user')->first();
            if ($match) $matchType = 'exact_email';
        }

        if (!$match && $request->filled('full_name') && $request->filled('district_id')) {
            $match = Lead::where('district_id', $request->district_id)
                ->where('full_name', 'like', '%' . trim($request->full_name) . '%')
                ->with('representative.user')
                ->first();
            if ($match) $matchType = 'probable';
        }

        return response()->json([
            'is_duplicate' => (bool)$match,
            'match_type' => $matchType,
            'existing_lead' => $match,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'mobile' => 'required|string|max:20',
            'email' => 'nullable|email',
            'nic_passport' => 'nullable|string|max:30',
            'district_id' => 'nullable|exists:districts,id',
            'city' => 'nullable|string|max:100',
            'course_id' => 'nullable|exists:courses,id',
            'course_ids' => 'nullable|array|min:1',
            'course_ids.*' => 'exists:courses,id',
            'preferred_language' => 'nullable|string|in:en,si',
            'notes' => 'nullable|string',
            'referral_code' => 'nullable|string',
        ]);

        $user = $request->user();
        $repId = null;
        $refCode = $request->referral_code;

        if ($user && $user->isRepresentative()) {
            $rep = Representative::where('user_id', $user->id)->first();
            if ($rep) {
                $repId = $rep->id;
                $activeCode = $rep->activeReferralCode;
                if ($activeCode) $refCode = $activeCode->code;
            }
        } elseif ($refCode) {
            $foundCode = ReferralCode::where('code', $refCode)->first();
            if ($foundCode) {
                $repId = $foundCode->representative_id;
                $foundCode->increment('clicks_count');
            }
        }

        $normMobile = $this->normalizePhone($request->mobile);
        $normNic = $this->normalizeNic($request->nic_passport);
        $normEmail = $request->filled('email') ? strtolower(trim($request->email)) : null;

        // Duplicate Validation Engine (SRS Section 7.1)
        $isDuplicate = false;
        $dupConfidence = null;
        $dupOfId = null;

        $exactMatch = null;
        if ($normMobile) {
            $exactMatch = Lead::where('normalized_mobile', $normMobile)->first();
            if ($exactMatch) $dupConfidence = 'exact_mobile';
        }
        if (!$exactMatch && $normNic) {
            $exactMatch = Lead::where('normalized_nic', $normNic)->first();
            if ($exactMatch) $dupConfidence = 'exact_nic';
        }
        if (!$exactMatch && $normEmail) {
            $exactMatch = Lead::where('normalized_email', $normEmail)->first();
            if ($exactMatch) $dupConfidence = 'exact_email';
        }

        if ($exactMatch) {
            $isDuplicate = true;
            $dupOfId = $exactMatch->id;
        }

        return DB::transaction(function () use ($request, $user, $repId, $refCode, $normMobile, $normNic, $normEmail, $isDuplicate, $dupConfidence, $dupOfId) {
            $courseIds = array_values(array_unique($request->input('course_ids', $request->filled('course_id') ? [$request->course_id] : [])));
            $count = Lead::count() + 1;
            $leadId = sprintf('LEAD-2026-%04d', $count);

            $lead = Lead::create([
                'lead_id' => $leadId,
                'full_name' => $request->full_name,
                'preferred_name' => $request->preferred_name ?? explode(' ', $request->full_name)[0],
                'mobile' => $request->mobile,
                'normalized_mobile' => $normMobile,
                'whatsapp' => $request->whatsapp ?? $request->mobile,
                'email' => $request->email,
                'normalized_email' => $normEmail,
                'nic_passport' => $request->nic_passport,
                'normalized_nic' => $normNic,
                'dob' => $request->dob,
                'age_group' => $request->age_group,
                'guardian_name' => $request->guardian_name,
                'guardian_relationship' => $request->guardian_relationship,
                'guardian_contact' => $request->guardian_contact,
                'district_id' => $request->district_id,
                'city' => $request->city,
                'course_id' => $courseIds[0] ?? null,
                'intake' => $request->intake ?? '2026-Q3',
                'preferred_language' => $request->preferred_language ?? 'en',
                'delivery_mode' => $request->delivery_mode ?? 'Online',
                'representative_id' => $repId,
                'referral_code' => $refCode,
                'referral_timestamp' => $refCode ? now() : null,
                'status' => 'new',
                'is_duplicate' => $isDuplicate,
                'duplicate_of_lead_id' => $dupOfId,
                'duplicate_confidence' => $dupConfidence,
                'consent_captured' => true,
                'notes' => $request->notes,
            ]);

            if ($courseIds) {
                $lead->courses()->sync($courseIds);
            }

            Activity::create([
                'lead_id' => $lead->id,
                'representative_id' => $repId,
                'user_id' => $user ? $user->id : 1,
                'type' => 'note',
                'outcome' => 'Lead Created',
                'notes' => $isDuplicate 
                    ? "Lead registered with duplicate alert [{$dupConfidence} matched with {$dupOfId}]"
                    : 'Initial lead record generated in CRM',
            ]);

            AuditLog::record(
                $user,
                'create',
                'Lead',
                (string)$lead->id,
                null,
                ['lead_id' => $leadId, 'name' => $lead->full_name, 'representative_id' => $repId],
                'New lead captured'
            );

            return response()->json([
                'message' => $isDuplicate ? 'Lead recorded with duplicate flag for admin review' : 'Lead created successfully',
                'lead' => $lead->load(['district', 'course', 'representative.user']),
                'is_duplicate' => $isDuplicate,
            ], 201);
        });
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:new,contacted,qualified,application,payment_pending,paid,lost,scholarship',
            'lost_reason' => 'nullable|string',
            'notes' => 'nullable|string',
            'counsellor_id' => 'nullable|exists:users,id',
        ]);

        $lead = Lead::findOrFail($id);
        $oldStatus = $lead->status;

        $lead->status = $request->status;
        if ($request->filled('lost_reason')) {
            $lead->lost_reason = $request->lost_reason;
        }
        if ($request->filled('counsellor_id')) {
            $lead->counsellor_id = $request->counsellor_id;
        }
        $lead->save();

        Activity::create([
            'lead_id' => $lead->id,
            'representative_id' => $lead->representative_id,
            'user_id' => $request->user()->id,
            'type' => 'status_change',
            'outcome' => "Stage changed from {$oldStatus} to {$request->status}",
            'notes' => $request->notes ?? "Lead moved to stage {$request->status}",
        ]);

        AuditLog::record(
            $request->user(),
            'update',
            'Lead',
            (string)$lead->id,
            ['status' => $oldStatus],
            ['status' => $request->status, 'lost_reason' => $request->lost_reason],
            'Lead stage update'
        );

        return response()->json([
            'message' => 'Lead status updated',
            'lead' => $lead->fresh(['district', 'course', 'representative.user', 'counsellor']),
        ]);
    }

    public function merge(Request $request, $id)
    {
        $request->validate([
            'master_lead_id' => 'required|exists:leads,id',
            'reason' => 'required|string',
        ]);

        $duplicateLead = Lead::findOrFail($id);
        $masterLead = Lead::findOrFail($request->master_lead_id);

        return DB::transaction(function () use ($duplicateLead, $masterLead, $request) {
            // Move activities from duplicate to master
            Activity::where('lead_id', $duplicateLead->id)->update(['lead_id' => $masterLead->id]);

            $duplicateLead->update([
                'is_duplicate' => true,
                'duplicate_of_lead_id' => $masterLead->id,
                'status' => 'lost',
                'lost_reason' => "Merged into master record {$masterLead->lead_id}: {$request->reason}",
            ]);

            AuditLog::record(
                $request->user(),
                'merge',
                'Lead',
                (string)$duplicateLead->id,
                ['status' => 'active'],
                ['merged_into' => $masterLead->lead_id],
                $request->reason
            );

            return response()->json([
                'message' => 'Duplicate lead merged successfully into master record',
                'master_lead' => $masterLead->fresh(['activities', 'representative.user']),
            ]);
        });
    }

    public function bulkImport(Request $request)
    {
        $request->validate([
            'leads' => 'required|array|min:1',
            'leads.*.full_name' => 'required|string',
            'leads.*.mobile' => 'required|string',
        ]);

        $imported = 0;
        $duplicates = 0;
        $user = $request->user();

        DB::transaction(function () use ($request, $user, &$imported, &$duplicates) {
            foreach ($request->leads as $row) {
                $normMobile = $this->normalizePhone($row['mobile']);
                $exists = Lead::where('normalized_mobile', $normMobile)->exists();

                $count = Lead::count() + 1;
                $leadId = sprintf('LEAD-2026-%04d', $count);

                Lead::create([
                    'lead_id' => $leadId,
                    'full_name' => $row['full_name'],
                    'mobile' => $row['mobile'],
                    'normalized_mobile' => $normMobile,
                    'email' => $row['email'] ?? null,
                    'normalized_email' => !empty($row['email']) ? strtolower(trim($row['email'])) : null,
                    'district_id' => $row['district_id'] ?? null,
                    'course_id' => $row['course_id'] ?? null,
                    'status' => 'new',
                    'is_duplicate' => $exists,
                    'duplicate_confidence' => $exists ? 'exact_mobile' : null,
                ]);

                if ($exists) {
                    $duplicates++;
                } else {
                    $imported++;
                }
            }

            AuditLog::record(
                $user,
                'create',
                'Lead',
                null,
                null,
                ['imported_count' => $imported, 'duplicate_count' => $duplicates],
                'Bulk lead import executed'
            );
        });

        return response()->json([
            'message' => "Bulk import completed. {$imported} leads added, {$duplicates} flagged as duplicates.",
            'imported' => $imported,
            'duplicates' => $duplicates,
        ]);
    }
}

