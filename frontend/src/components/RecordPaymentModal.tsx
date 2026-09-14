import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Lead, Course } from '../types';
import { api } from '../services/api';
import { X, CreditCard, DollarSign, Calendar, FileText, CheckCircle2, User, Building, Upload, Trash2 } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leads: Lead[];
  courses: Course[];
  preselectedLead?: Lead | null;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  leads,
  courses,
  preselectedLead,
}) => {
  const { t, formatCurrency } = useLanguage();

  const [selectedLeadId, setSelectedLeadId] = useState<number | ''>(preselectedLead?.id || (leads[0]?.id || ''));
  const [amount, setAmount] = useState<number | ''>(40000);
  const [lineItem, setLineItem] = useState('full_payment');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [bankReference, setBankReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [paymentDocument, setPaymentDocument] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedLead) {
      setSelectedLeadId(preselectedLead.id);
      if (preselectedLead.course?.total_fee) {
        setAmount(Number(preselectedLead.course.total_fee));
      }
    } else if (leads.length > 0 && !selectedLeadId) {
      setSelectedLeadId(leads[0].id);
    }
  }, [preselectedLead, leads]);

  if (!isOpen) return null;

  const currentLead = leads.find((l) => l.id === Number(selectedLeadId));

  const handleLeadChange = (leadId: number) => {
    setSelectedLeadId(leadId);
    const found = leads.find((l) => l.id === leadId);
    if (found?.course?.total_fee) {
      setAmount(Number(found.course.total_fee));
    }
  };

  const handleDocumentChange = (file: File | undefined) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Upload a JPG, JPEG, PNG, WebP, GIF, BMP, or PDF file.');
      alert('Upload a JPG, JPEG, PNG, WebP, GIF, BMP, or PDF file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Payment document must be 5 MB or smaller.');
      alert('Payment document must be 5 MB or smaller.');
      return;
    }
    setError(null);
    setPaymentDocument(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) {
      setError('Please select a student lead.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }
    if (!bankReference.trim()) {
      const message = 'Bank Reference / Slip No. is required.';
      setError(message);
      alert(message);
      return;
    }
    if (!paymentDocument) {
      const message = 'Please upload the bank slip, cheque, or payment screenshot.';
      setError(message);
      alert(message);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = new FormData();
      payload.append('lead_id', String(Number(selectedLeadId)));
      payload.append('amount', String(Number(amount)));
      payload.append('line_item', lineItem);
      payload.append('payment_method', paymentMethod);
      payload.append('payment_date', paymentDate);
      if (bankReference.trim()) payload.append('bank_reference', bankReference.trim());
      if (notes.trim()) payload.append('notes', notes.trim());
      if (paymentDocument) payload.append('payment_document', paymentDocument);
      await api.recordPayment(payload);

      onSuccess();
      onClose();
    } catch (err: any) {
      const message = err.message || 'Failed to record payment receipt.';
      setError(message);
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Record Student Payment Receipt</h3>
              <p className="text-xs text-slate-500">
                Submit bank transfer / tuition payment slip for finance verification &amp; commission trigger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Lead Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Student / Lead <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedLeadId}
              onChange={(e) => handleLeadChange(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              {leads.length === 0 ? (
                <option value="">No leads available</option>
              ) : (
                leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.full_name} ({l.lead_id}) — {l.mobile} — {l.course?.title || 'No Course'} {l.representative ? `[Rep: ${l.representative.user?.name || l.representative.representative_id}]` : ''}
                  </option>
                ))
              )}
            </select>
            {currentLead?.representative && (
              <p className="text-[11px] text-indigo-600 mt-1 font-medium flex items-center space-x-1">
                <span>Attributed Representative:</span>
                <span className="font-bold">
                  {currentLead.representative.user?.name} ({currentLead.representative.representative_id})
                </span>
                <span>• Base commission of LKR 3,000 will be awarded upon verification</span>
              </p>
            )}
          </div>

          {/* Amount & Line Item */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Payment Amount (LKR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  LKR
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="40000"
                  className="w-full pl-12 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Line Item Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={lineItem}
                onChange={(e) => setLineItem(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="full_payment">Full Course Fee (LKR 40,000)</option>
                <option value="course_fee">Course Fee (Tuition)</option>
                <option value="registration_fee">Registration Fee (LKR 10,000)</option>
                <option value="instalment">Instalment Payment</option>
              </select>
            </div>
          </div>

          {/* Payment Method & Bank Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="bank_transfer">Bank Transfer / Cash Deposit</option>
                <option value="cash">Direct Campus Cash Receipt</option>
                <option value="gateway">Online Payment Gateway</option>
                <option value="cheque">Bank Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Bank Reference / Slip No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                placeholder="e.g. BOC-TXN-9988102"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
              />
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Payment Deposit Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Payment Document */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Bank Slip / Cheque / Payment Screenshot <span className="text-rose-500">*</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 hover:border-indigo-400 hover:bg-indigo-50/40">
              {paymentDocument?.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(paymentDocument)} alt="Payment document preview" className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Upload className="h-5 w-5" /></span>
              )}
              <span className="min-w-0 text-xs text-slate-600">
                <span className="block font-semibold text-slate-700">Upload payment document</span>
                <span className="block truncate text-[11px] text-slate-400">JPG, JPEG, PNG, WebP, GIF, BMP or PDF up to 5 MB</span>
                {paymentDocument && <span className="block truncate text-[11px] text-indigo-600">{paymentDocument.name}</span>}
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,application/pdf" className="sr-only" onChange={(e) => handleDocumentChange(e.target.files?.[0])} />
            </label>
            {paymentDocument && (
              <button type="button" onClick={() => setPaymentDocument(null)} className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700">
                <Trash2 className="h-3 w-3" /> Remove document
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Finance Notes / Transfer Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Verified slip deposit at Commercial Bank Maharagama branch..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || leads.length === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition disabled:opacity-50"
            >
              {submitting ? (
                <span>Recording Payment…</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save &amp; Queue for Verification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
