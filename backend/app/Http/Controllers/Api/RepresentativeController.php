<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Representative;
use App\Models\User;
use App\Models\District;
use App\Models\ReferralCode;
use App\Models\AuditLog;
use App\Models\SystemSetting;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RepresentativeController extends Controller
{
    public function index(Request $request)
    {
        $query = Representative::with(['user', 'primaryDistrict', 'activeReferralCode'])
            ->withCount([
                'leads',
                'enrolments as paid_students_count' => function ($q) {
                    $q->where('paid_amount', '>=', 40000)->where('is_scholarship', false);
                },
                'commissions as total_commission' => function ($q) {
                    $q->select(DB::raw('COALESCE(SUM(amount), 0)'));
                },
            ]);

        if ($request->filled('district_id')) {
            $query->where('primary_district_id', $request->district_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('representative_id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%")
                         ->orWhere('mobile', 'like', "%{$search}%");
                  });
            });
        }

        $representatives = $query->latest()->get();

        return response()->json([
            'representatives' => $representatives,
        ]);
    }

    public function show($id)
    {
        $rep = Representative::with([
            'user',
            'primaryDistrict',
            'referralCodes',
            'leads' => function ($q) {
                $q->with('course')->latest()->limit(20);
            },
            'commissions' => function ($q) {
                $q->latest()->limit(20);
            },
            'scholarships',
            'complaints',
        ])->findOrFail($id);

        $totalEarnings = $rep->commissions()->whereIn('status', ['approved', 'paid'])->sum('amount');
        $pendingEarnings = $rep->commissions()->where('status', 'eligible')->sum('amount');
        $paidStudents = $rep->enrolments()->where('paid_amount', '>=', 40000)->where('is_scholarship', false)->count();
        $totalLeads = $rep->leads()->count();

        $auditLogs = AuditLog::where('entity_type', 'Representative')
            ->where('entity_id', (string)$rep->id)
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'representative' => $rep,
            'stats' => [
                'total_leads' => $totalLeads,
                'paid_students' => $paidStudents,
                'total_earnings' => (float)$totalEarnings,
                'pending_earnings' => (float)$pendingEarnings,
                'conversion_rate' => $totalLeads > 0 ? round(($paidStudents / $totalLeads) * 100, 1) : 0,
            ],
            'audit_logs' => $auditLogs,
        ]);
    }

    public function downloadDocument(Request $request, $id, string $document)
    {
        $rep = Representative::findOrFail($id);
        $path = match ($document) {
            'nic-copy' => $rep->nic_copy_path,
            'signed-agreement' => $rep->signed_agreement_path,
            default => null,
        };

        abort_unless($path && Storage::disk('public')->exists($path), 404);

        return Storage::disk('public')->download($path);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'mobile' => 'required|string|max:20',
            'primary_district_id' => 'required|exists:districts,id',
            'city' => 'required|string|max:100',
            'profile_picture' => 'nullable|file|extensions:jpg,jpeg,png,webp,gif,bmp|max:5120',
            'nic_copy' => 'nullable|file|extensions:jpg,jpeg,png,webp,gif,bmp,pdf|max:5120',
            'signed_agreement' => 'nullable|file|extensions:jpg,jpeg,png,webp,gif,bmp,pdf|max:5120',
            'nic_passport' => 'nullable|string|max:30',
            'bank_name' => 'nullable|string',
            'bank_branch' => 'nullable|string',
            'account_name' => 'nullable|string',
            'account_number' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
            $profilePicturePath = $request->hasFile('profile_picture')
                ? $request->file('profile_picture')->store('representatives/profile-pictures', 'public')
                : null;
            $nicCopyPath = $request->hasFile('nic_copy')
                ? $request->file('nic_copy')->store('representatives/documents', 'public')
                : null;
            $signedAgreementPath = $request->hasFile('signed_agreement')
                ? $request->file('signed_agreement')->store('representatives/documents', 'public')
                : null;
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'mobile' => $request->mobile,
                'password' => Hash::make('welcome123'),
                'role' => 'representative',
                'status' => 'active',
                'must_change_password' => true,
            ]);

            $district = District::findOrFail($request->primary_district_id);
            $count = Representative::where('primary_district_id', $district->id)->count() + 1;
            $repId = sprintf('REP-%s-%03d', $district->code, $count);

            $rep = Representative::create([
                'user_id' => $user->id,
                'representative_id' => $repId,
                'primary_district_id' => $district->id,
                'city' => $request->city,
                'profile_picture_path' => $profilePicturePath,
                'nic_passport' => $request->nic_passport,
                'nic_copy_path' => $nicCopyPath,
                'signed_agreement_path' => $signedAgreementPath,
                'bank_name' => $request->bank_name,
                'bank_branch' => $request->bank_branch,
                'account_name' => $request->account_name,
                'account_number' => $request->account_number,
                'status' => 'active',
                'quality_score' => 100.00,
            ]);

            // Generate default referral code
            $firstName = strtoupper(Str::slug(explode(' ', $request->name)[0]));
            $refCode = sprintf('ZV-%s-%s', $district->code, $firstName);
            if (ReferralCode::where('code', $refCode)->exists()) {
                $refCode .= '-' . rand(10, 99);
            }

            ReferralCode::create([
                'representative_id' => $rep->id,
                'code' => $refCode,
                'slug' => Str::slug($refCode),
                'campaign' => 'Default-Attribution',
                'is_active' => true,
            ]);

            AuditLog::record(
                $request->user(),
                'create',
                'Representative',
                (string)$rep->id,
                null,
                ['representative_id' => $repId, 'name' => $request->name, 'district' => $district->name],
                'New representative onboarded'
            );

            return response()->json([
                'message' => 'Representative onboarded successfully',
                'representative' => $rep->load(['user', 'primaryDistrict', 'activeReferralCode']),
            ], 201);
        });
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:draft,submitted,under_review,approved,active,suspended,terminated',
            'reason' => 'nullable|string',
        ]);

        $rep = Representative::with('user')->findOrFail($id);
        $oldStatus = $rep->status;
        $rep->status = $request->status;
        $rep->save();

        if (in_array($request->status, ['suspended', 'terminated'])) {
            $rep->user->update(['status' => $request->status]);
        } elseif ($request->status === 'active') {
            $rep->user->update(['status' => 'active']);
        }

        AuditLog::record(
            $request->user(),
            'update',
            'Representative',
            (string)$rep->id,
            ['status' => $oldStatus],
            ['status' => $request->status],
            $request->reason ?? "Representative status updated to {$request->status}"
        );

        return response()->json([
            'message' => 'Status updated successfully',
            'representative' => $rep,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        abort_unless($request->user()?->isCampusAdmin(), 403);

        return DB::transaction(function () use ($request, $id) {
            $representative = Representative::with('user')->findOrFail($id);
            $representativeId = $representative->representative_id;
            $user = $representative->user;

            AuditLog::record(
                $request->user(),
                'delete',
                'Representative',
                (string) $representative->id,
                ['representative_id' => $representativeId, 'name' => $user?->name],
                null,
                'Representative removed from the campus directory'
            );

            $representative->delete();
            $user?->delete();

            return response()->json(['message' => 'Representative removed successfully']);
        });
    }

    public function updateBank(Request $request, $id)
    {
        $request->validate([
            'bank_name' => 'required|string',
            'bank_branch' => 'required|string',
            'account_name' => 'required|string',
            'account_number' => 'required|string',
            'reason' => 'nullable|string',
        ]);

        $rep = Representative::findOrFail($id);
        $oldBank = [
            'bank_name' => $rep->bank_name,
            'bank_branch' => $rep->bank_branch,
            'account_name' => $rep->account_name,
            'account_number' => $rep->account_number,
        ];

        $rep->update($request->only(['bank_name', 'bank_branch', 'account_name', 'account_number']));

        AuditLog::record(
            $request->user(),
            'update',
            'Representative',
            (string)$rep->id,
            $oldBank,
            $request->only(['bank_name', 'bank_branch', 'account_name', 'account_number']),
            $request->reason ?? 'Bank account details updated'
        );

        return response()->json([
            'message' => 'Bank details updated successfully',
            'representative' => $rep,
        ]);
    }

    public function uploadDocuments(Request $request, $id)
    {
        $request->validate([
            'nic_copy' => 'nullable|file|extensions:jpg,jpeg,png,webp,gif,bmp,pdf|max:5120',
            'signed_agreement' => 'nullable|file|extensions:jpg,jpeg,png,webp,gif,bmp,pdf|max:5120',
        ]);

        abort_unless($request->hasFile('nic_copy') || $request->hasFile('signed_agreement'), 422, 'Select at least one document to upload.');

        $rep = Representative::findOrFail($id);
        $oldDocuments = [
            'nic_copy_path' => $rep->nic_copy_path,
            'signed_agreement_path' => $rep->signed_agreement_path,
        ];

        if ($request->hasFile('nic_copy')) {
            $rep->nic_copy_path = $request->file('nic_copy')->store('representatives/documents', 'public');
        }
        if ($request->hasFile('signed_agreement')) {
            $rep->signed_agreement_path = $request->file('signed_agreement')->store('representatives/documents', 'public');
        }
        $rep->save();

        AuditLog::record(
            $request->user(),
            'update',
            'Representative',
            (string) $rep->id,
            $oldDocuments,
            [
                'nic_copy_path' => $rep->nic_copy_path,
                'signed_agreement_path' => $rep->signed_agreement_path,
            ],
            'Representative verification documents uploaded'
        );

        return response()->json([
            'message' => 'Verification documents uploaded successfully.',
            'representative' => $rep,
        ]);
    }

    public function uploadProfilePicture(Request $request, $id)
    {
        $request->validate([
            'profile_picture' => 'required|file|extensions:jpg,jpeg,png,webp,gif,bmp|max:5120',
        ]);

        $rep = Representative::with('user')->findOrFail($id);
        abort_unless($rep->user, 404, 'Representative user account not found.');

        $oldPath = $rep->user->profile_picture_path;
        $newPath = $request->file('profile_picture')->store('profile-pictures', 'public');
        $rep->user->update(['profile_picture_path' => $newPath]);

        if ($oldPath) {
            Storage::disk('public')->delete($oldPath);
        }

        AuditLog::record(
            $request->user(),
            'update',
            'Representative',
            (string) $rep->id,
            ['profile_picture_path' => $oldPath],
            ['profile_picture_path' => $newPath],
            'Representative profile picture uploaded'
        );

        return response()->json([
            'message' => 'Profile picture uploaded successfully.',
            'representative' => $rep->fresh()->load(['user', 'primaryDistrict', 'activeReferralCode']),
        ]);
    }

    public function myDashboard(Request $request)
    {
        $user = $request->user();
        $rep = Representative::where('user_id', $user->id)
            ->with(['primaryDistrict', 'activeReferralCode'])
            ->firstOrFail();

        // Single aggregate query replaces 10 separate DB round-trips
        $stats = DB::selectOne("
            SELECT
                (SELECT COUNT(*) FROM leads WHERE representative_id = ?) AS total_leads,
                (SELECT COUNT(*) FROM leads WHERE representative_id = ? AND status != 'lost') AS verified_leads,
                (SELECT COUNT(*) FROM leads WHERE representative_id = ? AND status IN ('new','contacted','qualified','payment_pending')) AS pending_follow_ups,
                (SELECT COUNT(*) FROM scholarships WHERE representative_id = ?) AS scholarship_referrals,
                (SELECT COUNT(*) FROM enrolments WHERE representative_id = ? AND paid_amount >= 40000 AND is_scholarship = false) AS paid_students,
                (SELECT COUNT(*) FROM enrolments WHERE representative_id = ? AND status = 'refunded') AS refunded_students,
                (SELECT COALESCE(SUM(p.amount),0) FROM payments p JOIN enrolments e ON p.enrolment_id = e.id WHERE e.representative_id = ? AND p.status = 'verified') AS verified_revenue,
                (SELECT COUNT(*) FROM enrolments en JOIN students st ON st.id = en.student_id WHERE en.representative_id = ? AND en.paid_amount >= 40000 AND en.is_scholarship = false AND st.day_30_active = true) AS persistence_count,
                (SELECT COALESCE(SUM(amount),0) FROM commissions WHERE representative_id = ? AND status IN ('eligible','approved','paid')) AS earned_commission,
                (SELECT COALESCE(SUM(amount),0) FROM commissions WHERE representative_id = ? AND status = 'paid') AS paid_commission,
                (SELECT COALESCE(SUM(amount),0) FROM commissions WHERE representative_id = ? AND status IN ('eligible','approved')) AS pending_commission
        ", array_fill(0, 11, $rep->id));

        $totalLeads          = (int)($stats->total_leads ?? 0);
        $verifiedLeads       = (int)($stats->verified_leads ?? 0);
        $paidStudents        = (int)($stats->paid_students ?? 0);
        $pendingFollowUps    = (int)($stats->pending_follow_ups ?? 0);
        $scholarshipReferrals= (int)($stats->scholarship_referrals ?? 0);
        $refundedStudents    = (int)($stats->refunded_students ?? 0);
        $verifiedRevenue     = (float)($stats->verified_revenue ?? 0);
        $persistenceCount    = (int)($stats->persistence_count ?? 0);
        $earnedCommission    = (float)($stats->earned_commission ?? 0);
        $paidCommission      = (float)($stats->paid_commission ?? 0);
        $pendingCommission   = (float)($stats->pending_commission ?? 0);

        $paidEnrolmentRate = $totalLeads > 0 ? ($paidStudents / $totalLeads) * 100 : 0;
        $persistenceRate   = $paidStudents > 0 ? ($persistenceCount / $paidStudents) * 100 : 0;
        $revenueRating     = min(100, ($verifiedRevenue / 4000) * 100);
        $refundRisk        = $paidStudents > 0 ? ($refundedStudents / $paidStudents) * 100 : 0;
        $complianceRating  = $rep->document_verified ? 100 : 0;

        $qualityComponents = [
            'paid_enrolment_rate' => round($paidEnrolmentRate, 1),
            'day_30_persistence'  => round($persistenceRate, 1),
            'net_revenue'         => round($revenueRating, 1),
            'refund_rate'         => round($refundRisk, 1),
            'compliance'          => $complianceRating,
        ];
        $qualityScore = round(
            ($qualityComponents['paid_enrolment_rate'] * 0.30)
            + ($qualityComponents['day_30_persistence'] * 0.25)
            + ($qualityComponents['net_revenue'] * 0.20)
            + (($paidStudents > 0 ? 100 - $qualityComponents['refund_rate'] : 0) * 0.15)
            + ($qualityComponents['compliance'] * 0.10),
            1
        );
        $rep->updateQuietly(['quality_score' => $qualityScore]);

        $bonusTiers = [
            ['tier' => 5,  'bonus' => 5000,  'label' => '5 Paid Students (LKR 5,000)'],
            ['tier' => 10, 'bonus' => 15000, 'label' => '10 Paid Students (LKR 15,000)'],
            ['tier' => 20, 'bonus' => 40000, 'label' => '20 Paid Students (LKR 40,000)'],
        ];
        $nextTier = null;
        $currentTierAchieved = null;
        foreach ($bonusTiers as $t) {
            if ($paidStudents >= $t['tier']) { $currentTierAchieved = $t; }
            elseif (!$nextTier)              { $nextTier = $t; }
        }

        $recentLeads       = $rep->leads()->with('course')->latest()->limit(10)->get();
        $recentCommissions = $rep->commissions()->latest()->limit(10)->get();
        $pipeline          = $rep->leads()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'representative' => $rep,
            'kpis' => [
                'total_leads'          => $totalLeads,
                'verified_leads'       => $verifiedLeads,
                'paid_students'        => $paidStudents,
                'pending_follow_ups'   => $pendingFollowUps,
                'scholarship_referrals'=> $scholarshipReferrals,
                'earned_commission'    => $earnedCommission,
                'paid_commission'      => $paidCommission,
                'pending_commission'   => $pendingCommission,
                'quality_score'        => $qualityScore,
                'quality_components'   => $qualityComponents,
            ],
            'bonus_progress' => [
                'current_paid_count' => $paidStudents,
                'current_tier'       => $currentTierAchieved,
                'next_tier'          => $nextTier,
                'progress_to_next'   => $nextTier ? min(100, round(($paidStudents / $nextTier['tier']) * 100)) : 100,
            ],
            'pipeline'           => $pipeline,
            'recent_leads'       => $recentLeads,
            'recent_commissions' => $recentCommissions,
        ]);
    }
}


