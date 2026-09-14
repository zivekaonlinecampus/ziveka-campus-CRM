<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PayoutBatch;
use App\Models\Commission;
use App\Models\Representative;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PayoutBatchController extends Controller
{
    public function index()
    {
        $batches = PayoutBatch::with(['creator', 'approver', 'commissions.representative.user'])
            ->withCount('commissions')
            ->latest()
            ->get();

        return response()->json([
            'batches' => $batches,
        ]);
    }

    public function payableRepresentatives()
    {
        $reps = Representative::with(['user', 'primaryDistrict'])
            ->where('status', 'active')
            ->get()
            ->map(function ($rep) {
                $commissions = Commission::where('representative_id', $rep->id)->get();
                $earned = (float)$commissions->whereIn('status', ['eligible', 'approved', 'paid'])->sum('amount');
                $paid = (float)$commissions->where('status', 'paid')->sum('amount');
                $payable = (float)$commissions->where('status', 'approved')->sum('amount');
                $eligibleCount = $commissions->where('status', 'approved')->count();

                return [
                    'representative' => $rep,
                    'total_earned' => $earned,
                    'total_paid' => $paid,
                    'balance_payable' => $payable,
                    'eligible_commissions_count' => $eligibleCount,
                    'bank_details' => [
                        'bank_name' => $rep->bank_name,
                        'bank_branch' => $rep->bank_branch,
                        'account_name' => $rep->account_name,
                        'account_number' => $rep->account_number,
                    ],
                ];
            })
            ->filter(function ($item) {
                return $item['balance_payable'] > 0 || $item['total_paid'] > 0;
            })
            ->values();

        return response()->json([
            'payable_representatives' => $reps,
        ]);
    }

    public function show($id)
    {
        $batch = PayoutBatch::with([
            'creator',
            'approver',
            'commissions.representative.user',
            'commissions.representative.primaryDistrict',
            'commissions.enrolment.student',
            'commissions.enrolment.course',
        ])->findOrFail($id);

        return response()->json([
            'batch' => $batch,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user->isFinance() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Only Finance Officers and Super Admins can create payout batches.'], 403);
        }

        $request->validate([
            'period' => 'required|string',
            'commission_ids' => 'required|array|min:1',
            'commission_ids.*' => 'exists:commissions,id',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request, $user) {
            $commissions = Commission::whereIn('id', $request->commission_ids)
                ->whereIn('status', ['eligible', 'approved'])
                ->get();

            if ($commissions->isEmpty()) {
                return response()->json(['message' => 'No eligible commissions selected.'], 422);
            }

            $total = $commissions->sum('amount');
            $uniqueReps = $commissions->pluck('representative_id')->unique()->count();

            $count = PayoutBatch::count() + 1;
            $batchNo = sprintf('PAY-2026-%s-%04d', date('M'), $count);

            $batch = PayoutBatch::create([
                'batch_number' => $batchNo,
                'period' => $request->period,
                'total_amount' => $total,
                'representative_count' => $uniqueReps,
                'status' => 'draft',
                'created_by' => $user->id,
                'notes' => $request->notes,
            ]);

            Commission::whereIn('id', $commissions->pluck('id'))->update([
                'payout_batch_id' => $batch->id,
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);

            AuditLog::record(
                $user,
                'create',
                'PayoutBatch',
                (string)$batch->id,
                null,
                ['batch_number' => $batchNo, 'total_amount' => $total, 'reps' => $uniqueReps],
                'New commission payout batch generated'
            );

            return response()->json([
                'message' => 'Payout batch created successfully',
                'batch' => $batch->load('commissions.representative.user'),
            ], 201);
        });
    }

    public function complete(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isFinance() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'bank_transfer_reference' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $batch = PayoutBatch::with('commissions')->findOrFail($id);

        return DB::transaction(function () use ($batch, $user, $request) {
            $batch->update([
                'status' => 'completed',
                'bank_transfer_reference' => $request->bank_transfer_reference,
                'approved_by' => $user->id,
                'completed_at' => now(),
                'notes' => $request->notes ?? $batch->notes,
            ]);

            $batch->commissions()->update([
                'status' => 'paid',
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);

            AuditLog::record(
                $user,
                'approve',
                'PayoutBatch',
                (string)$batch->id,
                ['status' => 'draft'],
                ['status' => 'completed', 'bank_ref' => $request->bank_transfer_reference, 'amount' => $batch->total_amount],
                'Payout batch finalized and marked paid - commissions disbursed to bank accounts'
            );

            return response()->json([
                'message' => 'Payout batch finalized and all linked commissions marked as Paid (Disbursed to Bank)',
                'batch' => $batch->fresh(['creator', 'approver', 'commissions']),
            ]);
        });
    }

    public function depositRepresentative(Request $request)
    {
        $user = $request->user();
        if (!$user->isFinance() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Only Finance Officers and Super Admins can deposit commissions.'], 403);
        }

        $request->validate([
            'representative_id' => 'required|exists:representatives,id',
            'amount' => 'required|numeric|min:1',
            'bank_transfer_reference' => 'required|string',
            'deposit_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request, $user) {
            $rep = Representative::with(['user', 'primaryDistrict'])->findOrFail($request->representative_id);

            // Only approved commissions can be deposited to a bank account.
            $commissionsQuery = Commission::where('representative_id', $rep->id)
                ->where('status', 'approved');

            if ($request->filled('commission_ids') && is_array($request->commission_ids)) {
                $commissionsQuery->whereIn('id', $request->commission_ids);
            }

            $commissions = $commissionsQuery->get();

            $totalPayable = $commissions->sum('amount');
            $disbursedAmount = min((float)$request->amount, (float)$totalPayable);
            if ($disbursedAmount <= 0) {
                $disbursedAmount = (float)$request->amount;
            }

            $count = PayoutBatch::count() + 1;
            $batchNo = sprintf('BNK-DEP-%s-%04d', date('Ym'), $count);

            $batch = PayoutBatch::create([
                'batch_number' => $batchNo,
                'period' => date('Y-m'),
                'total_amount' => $disbursedAmount,
                'representative_count' => 1,
                'status' => 'completed',
                'bank_transfer_reference' => $request->bank_transfer_reference,
                'created_by' => $user->id,
                'approved_by' => $user->id,
                'completed_at' => $request->deposit_date ? $request->deposit_date . ' ' . date('H:i:s') : now(),
                'notes' => $request->notes ?? "Direct Bank Commission Deposit to {$rep->bank_name} ({$rep->account_number})",
            ]);

            // Update matching commissions to paid
            if ($commissions->isNotEmpty()) {
                Commission::whereIn('id', $commissions->pluck('id'))->update([
                    'payout_batch_id' => $batch->id,
                    'status' => 'paid',
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                ]);
            }

            AuditLog::record(
                $user,
                'approve',
                'CommissionPayout',
                (string)$batch->id,
                null,
                [
                    'batch_number' => $batchNo,
                    'representative' => $rep->user ? $rep->user->name : $rep->representative_id,
                    'amount' => $disbursedAmount,
                    'bank_transfer_reference' => $request->bank_transfer_reference,
                    'bank_account' => $rep->account_number,
                ],
                "Direct bank deposit of LKR {$disbursedAmount} to representative {$rep->representative_id} completed"
            );

            // Calculate fresh summary
            $allComms = Commission::where('representative_id', $rep->id)->get();
            $totalEarned = (float)$allComms->whereIn('status', ['eligible', 'approved', 'paid'])->sum('amount');
            $totalPaid = (float)$allComms->where('status', 'paid')->sum('amount');
            $balancePayable = (float)$allComms->where('status', 'approved')->sum('amount');

            return response()->json([
                'message' => "Bank deposit of LKR " . number_format($disbursedAmount, 2) . " recorded successfully! Representative Total Paid Out has been updated.",
                'payout_batch' => $batch,
                'summary' => [
                    'total_earned' => $totalEarned,
                    'total_paid' => $totalPaid,
                    'balance_payable' => $balancePayable,
                ],
            ], 200);
        });
    }

    public function statement(Request $request, $repId)
    {
        $rep = Representative::with(['user', 'primaryDistrict'])->findOrFail($repId);

        $commissions = Commission::where('representative_id', $rep->id)
            ->with(['enrolment.student', 'enrolment.course', 'payoutBatch'])
            ->latest('effective_date')
            ->get();

        $payoutBatches = PayoutBatch::whereHas('commissions', function ($q) use ($rep) {
            $q->where('representative_id', $rep->id);
        })->orWhere('notes', 'like', "%{$rep->representative_id}%")
          ->latest('completed_at')
          ->get();

        $totalEarned = (float)$commissions->whereIn('status', ['eligible', 'approved', 'paid'])->sum('amount');
        $totalPaid = (float)$commissions->where('status', 'paid')->sum('amount');
        $balancePayable = (float)$commissions->where('status', 'approved')->sum('amount');

        return response()->json([
            'statement_date' => now()->toDateString(),
            'statement_number' => 'STMT-' . $rep->representative_id . '-' . date('Ymd'),
            'representative' => $rep,
            'summary' => [
                'total_earned' => $totalEarned,
                'total_paid' => $totalPaid,
                'balance_payable' => $balancePayable,
            ],
            'items' => $commissions,
            'bank_deposits' => $payoutBatches,
        ]);
    }
}
