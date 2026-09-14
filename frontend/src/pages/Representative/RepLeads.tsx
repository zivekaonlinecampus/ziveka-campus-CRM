import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Lead } from '../../types';
import { Search, Filter, UserPlus, AlertCircle, Phone, Mail, Calendar } from 'lucide-react';

interface RepLeadsProps {
  leads: Lead[];
  onOpenLeadModal: () => void;
}

export const RepLeads: React.FC<RepLeadsProps> = ({ leads, onOpenLeadModal }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = leads.filter((l) => {
    const matchesSearch =
      l.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.mobile.includes(searchTerm) ||
      (l.email && l.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      l.lead_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('navMyLeads')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your attributed student inquiries and track enrolment stages
          </p>
        </div>
        <button
          onClick={onOpenLeadModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('addLead')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative grow">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
        >
          <option value="all">All Pipeline Stages</option>
          <option value="new">{t('status_new')}</option>
          <option value="contacted">{t('status_contacted')}</option>
          <option value="qualified">{t('status_qualified')}</option>
          <option value="application">{t('status_application')}</option>
          <option value="payment_pending">{t('status_payment_pending')}</option>
          <option value="paid">{t('status_paid')}</option>
          <option value="lost">{t('status_lost')}</option>
          <option value="scholarship">{t('status_scholarship')}</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No student leads found matching this criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Lead ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Interested Course</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{lead.lead_id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{lead.full_name}</div>
                      {lead.nic_passport && (
                        <div className="text-[10px] text-slate-400 font-mono">NIC: {lead.nic_passport}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 space-y-0.5">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{lead.mobile}</span>
                      </div>
                      {lead.email && (
                        <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{lead.course?.title || 'General Degree Inquiry'}</div>
                      <div className="text-[10px] text-slate-400">{lead.intake || '2026-Q3'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{lead.district?.name || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          lead.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : lead.status === 'application' || lead.status === 'payment_pending'
                            ? 'bg-amber-100 text-amber-800'
                            : lead.status === 'lost'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {t(`status_${lead.status}` as any) || lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {lead.created_at?.split('T')[0] || '2026-08-20'}
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
