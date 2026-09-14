import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import logoImg from '../../assets/logo.jpeg';
import { createBrandedPdf, brandedTable, finishBrandedPdf } from '../../services/brandedPdf';
import { Payment, Lead, Course } from '../../types';
import { PaymentReceiptModal } from '../../components/PaymentReceiptModal';
import { RecordPaymentModal } from '../../components/RecordPaymentModal';
import { api } from '../../services/api';
import { CreditCard, CheckCircle, Clock, Search, Filter, AlertCircle, Eye, DollarSign, RotateCcw, Plus, UserCheck, Download, FileText, X, ShieldCheck } from 'lucide-react';

interface PaymentVerificationProps {
  payments: Payment[];
  leads: Lead[];
  courses: Course[];
  onRefresh: () => void;
  canVerify: boolean;
}

export const PaymentVerification: React.FC<PaymentVerificationProps> = ({
  payments,
  leads,
  courses,
  onRefresh,
  canVerify,
}) => {
  const { t, formatCurrency } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [confirmationPaymentId, setConfirmationPaymentId] = useState<number | null>(null);

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const verifiedCount = payments.filter((p) => p.status === 'verified').length;
  const totalVerifiedAmount = payments
    .filter((p) => p.status === 'verified')
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const filtered = payments.filter((p) => {
    const studentName = p.enrolment?.student?.full_name || '';
    const repName = p.enrolment?.representative?.user?.name || '';
    const matchesSearch =
      p.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.bank_reference && p.bank_reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportRows = filtered.map((payment) => [
    payment.receipt_number,
    payment.enrolment?.student?.full_name || '',
    payment.enrolment?.representative?.user?.name || 'Direct / Organic',
    payment.line_item?.replace('_', ' ') || '',
    payment.payment_method?.replace('_', ' ') || '',
    payment.bank_reference || '',
    Number(payment.amount).toFixed(2),
    payment.status,
    payment.payment_date?.split('T')[0] || '',
  ]);

  const escapeCSV = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const handleExportCSV = () => {
    const headers = ['Receipt Number', 'Student Name', 'Representative', 'Line Item', 'Payment Method', 'Bank Reference', 'Amount LKR', 'Status', 'Payment Date'];
    const csv = [headers, ...exportRows].map((row) => row.map((value) => escapeCSV(String(value))).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'ziveka-payment-verification.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportPDF = async () => {
    const { pdf, drawHeader, drawFooter } = await createBrandedPdf({ title: 'Ziveka Payment Verification', subtitle: `Filtered receipts: ${filtered.length}`, logoUrl: logoImg });
    brandedTable(pdf, {
      head: [['Receipt', 'Student', 'Representative', 'Line Item', 'Method', 'Bank Reference', 'Amount LKR', 'Status', 'Date']],
      body: exportRows,
    });
    finishBrandedPdf(pdf, drawHeader, drawFooter, 'ziveka-payment-verification.pdf');
  };

  const handleQuickVerify = async (paymentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmationPaymentId(paymentId);
  };

  const confirmQuickVerify = async () => {
    if (!confirmationPaymentId) return;
    const paymentId = confirmationPaymentId;
    setConfirmationPaymentId(null);
    setVerifyingId(paymentId);
    try {
      await api.verifyPayment(paymentId, 'Quick verified by finance director');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Verification failed.');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-col md:flex-col lg:flex-row justify-between items-start sm:items-start md:items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">{t('navPayments')}</h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
                {pendingCount} Pending Verification
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify student tuition receipts &amp; bank slips. Verification automatically triggers representative base commissions (LKR 3,000) and unlocks milestone target bonuses.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 sm:items-stretch sm:whitespace-normal md:grid md:w-full md:grid-cols-3 md:whitespace-normal lg:flex lg:w-auto lg:whitespace-nowrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-2 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 sm:px-3.5"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50 px-2 py-2.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100 sm:px-3.5"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="col-span-2 flex min-w-0 items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-2 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-500 hover:to-blue-500 cursor-pointer sm:col-span-1 sm:px-4 md:col-span-1 lg:col-span-1"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment Receipt</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Pending Verification Queue</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount} Receipts</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting finance approval</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Verified Receipts</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{verifiedCount} Approved</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Commissions released to ledger</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Net Collections</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalVerifiedAmount)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Verified tuition fees</span>
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
            placeholder="Search by receipt number, bank reference, student name, or representative..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
        >
          <option value="all">All Verification Statuses ({payments.length})</option>
          <option value="pending">Pending Queue ({pendingCount})</option>
          <option value="verified">Verified Receipts ({verifiedCount})</option>
          <option value="refunded">Refunded / Reversed</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4 text-slate-400">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-700">No Payment Records Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {payments.length === 0
                ? 'There are currently no payment receipts recorded in the system. Click the "+ Record Payment Receipt" button above to enter a student payment slip.'
                : 'No payments match your current search or filter criteria.'}
            </p>
            {payments.length === 0 && (
              <button
                onClick={() => setIsRecordModalOpen(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                + Record First Payment
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3.5 px-4">Receipt Number</th>
                  <th className="py-3.5 px-4">Student Particulars</th>
                  <th className="py-3.5 px-4">Attributed Representative</th>
                  <th className="py-3.5 px-4">Line Item / Method</th>
                  <th className="py-3.5 px-4">Bank Ref</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const rep = p.enrolment?.representative;
                  const repUser = rep?.user;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {p.receipt_number}
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {p.payment_date?.split('T')[0]}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.enrolment?.student?.full_name || '—'}</div>
                        <div className="text-[10px] text-slate-400">
                          {p.enrolment?.student?.student_id} • {p.enrolment?.course?.title}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {rep ? (
                          <div>

                          {confirmationPaymentId && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/5 p-4 backdrop-blur-sm">
                              <div role="alertdialog" aria-modal="true" className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
                                <div className="flex items-start gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-4 text-white">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                                    <ShieldCheck className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h2 className="text-sm font-bold">Verify Payment Receipt</h2>
                                    <p className="mt-0.5 text-[11px] text-slate-300">Ziveka Online Campus</p>
                                  </div>
                                  <button type="button" onClick={() => setConfirmationPaymentId(null)} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close confirmation">
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="px-5 py-6 text-sm leading-6 text-slate-700">
                                  Verify this payment slip? This will trigger the representative base commission of LKR 3,000 and evaluate milestone bonus tiers.
                                </div>
                                <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
                                  <button type="button" onClick={() => setConfirmationPaymentId(null)} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200">Cancel</button>
                                  <button type="button" onClick={confirmQuickVerify} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                                    <ShieldCheck className="h-3.5 w-3.5" /> Verify Payment
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                            <div className="font-bold text-indigo-700">{repUser?.name || rep.representative_id}</div>
                            <div className="text-[10px] text-slate-400">
                              {rep.representative_id} • {rep.primary_district?.name || 'District Rep'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Direct / Organic</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-700 capitalize">{p.line_item?.replace('_', ' ')}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{p.payment_method?.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{p.bank_reference || 'CASH-REC'}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            p.status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {p.status === 'pending' && canVerify && (
                            <button
                              onClick={(e) => handleQuickVerify(p.id, e)}
                              disabled={verifyingId === p.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                              title="Verify payment and trigger representative commission"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{verifyingId === p.id ? 'Verifying…' : 'Verify'}</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={onRefresh}
        leads={leads}
        courses={courses}
      />

      {/* Payment Receipt Modal */}
      {selectedPayment && (
        <PaymentReceiptModal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          payment={selectedPayment}
          onPaymentUpdated={onRefresh}
          canVerify={canVerify}
        />
      )}
    </div>
  );
};
