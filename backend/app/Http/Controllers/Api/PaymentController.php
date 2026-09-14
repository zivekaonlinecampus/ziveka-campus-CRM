<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Enrolment;
use App\Models\Student;
use App\Models\Lead;
use App\Models\Course;
use App\Models\Commission;
use App\Models\Representative;
use App\Models\AuditLog;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with([
            'enrolment.student.lead',
            'enrolment.course',
            'enrolment.representative.user',
            'enrolment.representative.primaryDistrict',
            'verifier',
        ]);
            abort_unless(!$request->user()?->isRepresentative(), 403);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('line_item')) {
            $query->where('line_item', $request->line_item);
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('receipt_number', 'like', "%{$s}%")
                  ->orWhere('bank_reference', 'like', "%{$s}%")
                  ->orWhereHas('enrolment.student', function ($sq) use ($s) {
                      $sq->where('full_name', 'like', "%{$s}%")
                         ->orWhere('student_id', 'like', "%{$s}%");
                  });
            });
        }

        $payments = $query->latest('payment_date')->latest('id')->get();

        return response()->json([
            'payments' => $payments,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'lead_id' => 'nullable|exists:leads,id',
            'enrolment_id' => 'nullable|exists:enrolments,id',
            'amount' => 'required|numeric|min:1',
            'line_item' => 'required|in:registration_fee,course_fee,full_payment,instalment',
            'payment_method' => 'required|in:bank_transfer,cash,gateway,cheque',
            'bank_reference' => 'required|string|max:255',
            'payment_document' => 'required|file|extensions:jpg,jpeg,png,webp,gif,bmp,pdf|max:5120',
            'payment_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);
            abort_unless(!$request->user()?->isRepresentative(), 403);

        return DB::transaction(function () use ($request) {
            $slipPath = $request->hasFile('payment_document')
                ? $request->file('payment_document')->store('payments/slips', 'public')
                : null;
            $enrolment = null;

            if ($request->filled('enrolment_id')) {
                $enrolment = Enrolment::findOrFail($request->enrolment_id);
            } elseif ($request->filled('lead_id')) {
                $lead = Lead::with(['course', 'representative'])->findOrFail($request->lead_id);

                // Find or create Student
                $student = Student::where('lead_id', $lead->id)->first();
                if (!$student) {
                    $stuCount = Student::count() + 1;
                    $student = Student::create([
                        'student_id' => sprintf('STU-2026-%04d', $stuCount),
                        'lead_id' => $lead->id,
                        'full_name' => $lead->full_name,
                        'email' => $lead->email ?? "student_{$lead->id}@zivekacampus.lk",
                        'mobile' => $lead->mobile,
                        'nic_passport' => $lead->nic_passport,
                        'district_id' => $lead->district_id,
                        'enrolment_date' => now()->toDateString(),
                        'day_30_active' => true,
                    ]);
                }

                // Find or create Enrolment
                $course = $lead->course ?? Course::first();
                $courseId = $course ? $course->id : 1;
                $courseFee = $course ? $course->total_fee : 40000.00;

                $enrolment = Enrolment::where('student_id', $student->id)
                    ->where('course_id', $courseId)
                    ->first();

                if (!$enrolment) {
                    $enrolment = Enrolment::create([
                        'student_id' => $student->id,
                        'course_id' => $courseId,
                        'representative_id' => $lead->representative_id,
                        'intake' => $lead->intake ?? '2026-Q3',
                        'batch_number' => 'BATCH-2026-01',
                        'total_fee' => $courseFee,
                        'discount_amount' => 0.00,
                        'paid_amount' => 0.00,
                        'is_scholarship' => false,
                        'status' => 'active',
                        'enrolled_at' => now(),
                    ]);
                }

                if ($lead->status === 'new' || $lead->status === 'contacted') {
                    $lead->update(['status' => 'payment_pending']);
                }
            } else {
                return response()->json(['message' => 'Please provide either lead_id or enrolment_id.'], 422);
            }

            $count = Payment::count() + 1;
            $receiptNo = sprintf('REC-2026-%04d', $count);

            $payment = Payment::create([
                'receipt_number' => $receiptNo,
                'enrolment_id' => $enrolment->id,
                'amount' => $request->amount,
                'line_item' => $request->line_item,
                'payment_method' => $request->payment_method,
                'bank_reference' => $request->bank_reference ?? ('BNK-' . strtoupper(Str::random(8))),
                'slip_path' => $slipPath,
                'payment_date' => $request->payment_date,
                'status' => 'pending',
                'idempotency_key' => 'IDEMP-' . Str::uuid(),
                'notes' => $request->notes,
            ]);

            AuditLog::record(
                $request->user(),
                'create',
                'Payment',
                (string)$payment->id,
                null,
                ['receipt_number' => $receiptNo, 'amount' => $request->amount, 'student' => $enrolment->student->full_name],
                'Payment receipt recorded and submitted to finance verification queue'
            );

            return response()->json([
                'message' => 'Payment receipt recorded successfully and queued for finance verification',
                'payment' => $payment->load(['enrolment.student.lead', 'enrolment.course', 'enrolment.representative.user']),
            ], 201);
        });
    }

    public function downloadDocument(Request $request, $id)
    {
        $payment = Payment::findOrFail($id);
        abort_unless($payment->slip_path && Storage::disk('public')->exists($payment->slip_path), 404, 'Payment document not found.');

        return response()->download(
            Storage::disk('public')->path($payment->slip_path),
            basename($payment->slip_path)
        );
    }

    public function verify(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isFinance() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Only Finance Officers and Super Admins can verify payments.'], 403);
        }

        $payment = Payment::with([
            'enrolment.course',
            'enrolment.representative.user',
            'enrolment.student.lead',
        ])->findOrFail($id);

        if ($payment->status === 'verified') {
            return response()->json(['message' => 'Payment already verified (Idempotency checked).', 'payment' => $payment], 200);
        }

        return DB::transaction(function () use ($payment, $user, $request) {
            $payment->update([
                'status' => 'verified',
                'verified_by' => $user->id,
                'verified_at' => now(),
                'notes' => $request->notes ?? $payment->notes,
            ]);

            $enrolment = $payment->enrolment;
            $newPaid = (float)$enrolment->payments()->where('status', 'verified')->sum('amount');
            $enrolment->update([
                'paid_amount' => $newPaid,
                'status' => 'active',
            ]);

            // Per SRS: Base commission of LKR 3,000 is awarded upon qualifying full course payment (>= LKR 40,000 or full_payment)
            $baseCommissionAmount = SystemSetting::getVal('base_commission', 3000.00);

            if ($enrolment->representative_id) {
                // If payment threshold met (>= 40,000 or full fee or full_payment line_item)
                if ($newPaid >= 40000 || $enrolment->isFullyPaid() || $payment->line_item === 'full_payment' || $payment->amount >= 40000) {
                    $exists = Commission::where('enrolment_id', $enrolment->id)
                        ->where('type', 'base')
                        ->where('status', '!=', 'reversed')
                        ->exists();

                    if (!$exists) {
                        $comCount = Commission::count() + 1;
                        Commission::create([
                            'transaction_id' => sprintf('COM-2026-%04d', $comCount),
                            'enrolment_id' => $enrolment->id,
                            'representative_id' => $enrolment->representative_id,
                            'amount' => $baseCommissionAmount,
                            'type' => 'base',
                            'status' => 'eligible',
                            'effective_date' => now()->toDateString(),
                        ]);

                        // Update lead status to paid
                        if ($enrolment->student && $enrolment->student->lead) {
                            $enrolment->student->lead->update(['status' => 'paid']);
                        }

                        // Evaluate bonus milestone tiers (5, 10, 20)
                        $this->evaluateBonusTiers($enrolment->representative_id);
                    }
                }
            }

            AuditLog::record(
                $user,
                'approve',
                'Payment',
                (string)$payment->id,
                ['status' => 'pending'],
                ['status' => 'verified', 'amount' => $payment->amount],
                'Payment verified by Finance Officer – Commission eligibility evaluated'
            );

            return response()->json([
                'message' => 'Payment verified successfully and commission eligibility calculated',
                'payment' => $payment->fresh(['enrolment.student.lead', 'enrolment.course', 'enrolment.representative.user', 'verifier']),
            ]);
        });
    }

    public function refund(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isFinance() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Only Finance Officers can process refunds.'], 403);
        }

        $request->validate([
            'amount' => 'required|numeric|min:1',
            'reason' => 'required|string',
        ]);

        $originalPayment = Payment::with('enrolment.representative')->findOrFail($id);

        return DB::transaction(function () use ($originalPayment, $request, $user) {
            $enrolment = $originalPayment->enrolment;
            $refundCount = Payment::count() + 1;
            $refundReceiptNo = sprintf('REF-2026-%04d', $refundCount);

            $refundPayment = Payment::create([
                'receipt_number' => $refundReceiptNo,
                'enrolment_id' => $enrolment->id,
                'amount' => -$request->amount,
                'line_item' => 'refund',
                'payment_method' => $originalPayment->payment_method,
                'bank_reference' => 'REF-' . $originalPayment->receipt_number,
                'payment_date' => now()->toDateString(),
                'status' => 'refunded',
                'verified_by' => $user->id,
                'verified_at' => now(),
                'parent_payment_id' => $originalPayment->id,
                'notes' => $request->reason,
            ]);

            $originalPayment->update(['status' => 'refunded']);

            // Update enrolment paid amount
            $netPaid = $enrolment->payments()->whereIn('status', ['verified', 'refunded'])->sum('amount');
            $enrolment->update([
                'paid_amount' => max(0, $netPaid),
                'status' => 'refunded',
            ]);

            // Reverse commission (SRS Section 8.6)
            $comm = Commission::where('enrolment_id', $enrolment->id)->first();
            if ($comm) {
                if (in_array($comm->status, ['eligible', 'on_hold', 'approved'])) {
                    $comm->update([
                        'status' => 'reversed',
                        'adjustment_reason' => 'Payment refunded: ' . $request->reason,
                    ]);
                } elseif ($comm->status === 'paid') {
                    // Create negative recovery commission transaction
                    $revCount = Commission::count() + 1;
                    Commission::create([
                        'transaction_id' => sprintf('COM-REV-2026-%04d', $revCount),
                        'enrolment_id' => $enrolment->id,
                        'representative_id' => $enrolment->representative_id,
                        'amount' => -$comm->amount,
                        'type' => 'reversal',
                        'status' => 'eligible',
                        'adjustment_reason' => 'Commission clawback for refunded student ' . ($enrolment->student ? $enrolment->student->student_id : ''),
                        'effective_date' => now()->toDateString(),
                    ]);
                }
            }

            // Recalculate bonus tiers for the representative
            if ($enrolment->representative_id) {
                $this->evaluateBonusTiers($enrolment->representative_id);
            }

            AuditLog::record(
                $user,
                'refund',
                'Payment',
                (string)$originalPayment->id,
                ['status' => 'verified'],
                ['status' => 'refunded', 'refund_amount' => $request->amount],
                $request->reason
            );

            return response()->json([
                'message' => 'Refund recorded, enrolment updated, and commission reversed',
                'refund_payment' => $refundPayment,
            ]);
        });
    }

    private function evaluateBonusTiers(int $repId): void
    {
        $paidCount = Enrolment::where('representative_id', $repId)
            ->where(function ($q) {
                $q->where('paid_amount', '>=', 40000)
                  ->orWhere('status', 'active');
            })
            ->where('status', '!=', 'refunded')
            ->where('is_scholarship', false)
            ->count();

        $bonus5 = SystemSetting::getVal('target_bonus_5', 5000.00);
        $bonus10 = SystemSetting::getVal('target_bonus_10', 15000.00);
        $bonus20 = SystemSetting::getVal('target_bonus_20', 40000.00);

        // Calculate highest tier bonus (SRS Section 8.3)
        $applicableBonus = 0;
        $tierName = null;

        if ($paidCount >= 20) {
            $applicableBonus = $bonus20;
            $tierName = '20-student tier';
        } elseif ($paidCount >= 10) {
            $applicableBonus = $bonus10;
            $tierName = '10-student tier';
        } elseif ($paidCount >= 5) {
            $applicableBonus = $bonus5;
            $tierName = '5-student tier';
        }

        if ($applicableBonus > 0) {
            $existingBonus = Commission::where('representative_id', $repId)
                ->where('type', 'bonus')
                ->where('status', '!=', 'reversed')
                ->first();

            if (!$existingBonus) {
                $bCount = Commission::count() + 1;
                Commission::create([
                    'transaction_id' => sprintf('COM-BONUS-2026-%04d', $bCount),
                    'representative_id' => $repId,
                    'amount' => $applicableBonus,
                    'type' => 'bonus',
                    'status' => 'eligible',
                    'adjustment_reason' => "Target bonus achieved: {$tierName} ({$paidCount} paid students)",
                    'effective_date' => now()->toDateString(),
                ]);
            } elseif ($existingBonus->amount < $applicableBonus) {
                // Upgrade to higher tier
                $existingBonus->update([
                    'amount' => $applicableBonus,
                    'adjustment_reason' => "Target bonus upgraded to {$tierName} ({$paidCount} paid students)",
                ]);
            }
        }
    }
}
