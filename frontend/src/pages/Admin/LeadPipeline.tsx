import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import logoImg from '../../assets/logo.jpeg';
import { createBrandedPdf, brandedTable, finishBrandedPdf } from '../../services/brandedPdf';
import { Lead, District, Course, LeadStatus } from '../../types';
import { api } from '../../services/api';
import { MergeDuplicateModal } from '../../components/MergeDuplicateModal';
import { RecordPaymentModal } from '../../components/RecordPaymentModal';
import {
  GitPullRequest,
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List,
  AlertTriangle,
  Download,
  FileText,
  Phone,
  Mail,
  ArrowRight,
  GitMerge,
  Eye,
  CreditCard,
} from 'lucide-react';

interface LeadPipelineProps {
  leads: Lead[];
  districts: District[];
  courses: Course[];
  onOpenLeadModal: () => void;
  onRefresh: () => void;
}

export const LeadPipeline: React.FC<LeadPipelineProps> = ({
  leads,
  districts,
  courses,
  onOpenLeadModal,
  onRefresh,
}) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [duplicateFilter, setDuplicateFilter] = useState('all');
  const [activeStage, setActiveStage] = useState<LeadStatus>('new');
  const [mergeTargetLead, setMergeTargetLead] = useState<Lead | null>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedLeadForPayment, setSelectedLeadForPayment] = useState<Lead | null>(null);

  const stages: { id: LeadStatus; label: string; color: string; bg: string; actionBg: string }[] = [
    { id: 'new', label: t('status_new'), color: 'border-indigo-500 text-indigo-700', bg: 'bg-indigo-50/60', actionBg: 'bg-indigo-600 hover:bg-indigo-700' },
    { id: 'contacted', label: t('status_contacted'), color: 'border-blue-500 text-blue-700', bg: 'bg-blue-50/60', actionBg: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'qualified', label: t('status_qualified'), color: 'border-cyan-500 text-cyan-700', bg: 'bg-cyan-50/60', actionBg: 'bg-cyan-600 hover:bg-cyan-700' },
    { id: 'application', label: t('status_application'), color: 'border-purple-500 text-purple-700', bg: 'bg-purple-50/60', actionBg: 'bg-purple-600 hover:bg-purple-700' },
    { id: 'payment_pending', label: t('status_payment_pending'), color: 'border-rose-500 text-rose-700', bg: 'bg-rose-50/60', actionBg: 'bg-rose-600 hover:bg-rose-700' },
    { id: 'paid', label: t('status_paid'), color: 'border-emerald-500 text-emerald-700', bg: 'bg-emerald-50/60', actionBg: 'bg-emerald-600 hover:bg-emerald-700' },
  ];

  const filteredLeads = leads.filter((l) => {
    const isMergedRecord = Boolean(l.duplicate_of_lead_id);
    const matchesSearch =
      l.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.lead_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.mobile.includes(searchTerm) ||
      (l.email && l.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDistrict = districtFilter === 'all' || String(l.district_id) === districtFilter;
    const matchesDuplicate =
      duplicateFilter === 'all' ||
      (duplicateFilter === 'duplicates' && l.is_duplicate) ||
      (duplicateFilter === 'unique' && !l.is_duplicate);

    return !isMergedRecord && matchesSearch && matchesDistrict && matchesDuplicate;
  });

  const handleStageMove = async (leadId: number, nextStatus: LeadStatus) => {
    try {
      await api.updateLeadStatus(leadId, nextStatus);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Stage transition failed.');
    }
  };

  const getNextStage = (status: LeadStatus) => {
    const currentIndex = stages.findIndex((stage) => stage.id === status);
    return currentIndex >= 0 ? stages[currentIndex + 1] : undefined;
  };

  const handleOpenPaymentForLead = (lead: Lead) => {
    setSelectedLeadForPayment(lead);
    setIsRecordPaymentOpen(true);
  };

  const exportRows = filteredLeads.map((lead) => [
    lead.lead_id,
    lead.full_name,
    lead.mobile,
    lead.email || '',
    lead.district?.name || '',
    lead.city || '',
    lead.course?.title || '',
    lead.status,
    lead.representative?.user?.name || 'Direct Attribution',
  ]);

  const escapeCSV = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const handleExportCSV = () => {
    const headers = ['Lead ID', 'Student Name', 'Mobile', 'Email', 'District', 'City', 'Course', 'Status', 'Attributed Representative'];
    const csv = [headers, ...exportRows].map((row) => row.map((value) => escapeCSV(String(value))).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'ziveka-student-records.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportPDF = async () => {
    const { pdf, drawHeader, drawFooter } = await createBrandedPdf({ title: 'Ziveka Student Records', subtitle: `Filtered records: ${filteredLeads.length}`, logoUrl: logoImg });
    brandedTable(pdf, {
      head: [['Lead ID', 'Student Name', 'Mobile', 'Email', 'District', 'City', 'Course', 'Status', 'Representative']],
      body: exportRows,
    });
    finishBrandedPdf(pdf, drawHeader, drawFooter, 'ziveka-student-records.pdf');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-col md:flex-col lg:flex-row justify-between items-start sm:items-start md:items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('navLeads')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive pipeline stages, real-time duplicate engine, and counselling assignment
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 sm:items-stretch sm:space-x-0 md:grid md:w-full md:grid-cols-4 md:items-stretch md:space-x-0 lg:flex lg:w-auto lg:items-center lg:space-x-3 lg:gap-0">
          <button
            onClick={() => {
              setSelectedLeadForPayment(null);
              setIsRecordPaymentOpen(true);
            }}
            disabled={!leads.some((lead) => lead.status === 'payment_pending')}
            className="min-w-0 justify-center px-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-3.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Record Payment</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="min-w-0 justify-center px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors sm:px-3.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="min-w-0 justify-center px-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors sm:px-3.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={onOpenLeadModal}
            className="min-w-0 justify-center px-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors sm:px-4"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addLead')}</span>
          </button>
        </div>
      </div>

      {/* Filter and View Toggles */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-col md:flex-col lg:flex-row justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 grow">
          <div className="relative grow max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads by name, phone, NIC..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="all">All Districts</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={duplicateFilter}
            onChange={(e) => setDuplicateFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="all">All Records</option>
            <option value="duplicates">Duplicates Only (Needs Review)</option>
            <option value="unique">Unique Records Only</option>
          </select>
        </div>

        {/* Kanban vs Table Toggle */}
        <div className="flex self-end items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 lg:self-auto">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
              viewMode === 'kanban' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
              viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Pipeline View Mode: Kanban vs Table */}
      {viewMode === 'kanban' ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-2 overflow-x-auto">
            <div className="flex min-w-max gap-1">
              {stages.map((stage) => {
                const stageLeads = filteredLeads.filter((lead) => lead.status === stage.id);
                const isActive = activeStage === stage.id;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStage(stage.id)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      isActive ? `${stage.bg} ${stage.color.replace('border-', '').replace(' text-', ' ')} shadow-xs` : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span>{stage.label}</span>
                    <span className={`min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[10px] ${isActive ? 'bg-white/80' : 'bg-slate-100 text-slate-600'}`}>
                      {stageLeads.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {stages.filter((stage) => stage.id === activeStage).map((stage) => {
            const stageLeads = filteredLeads.filter((lead) => lead.status === stage.id);
            return (
              <div key={stage.id} className={`${stage.bg} rounded-2xl p-4 space-y-3 border border-slate-200/80`}>
                <div className="flex justify-between items-center px-1">
                  <div>
                    <span className={`text-sm font-black ${stage.color}`}>{stage.label}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Student records in this stage</p>
                  </div>
                  <span className="w-7 h-7 rounded-full bg-white text-slate-700 text-xs font-black flex items-center justify-center shadow-xs">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-0.5">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2.5"
                    >
                      {lead.is_duplicate && (
                        <div className="p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900 font-bold flex items-center justify-between">
                          <span className="flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Duplicate Flag</span>
                          </span>
                          <button
                            onClick={() => setMergeTargetLead(lead)}
                            className="text-indigo-600 hover:underline flex items-center space-x-0.5"
                          >
                            <GitMerge className="w-3 h-3" />
                            <span>Merge</span>
                          </button>
                        </div>
                      )}

                      <div>
                        <div className="font-bold text-xs text-slate-900 leading-tight">{lead.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{lead.lead_id}</div>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{lead.mobile}</span>
                        </div>
                        <div className="text-[10px] text-indigo-700 font-medium truncate">
                          {lead.course?.title || 'Degree Program'}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] min-w-0">
                        <div className="flex min-w-0 flex-1 items-center gap-1.5">
                          <span className="min-w-0 flex-1 truncate text-slate-400">
                            {lead.representative?.user?.name || 'Direct'}
                          </span>
                          {getNextStage(lead.status) && (
                            <button
                              onClick={() => handleStageMove(lead.id, getNextStage(lead.status)!.id)}
                              aria-label={`Move ${lead.full_name} to ${getNextStage(lead.status)!.label}`}
                              className={`inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-lg ${getNextStage(lead.status)!.actionBg} px-2 py-1 text-[9px] font-bold text-white transition-colors`}
                            >
                              <span>Move to {getNextStage(lead.status)!.label.replace(' / Enrolled', '')}</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        {lead.status === 'payment_pending' && (
                          <button
                            onClick={() => handleOpenPaymentForLead(lead)}
                            className="inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-indigo-50 px-2 py-1 text-[9px] font-bold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Record Payment</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Lead ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Mobile / Email</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Attributed Rep</th>
                  <th className="py-3 px-4 text-center">Stage</th>
                  <th className="py-3 px-4 text-center">Duplicate Check</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{lead.lead_id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{lead.full_name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{lead.mobile}</div>
                      <div className="text-[10px] text-slate-400">{lead.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{lead.district?.name || '—'}</td>
                    <td className="py-3 px-4 text-slate-700">{lead.course?.title || '—'}</td>
                    <td className="py-3 px-4">
                      {lead.representative ? (
                        <span className="font-medium text-indigo-700">
                          {lead.representative.user?.name} ({lead.representative.representative_id})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Direct Attribution</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          lead.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : lead.status === 'payment_pending'
                            ? 'bg-rose-100 text-rose-800'
                            : lead.status === 'application'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {t(`status_${lead.status}` as any) || lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {lead.is_duplicate ? (
                        <button
                          onClick={() => setMergeTargetLead(lead)}
                          className="px-2 py-0.5 bg-amber-100 text-amber-800 hover:bg-amber-200 text-[10px] font-bold rounded-md flex items-center space-x-1 mx-auto"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Flagged (Merge)</span>
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[10px]">Unique</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {lead.status === 'payment_pending' && (
                        <button
                          onClick={() => handleOpenPaymentForLead(lead)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg transition"
                        >
                          Record Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isRecordPaymentOpen && (
        <RecordPaymentModal
          isOpen={isRecordPaymentOpen}
          onClose={() => setIsRecordPaymentOpen(false)}
          onSuccess={onRefresh}
          leads={leads}
          courses={courses}
          preselectedLead={selectedLeadForPayment}
        />
      )}

      {/* Merge Duplicate Modal */}
      {mergeTargetLead && (
        <MergeDuplicateModal
          isOpen={!!mergeTargetLead}
          onClose={() => setMergeTargetLead(null)}
          duplicateLead={mergeTargetLead}
          allLeads={leads}
          onMerged={onRefresh}
        />
      )}
    </div>
  );
};
