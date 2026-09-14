<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function globalDashboard(Request $request)
    {
        abort_unless(!$request->user()?->isRepresentative(), 403);

        $summary = DB::selectOne("
            SELECT
                (SELECT COUNT(*) FROM leads) AS total_leads,
                (SELECT COUNT(*) FROM leads WHERE status != 'lost') AS verified_leads,
                (SELECT COUNT(*) FROM enrolments WHERE paid_amount >= 40000 AND is_scholarship = false) AS paid_enrolments,
                (SELECT COALESCE(SUM(total_fee), 0) FROM enrolments) AS gross_fees,
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'verified') AS net_collected,
                (SELECT COALESCE(ABS(SUM(amount)), 0) FROM payments WHERE status = 'refunded' AND amount < 0) AS refunds,
                (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE type = 'base' AND status IN ('eligible','approved')) AS commission_payable,
                (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE type = 'bonus' AND status IN ('eligible','approved')) AS bonus_payable,
                (SELECT COALESCE(SUM(waiver_amount), 0) FROM scholarships WHERE status = 'approved') AS scholarship_value
        ");

        $grossFees        = (float)($summary->gross_fees ?? 0);
        $netCollected     = (float)($summary->net_collected ?? 0);
        $scholarshipValue = (float)($summary->scholarship_value ?? 0);
        $outstanding      = max(0, $grossFees - $netCollected - $scholarshipValue);
        $verifiedLeads    = (int)($summary->verified_leads ?? 0);
        $paidEnrolments   = (int)($summary->paid_enrolments ?? 0);

        $funnelRows = DB::select("SELECT status, COUNT(*) AS cnt FROM leads GROUP BY status");
        $funnelRaw  = collect($funnelRows)->pluck('cnt', 'status')->toArray();
        $funnel = [
            'new'             => (int)($funnelRaw['new'] ?? 0),
            'contacted'       => (int)($funnelRaw['contacted'] ?? 0),
            'qualified'       => (int)($funnelRaw['qualified'] ?? 0),
            'application'     => (int)($funnelRaw['application'] ?? 0),
            'payment_pending' => (int)($funnelRaw['payment_pending'] ?? 0),
            'paid'            => (int)($funnelRaw['paid'] ?? 0),
            'scholarship'     => (int)($funnelRaw['scholarship'] ?? 0),
            'lost'            => (int)($funnelRaw['lost'] ?? 0),
        ];

        $districtRows = DB::select("
            SELECT
                d.id, d.name, d.name_si, d.code, d.province,
                COUNT(DISTINCT l.id) AS leads_count,
                COUNT(DISTINCT r.id) AS reps_count,
                COUNT(DISTINCT e.id) AS paid_students_count,
                COALESCE(SUM(p.amount), 0) AS revenue
            FROM districts d
            LEFT JOIN leads l ON l.district_id = d.id
            LEFT JOIN representatives r ON r.primary_district_id = d.id
            LEFT JOIN enrolments e
                ON e.representative_id = r.id
                AND e.paid_amount >= 40000
                AND e.is_scholarship = false
            LEFT JOIN payments p
                ON p.enrolment_id = e.id
                AND p.status = 'verified'
            GROUP BY d.id, d.name, d.name_si, d.code, d.province
            ORDER BY d.name
        ");
        $districts = collect($districtRows)->map(fn($d) => [
            'id'                  => $d->id,
            'name'                => $d->name,
            'name_si'             => $d->name_si,
            'code'                => $d->code,
            'province'            => $d->province,
            'leads_count'         => (int)$d->leads_count,
            'reps_count'          => (int)$d->reps_count,
            'paid_students_count' => (int)$d->paid_students_count,
            'revenue'             => (float)$d->revenue,
        ]);

        $exc = DB::selectOne("
            SELECT
                (SELECT COUNT(*) FROM leads WHERE is_duplicate = true AND status != 'lost') AS duplicate_disputes,
                (SELECT COUNT(*) FROM payments WHERE status = 'pending') AS unverified_payments,
                (SELECT COUNT(*) FROM leads WHERE nic_passport IS NULL AND status IN ('application','payment_pending','paid')) AS missing_nics,
                (SELECT COUNT(*) FROM scholarships WHERE status = 'submitted') AS pending_scholarships
        ");

        return response()->json([
            'summary' => [
                'total_leads'        => (int)($summary->total_leads ?? 0),
                'verified_leads'     => $verifiedLeads,
                'paid_enrolments'    => $paidEnrolments,
                'gross_fees'         => $grossFees,
                'net_collected'      => $netCollected,
                'refunds'            => (float)($summary->refunds ?? 0),
                'outstanding'        => $outstanding,
                'commission_payable' => (float)($summary->commission_payable ?? 0),
                'bonus_payable'      => (float)($summary->bonus_payable ?? 0),
                'scholarship_value'  => $scholarshipValue,
                'conversion_rate'    => $verifiedLeads > 0 ? round(($paidEnrolments / $verifiedLeads) * 100, 1) : 0,
            ],
            'funnel'     => $funnel,
            'districts'  => $districts,
            'exceptions' => [
                'duplicate_disputes'   => (int)($exc->duplicate_disputes ?? 0),
                'unverified_payments'  => (int)($exc->unverified_payments ?? 0),
                'missing_nics'         => (int)($exc->missing_nics ?? 0),
                'pending_scholarships' => (int)($exc->pending_scholarships ?? 0),
            ],
        ]);
    }

    public function repPerformance(Request $request)
    {
        abort_unless(!$request->user()?->isRepresentative(), 403);

        $weights = SystemSetting::getVal('quality_score_weights', [
            'paid_enrolment_rate' => 30,
            'day_30_persistence'  => 25,
            'net_revenue'         => 20,
            'refund_rate'         => 15,
            'compliance'          => 10,
        ]);

        $rows = DB::select("
            SELECT
                r.id, r.representative_id, r.status, r.document_verified, r.quality_score,
                u.name, u.email, u.mobile,
                d.name AS district, d.name_si AS district_si,
                COUNT(DISTINCT l.id)   AS leads_count,
                COUNT(DISTINCT e.id)   AS paid_count,
                COUNT(DISTINCT re2.id) AS refunded_count,
                COALESCE(SUM(p.amount), 0) AS revenue,
                COALESCE(SUM(c.amount), 0) AS commission_total
            FROM representatives r
            JOIN users u ON u.id = r.user_id
            LEFT JOIN districts d ON d.id = r.primary_district_id
            LEFT JOIN leads l ON l.representative_id = r.id
            LEFT JOIN enrolments e
                ON e.representative_id = r.id
                AND e.paid_amount >= 40000
                AND e.is_scholarship = false
            LEFT JOIN enrolments re2
                ON re2.representative_id = r.id
                AND re2.status = 'refunded'
            LEFT JOIN payments p
                ON p.enrolment_id = e.id
                AND p.status = 'verified'
            LEFT JOIN commissions c
                ON c.representative_id = r.id
                AND c.status IN ('eligible','approved','paid')
            GROUP BY r.id, r.representative_id, r.status, r.document_verified,
                     r.quality_score, u.name, u.email, u.mobile, d.name, d.name_si
            ORDER BY r.quality_score DESC
        ");

        $performance = collect($rows)->map(function ($rep) {
            $leadsCount    = (int)$rep->leads_count;
            $paidCount     = (int)$rep->paid_count;
            $refundedCount = (int)$rep->refunded_count;
            $revenue       = (float)$rep->revenue;

            $conversionRate = $leadsCount > 0 ? ($paidCount / $leadsCount) * 100 : 0;
            $refundRate     = $paidCount  > 0 ? ($refundedCount / $paidCount) * 100 : 0;
            $score = ($conversionRate * 0.4) + (min(100, $revenue / 4000) * 0.3) + ((100 - $refundRate) * 0.3);

            return [
                'id'                => $rep->id,
                'representative_id' => $rep->representative_id,
                'name'              => $rep->name,
                'email'             => $rep->email,
                'mobile'            => $rep->mobile,
                'district'          => $rep->district,
                'district_si'       => $rep->district_si,
                'leads_count'       => $leadsCount,
                'paid_count'        => $paidCount,
                'conversion_rate'   => round($conversionRate, 1),
                'refund_rate'       => round($refundRate, 1),
                'revenue'           => $revenue,
                'commission_total'  => (float)$rep->commission_total,
                'quality_score'     => round(max(0, min(100, $score)), 1),
                'status'            => $rep->status,
            ];
        });

        return response()->json([
            'performance' => $performance,
            'weights'     => $weights,
        ]);
    }
}
