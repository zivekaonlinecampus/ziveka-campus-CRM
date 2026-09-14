import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Scholarship } from '../../types';
import { api } from '../../services/api';
import { requestPrompt } from '../../components/ThemedAlertHost';
import { Award, CheckCircle, XCircle, Clock, Search, Filter, Sparkles } from 'lucide-react';

interface ScholarshipBoardProps {
  scholarships: Scholarship[];
  quota: any;
  onRefresh: () => void;
  canReview: boolean;
}

export const ScholarshipBoard: React.FC<ScholarshipBoardProps> = ({
  scholarships,
  quota,
  onRefresh,
  canReview,
}) => {
  const { t, formatCurrency } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const totalQuota = quota?.total_quota || 10;
  const approvedQuota = quota?.approved || scholarships.filter((s) => s.status === 'approved').length;
  const remainingQuota = Math.max(0, totalQuota - approvedQuota);

  const filtered = scholarships.filter((s) => {
    const matchesSearch =
      s.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.application_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.district?.name && s.district.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDecision = async (id: number, decision: string) => {
    const scoreStr = decision === 'approved' ? await requestPrompt('Enter committee score (0 - 100):', '85') : null;
    const score = scoreStr ? Number(scoreStr) : undefined;
    const notes = await requestPrompt('Enter review committee notes:', decision === 'approved' ? 'Meets low income hardship criteria' : 'Waitlisted for next intake');

    try {
      await api.decisionScholarship(id, decision, score, notes || undefined);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Decision update failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Quota Visualizer */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold mb-1">
            <Award className="w-4 h-4" />
            <span>Community Scholarship Governance</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">{t('navScholarships')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review nominations, score financial need, allocate 100% tuition waivers (LKR 40,000) under strict quota caps
          </p>
        </div>

        {/* Quota Gauge */}
        <div className="flex items-center space-x-4 bg-indigo-50/60 border border-indigo-100 p-3 rounded-2xl">
          <div>
            <div className="text-[10px] font-bold text-indigo-900 uppercase">Quota Allocation (2026-Q3)</div>
            <div className="text-sm font-black text-indigo-950 mt-0.5">
              {approvedQuota} of {totalQuota} Used
            </div>
          </div>
          <div className="px-3 py-1 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs">
            {remainingQuota} Available
          </div>
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
            placeholder="Search by candidate name, application ID, district..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 text-slate-700"
        >
          <option value="all">All Nomination Statuses</option>
          <option value="submitted">Submitted / Under Review</option>
          <option value="approved">Approved (100% Fee Waiver)</option>
          <option value="waitlisted">Waitlisted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Scholarship Applications Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No scholarship applications found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Applicant & District</th>
                  <th className="py-3 px-4">Course Program</th>
                  <th className="py-3 px-4">Hardship & Motivation Summary</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Committee Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.application_id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{s.applicant_name}</div>
                      <div className="text-[10px] text-slate-400">
                        {s.district?.name} • Rep: {s.representative?.user?.name || 'Direct'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{s.course?.title}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                      {s.financial_need_summary}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-700">
                      {s.score ? `${s.score}/100` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          s.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'under_review' || s.status === 'submitted'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {s.status !== 'approved' && canReview && remainingQuota > 0 && (
                        <button
                          onClick={() => handleDecision(s.id, 'approved')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-2xs transition-colors"
                        >
                          Approve 100% Waiver
                        </button>
                      )}
                      {s.status !== 'rejected' && canReview && (
                        <button
                          onClick={() => handleDecision(s.id, 'rejected')}
                          className="px-2 py-1 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-bold text-[10px] rounded-lg transition-colors"
                        >
                          Reject
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
    </div>
  );
};
