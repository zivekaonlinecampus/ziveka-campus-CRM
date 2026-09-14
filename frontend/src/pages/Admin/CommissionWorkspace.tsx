import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import logoImg from '../../assets/logo.jpeg';
import { createBrandedPdf, brandedTable, finishBrandedPdf } from '../../services/brandedPdf';
import { Commission, Representative } from '../../types';
import { api } from '../../services/api';
import { Percent, Award, CheckCircle, CheckCircle2, Plus, Search, Filter, ShieldCheck, DollarSign, X, Download, FileText } from 'lucide-react';

interface CommissionWorkspaceProps {
  commissions: Commission[];
  representatives: Representative[];
  onRefresh: () => void;
  canApprove: boolean;
}

export const CommissionWorkspace: React.FC<CommissionWorkspaceProps> = ({
  commissions,
  representatives,
  onRefresh,
  canApprove,
}) => {
  const { t, formatCurrency } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [commissionToApprove, setCommissionToApprove] = useState<Commission | null>(null);
  const [approving, setApproving] = useState(false);

  const [adjustForm, setAdjustForm] = useState({
    representative_id: representatives[0]?.id || 1,
    amount: '',
    reason: '',
  });

  const filtered = commissions.filter((c) => {
    const matchesSearch =
      c.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.representative?.user?.name && c.representative.user.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async () => {
    if (!commissionToApprove) return;

    setApproving(true);
    try {
      await api.approveCommission(commissionToApprove.id);
      setCommissionToApprove(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setApproving(false);
    }
  };

  const exportRows = filtered.map((commission) => [
    commission.transaction_id,
    commission.representative?.user?.name || '',
    commission.enrolment?.student?.full_name || commission.adjustment_reason || 'Target Milestone Bonus',
    commission.type,
    formatCurrency(commission.amount),
    commission.status,
  ]);

  const escapeCSV = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Representative', 'Student / Particulars', 'Type', 'Amount', 'Status'];
    const csv = [headers, ...exportRows]
      .map((row) => row.map((value) => escapeCSV(String(value))).join(','))
      .join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'ziveka-commission-bonuses.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportPDF = async () => {
    const { pdf, drawHeader, drawFooter } = await createBrandedPdf({ title: 'Ziveka Commission & Bonuses', subtitle: `Filtered commissions: ${filtered.length}`, logoUrl: logoImg });
    brandedTable(pdf, {
      head: [['Transaction ID', 'Representative', 'Student / Particulars', 'Type', 'Amount', 'Status']],
      body: exportRows,
    });
    finishBrandedPdf(pdf, drawHeader, drawFooter, 'ziveka-commission-bonuses.pdf');
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjusting(true);
    try {
      await api.adjustCommission(
        Number(adjustForm.representative_id),
        Number(adjustForm.amount),
        adjustForm.reason
      );
      setShowAdjustModal(false);
      setAdjustForm({
        representative_id: representatives[0]?.id || 1,
        amount: '',
        reason: '',
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Adjustment failed');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('navCommissions')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Base commission approvals (LKR 3,000), target bonus evaluations (5/10/20 tiers), and audit-logged manual adjustments
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
          {canApprove && (
            <button
              onClick={() => setShowAdjustModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Manual Adjustment</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative grow">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by transaction ID, representative name..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 text-slate-700"
        >
          <option value="all">All Commission Statuses</option>
          <option value="eligible">Eligible (Awaiting Approval)</option>
          <option value="approved">Approved for Payout</option>
          <option value="paid">Paid Out</option>
          <option value="reversed">Reversed</option>
        </select>
      </div>

      {/* Commission Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Percent className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No commission items found matching this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Representative</th>
                  <th className="py-3 px-4">Student / Particulars</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.transaction_id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{c.representative?.user?.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {c.representative?.representative_id}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {c.enrolment?.student?.full_name || c.adjustment_reason || 'Target Milestone Bonus'}
                      </div>
                      <div className="text-[10px] text-slate-400">{c.effective_date?.split('T')[0]}</div>
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold text-slate-700">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] ${
                          c.type === 'bonus' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(c.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          c.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : c.status === 'reversed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {c.status === 'eligible' && canApprove && (
                        <button
                          onClick={() => setCommissionToApprove(c)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors"
                        >
                          Approve Payout
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {commissionToApprove && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md">
          <div role="alertdialog" aria-modal="true" className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-4 text-white">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold">Approve Commission Payout</h2>
                <p className="mt-0.5 text-[11px] text-slate-300">Ziveka Online Campus</p>
              </div>
              <button type="button" onClick={() => setCommissionToApprove(null)} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close confirmation">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 px-5 py-6 text-sm text-slate-700">
              <p>Are you sure you want to approve this commission payout?</p>
              <p className="font-bold text-slate-900">{commissionToApprove.representative?.user?.name || 'Representative'}</p>
              <p className="text-xs text-slate-500">{commissionToApprove.transaction_id} · {formatCurrency(commissionToApprove.amount)}</p>
              <p className="text-xs text-emerald-700">This will mark the commission as approved for payout.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
              <button type="button" onClick={() => setCommissionToApprove(null)} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200">Cancel</button>
              <button type="button" onClick={handleApprove} disabled={approving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                <CheckCircle2 className="h-3.5 w-3.5" /> {approving ? 'Approving...' : 'Yes, Approve Payout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">Manual Commission Adjustment</h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Representative *</label>
                <select
                  value={adjustForm.representative_id}
                  onChange={(e) => setAdjustForm({ ...adjustForm, representative_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  {representatives.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.user?.name} ({r.representative_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Amount (LKR) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  placeholder="e.g. 5000 or -3000"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mandatory Audit Reason *</label>
                <textarea
                  rows={2}
                  required
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="e.g. Special campaign performance award authorized by management..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                >
                  {adjusting ? t('loading') : 'Save Adjustment (Audit Logged)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
