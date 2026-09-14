import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Lead } from '../types';
import { api } from '../services/api';
import { X, GitMerge, AlertCircle, CheckCircle } from 'lucide-react';

interface MergeDuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicateLead: Lead | null;
  allLeads: Lead[];
  onMerged: () => void;
}

export const MergeDuplicateModal: React.FC<MergeDuplicateModalProps> = ({
  isOpen,
  onClose,
  duplicateLead,
  allLeads,
  onMerged,
}) => {
  const { t } = useLanguage();
  const [selectedMasterId, setSelectedMasterId] = useState<number | ''>('');
  const [reason, setReason] = useState('Duplicate entry confirmed; merging activities and payment records into master lead.');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !duplicateLead) return null;

  const candidateMasters = allLeads.filter(
    (l) => l.id !== duplicateLead.id && !l.is_duplicate && l.status !== 'lost'
  );

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMasterId) {
      alert('Please select a master lead record to merge into.');
      return;
    }

    setLoading(true);
    try {
      await api.mergeLead(duplicateLead.id, Number(selectedMasterId), reason);
      onMerged();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to merge leads.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2">
            <GitMerge className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base">Merge Duplicate Record</h3>
              <p className="text-xs text-slate-400">Data Integrity & Master Attribution Resolution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleMerge} className="p-6 overflow-y-auto space-y-4 grow">
          {/* Duplicate Record Summary */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
            <span className="font-bold text-amber-900">Secondary / Duplicate Record to Merge:</span>
            <div className="font-bold text-slate-900 text-sm">{duplicateLead.full_name}</div>
            <div className="text-slate-600 font-mono text-[11px]">
              ID: {duplicateLead.lead_id} • Mobile: {duplicateLead.mobile} • NIC: {duplicateLead.nic_passport || 'N/A'}
            </div>
            <div className="text-slate-500 text-[10px]">
              Attributed to: {duplicateLead.representative?.user?.name || 'Direct Campus'}
            </div>
          </div>

          {/* Master Record Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Destination Master Lead Record *
            </label>
            <select
              required
              value={selectedMasterId}
              onChange={(e) => setSelectedMasterId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Master Lead --</option>
              {candidateMasters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.lead_id} - {m.full_name} ({m.mobile}) [{m.status}]
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Audit Reason & Justification *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
            <strong>Data Integrity Rule:</strong> All activities, call notes, counselling tasks, and payment history will be migrated to the master record. The duplicate lead ID will be preserved and flagged as merged with full audit traceability.
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
            >
              {loading ? t('loading') : 'Execute Record Merge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
