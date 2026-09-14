import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Lead, Activity, Course } from '../../types';
import { RecordPaymentModal } from '../../components/RecordPaymentModal';
import { api } from '../../services/api';
import { GraduationCap, PhoneCall, Calendar, CheckSquare, MessageSquare, Plus, CheckCircle, Clock, CreditCard } from 'lucide-react';

interface AdmissionsWorkspaceProps {
  leads: Lead[];
  activities: Activity[];
  courses?: Course[];
  onRefresh: () => void;
}

export const AdmissionsWorkspace: React.FC<AdmissionsWorkspaceProps> = ({
  leads,
  activities,
  courses = [],
  onRefresh,
}) => {
  const { t } = useLanguage();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(leads[0] || null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  const [interactionForm, setInteractionForm] = useState({
    type: 'call',
    outcome: 'Interested in weekend batch',
    next_follow_up_date: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setSubmitting(true);
    try {
      await api.logActivity({
        lead_id: selectedLead.id,
        ...interactionForm,
      });
      setInteractionForm({
        type: 'call',
        outcome: '',
        next_follow_up_date: '',
        notes: '',
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to log activity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvanceToPaymentPending = async () => {
    if (!selectedLead) return;
    try {
      await api.updateLeadStatus(selectedLead.id, 'payment_pending', undefined, 'Counselling complete. Student agreed to fee schedule.');
      onRefresh();
    } catch (err: any) {
      alert('Failed to advance stage.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('navAdmissions')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Student counselling interaction logs, document verification checklist, and tuition fee collection
          </p>
        </div>

        <button
          onClick={() => setIsRecordPaymentOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition"
        >
          <CreditCard className="w-4 h-4" />
          <span>Record Student Payment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Counselling Queue (Left Column) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Active Counselling Queue ({leads.length})
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto pr-1">
            {leads.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No active leads in queue.</p>
            ) : (
              leads.slice(0, 20).map((l) => (
                <div
                  key={l.id}
                  onClick={() => setSelectedLead(l)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all ${
                    selectedLead?.id === l.id
                      ? 'bg-indigo-50 border border-indigo-200 shadow-xs'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{l.full_name}</h4>
                      <p className="text-[11px] text-slate-500">{l.course?.title || 'Degree Inquiry'}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        l.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : l.status === 'application'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>{l.mobile}</span>
                    <span>District: {l.district?.name}</span>
                  </div>
                  {l.representative && (
                    <div className="text-[10px] text-indigo-600 mt-1 font-medium">
                      Rep: {l.representative.user?.name || l.representative.representative_id}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lead Counselling Workspace & Interaction History (Right Column) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          {selectedLead ? (
            <>
              {/* Selected Lead Overview Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{selectedLead.full_name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedLead.lead_id} • {selectedLead.mobile} • {selectedLead.course?.title}
                  </p>
                  {selectedLead.representative && (
                    <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
                      Attributed Rep: {selectedLead.representative.user?.name} ({selectedLead.representative.representative_id})
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsRecordPaymentOpen(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </button>
                  {selectedLead.status !== 'paid' && selectedLead.status !== 'payment_pending' && (
                    <button
                      onClick={handleAdvanceToPaymentPending}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Convert
                    </button>
                  )}
                </div>
              </div>

              {/* Log Interaction Form */}
              <form onSubmit={handleLogInteraction} className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <div className="font-bold text-xs text-indigo-950 flex items-center space-x-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Log Counselling Interaction &amp; Next Action</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Channel / Type</label>
                    <select
                      value={interactionForm.type}
                      onChange={(e) => setInteractionForm({ ...interactionForm, type: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="call">Phone Call</option>
                      <option value="counselling">Live Zoom / Physical Session</option>
                      <option value="note">Internal Assessment Note</option>
                      <option value="document_upload">Document Check</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Outcome</label>
                    <input
                      type="text"
                      value={interactionForm.outcome}
                      onChange={(e) => setInteractionForm({ ...interactionForm, outcome: e.target.value })}
                      placeholder="e.g. Needs scholarship or instalment plan"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                    </input>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Discussion Notes &amp; Guidance Given</label>
                  <textarea
                    rows={2}
                    required
                    value={interactionForm.notes}
                    onChange={(e) => setInteractionForm({ ...interactionForm, notes: e.target.value })}
                    placeholder="Explained dual qualification curriculum, LMS credentials, and fee structure..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                  >
                    {submitting ? t('loading') : 'Save Interaction Log'}
                  </button>
                </div>
              </form>

              {/* Interaction History Feed */}
              <div className="space-y-3">
                <div className="font-bold text-xs text-slate-800 uppercase tracking-wider">Counselling Timeline</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activities.filter((a) => a.lead_id === selectedLead.id).length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">No previous interaction notes recorded.</p>
                  ) : (
                    activities
                      .filter((a) => a.lead_id === selectedLead.id)
                      .map((act) => (
                        <div key={act.id} className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-100">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-bold text-indigo-700 uppercase">{act.type}</span>
                            <span>{act.created_at?.split('T')[0]}</span>
                          </div>
                          <p className="font-medium text-slate-800 mt-1">{act.notes}</p>
                          {act.outcome && <div className="text-[11px] text-slate-500 mt-1">Outcome: {act.outcome}</div>}
                        </div>
                      ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Select a student from the queue to start counselling.</p>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {isRecordPaymentOpen && (
        <RecordPaymentModal
          isOpen={isRecordPaymentOpen}
          onClose={() => setIsRecordPaymentOpen(false)}
          onSuccess={onRefresh}
          leads={leads}
          courses={courses}
          preselectedLead={selectedLead}
        />
      )}
    </div>
  );
};
