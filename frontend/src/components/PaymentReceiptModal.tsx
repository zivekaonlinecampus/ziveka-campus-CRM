import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Payment } from '../types';
import { api, getStorageUrl } from '../services/api';
import { X, CheckCircle, ShieldCheck, RotateCcw, FileText, Building, Calendar, DollarSign, Eye, Download } from 'lucide-react';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onPaymentUpdated: (payment: Payment) => void;
  canVerify: boolean;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
  onPaymentUpdated,
  canVerify,
}) => {
  const { t, formatCurrency } = useLanguage();
  const [notes, setNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [showSlipViewer, setShowSlipViewer] = useState(false);
  const [showVerifyConfirmation, setShowVerifyConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !payment) return null;

  const paymentDocumentUrl = payment.slip_url || (payment.slip_path ? getStorageUrl(payment.slip_path) : null);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await api.verifyPayment(payment.id, notes);
      onPaymentUpdated(res.payment);
      setShowVerifyConfirmation(false);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.refundPayment(payment.id, Number(refundAmount), refundReason);
      onPaymentUpdated(res.refund_payment);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSlip = async () => {
    if (!paymentDocumentUrl) return;
    try {
      const blobUrl = URL.createObjectURL(await api.downloadPaymentDocument(payment.id));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${payment.receipt_number}-payment-document`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(err.message || 'Payment document download failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base">Payment Receipt & Verification</h3>
              <p className="text-xs text-slate-400">{payment.receipt_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 grow">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Verification Status</div>
              <div className="text-sm font-bold text-slate-900 capitalize mt-0.5">{payment.status}</div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                payment.status === 'verified'
                  ? 'bg-emerald-100 text-emerald-800'
                  : payment.status === 'pending'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {payment.status}
            </span>
          </div>

          {/* Key Payment Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[11px] text-slate-500 font-medium">Student Name</span>
              <p className="font-semibold text-xs text-slate-900 mt-1 truncate">
                {payment.enrolment?.student?.full_name || '—'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[11px] text-slate-500 font-medium">Student ID</span>
              <p className="font-semibold text-xs text-slate-900 mt-1 font-mono">
                {payment.enrolment?.student?.student_id || '—'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[11px] text-slate-500 font-medium">Attributed Representative</span>
              <p className="font-semibold text-xs text-slate-900 mt-1 truncate">
                {payment.enrolment?.representative?.user?.name || 'Direct / Campus'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[11px] text-slate-500 font-medium">Amount Invoiced / Line Item</span>
              <p className="font-bold text-sm text-indigo-700 mt-1">
                {formatCurrency(payment.amount)}
              </p>
              <span className="text-[10px] text-slate-400 capitalize">{payment.line_item?.replace('_', ' ')}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[11px] text-slate-500 font-medium">Bank Reference</span>
              <p className="font-semibold text-xs text-slate-900 mt-1 font-mono">
                {payment.bank_reference || 'CASH-REC'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[11px] text-slate-500 font-medium">Payment Date</span>
              <p className="font-semibold text-xs text-slate-900 mt-1">
                {payment.payment_date?.split('T')[0] || '—'}
              </p>
            </div>
          </div>

          <div className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${paymentDocumentUrl ? 'border-indigo-100 bg-indigo-50/60' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex min-w-0 items-center gap-2">
              <FileText className={`h-4 w-4 shrink-0 ${paymentDocumentUrl ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800">Uploaded Payment Document</div>
                <div className="truncate text-[11px] text-slate-500">{paymentDocumentUrl ? 'Bank slip, cheque, screenshot, or PDF' : 'No document uploaded for this receipt'}</div>
              </div>
            </div>
            {paymentDocumentUrl && (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSlipViewer(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-indigo-700"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSlip}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-[11px] font-bold text-indigo-700 transition-colors hover:bg-indigo-50"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            )}
          </div>

          {/* Verification Notes */}
          {payment.status === 'pending' && canVerify && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Finance Verification Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Bank of Ceylon transaction matched with statement batch #482."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Refund Sub-form */}
          {showRefundForm && (
            <form onSubmit={handleRefund} className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
              <div className="font-bold text-xs text-rose-900">Process Refund & Commission Reversal</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-rose-800 mb-1">Refund Amount (LKR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    max={payment.amount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="40000"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-rose-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-rose-800 mb-1">Reason for Refund</label>
                  <input
                    type="text"
                    required
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Student withdrawal / course transfer"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-rose-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRefundForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
                >
                  Confirm Refund & Reversal
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <div>
            {payment.status === 'verified' && canVerify && !showRefundForm && (
              <button
                type="button"
                onClick={() => {
                  setShowRefundForm(true);
                  setRefundAmount(String(payment.amount));
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Process Refund</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              {t('close')}
            </button>
            {payment.status === 'pending' && canVerify && (
              <button
                onClick={() => setShowVerifyConfirmation(true)}
                disabled={loading}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Verify & Credit Commission</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showVerifyConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md">
          <div role="alertdialog" aria-modal="true" className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-4 text-white">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold">Verify Payment Receipt</h2>
                <p className="mt-0.5 text-[11px] text-slate-300">Ziveka Online Campus</p>
              </div>
              <button type="button" onClick={() => setShowVerifyConfirmation(false)} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close confirmation">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-6 text-sm leading-6 text-slate-700">
              Verify this payment slip? This will trigger the representative base commission of LKR 3,000 and evaluate milestone bonus tiers.
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
              <button type="button" onClick={() => setShowVerifyConfirmation(false)} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200">Cancel</button>
              <button type="button" onClick={handleVerify} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                <ShieldCheck className="h-3.5 w-3.5" /> {loading ? 'Verifying...' : 'Verify Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSlipViewer && paymentDocumentUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="flex h-[min(88vh,760px)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-4 text-white">
              <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-amber-300" /><div><h2 className="text-sm font-bold">Payment Document</h2><p className="text-[11px] text-slate-300">{payment.receipt_number}</p></div></div>
              <button type="button" onClick={() => setShowSlipViewer(false)} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-100 p-4">
              {paymentDocumentUrl.match(/\.(jpg|jpeg|png|webp|gif|bmp)(\?|$)/i) ? (
                <img src={paymentDocumentUrl} alt="Uploaded payment document" className="max-h-full max-w-full rounded-xl object-contain shadow-lg" />
              ) : (
                <iframe src={paymentDocumentUrl} title="Uploaded payment PDF" className="h-full w-full rounded-xl border border-slate-300 bg-white" />
              )}
            </div>
            <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-3">
              <button type="button" onClick={() => setShowSlipViewer(false)} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
