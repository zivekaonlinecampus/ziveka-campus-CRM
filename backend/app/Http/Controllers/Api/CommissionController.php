<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Commission;
use App\Models\Representative;
use App\Models\Enrolment;
use App\Models\AuditLog;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommissionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Commission::with([
            'representative.user',
            'enrolment.student.lead',
            'enrolment.course',
            'payoutBatch',
            'approver',
        ]);

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

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $commissions = $query->latest('effective_date')->get();

        $summary = [
            'total_eligible' => (float)$commissions->where('status', 'eligible')->sum('amount'),
            'total_approved' => (float)$commissions->where('status', 'approved')->sum('amount'),
            'total_paid' => (float)$commissions->where('status', 'paid')->sum('amount'),
            'total_held' => (float)$commissions->where('status', 'on_hold')->sum('amount'),
            'total_reversed' => (float)$commissions->where('status', 'reversed')->sum('amount'),
        ];

        return response()->json([
            'commissions' => $commissions,
            'summary' => $summary,
        ]);
    }

    public function approve(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isFinance()) {
            return response()->json(['message' => 'Unauthorized. Only Finance Officers can approve commissions.'], 403);
        }

        $commission = Commission::findOrFail($id);
        $oldStatus = $commission->status;

        $commission->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        AuditLog::record(
            $user,
            'approve',
            'Commission',
            (string)$commission->id,
            ['status' => $oldStatus],
            ['status' => 'approved'],
            'Commission approved for payout batch'
        );

        return response()->json([
            'message' => 'Commission approved successfully',
            'commission' => $commission->fresh(['representative.user', 'approver']),
        ]);
    }

    public function adjust(Request $request)
    {
        $user = $request->user();
        if (!$user->isFinance()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'representative_id' => 'required|exists:representatives,id',
            'amount' => 'required|numeric',
            'reason' => 'required|string',
        ]);

        $count = Commission::count() + 1;
        $commission = Commission::create([
            'transaction_id' => sprintf('COM-ADJ-%04d', $count),
            'representative_id' => $request->representative_id,
            'amount' => $request->amount,
            'type' => 'adjustment',
            'status' => 'eligible',
            'adjustment_reason' => $request->reason,
            'approved_by' => $user->id,
            'approved_at' => now(),
            'effective_date' => now()->toDateString(),
        ]);

        AuditLog::record(
            $user,
            'update',
            'Commission',
            (string)$commission->id,
            null,
            ['amount' => $request->amount, 'reason' => $request->reason],
            'Manual commission adjustment created'
        );

        return response()->json([
            'message' => 'Adjustment transaction added successfully',
            'commission' => $commission,
        ], 201);
    }
}

