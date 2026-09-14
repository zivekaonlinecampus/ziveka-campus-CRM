import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import logoImg from '../../assets/logo.jpeg';
import { createBrandedPdf, brandedTable, finishBrandedPdf } from '../../services/brandedPdf';
import { AuditLog } from '../../types';
import { api } from '../../services/api';
import { ShieldAlert, Search, Filter, Eye, Clock, User, CheckCircle2, Download, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = () => {
    api.getAuditLogs()
      .then((res) => setLogs(res.logs))
      .catch((err) => alert(err.message));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((log) => {
    const matchesSearch =
      (log.user_name && log.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.entity_type && log.entity_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.reason && log.reason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedLogs = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const exportRows = filtered.map((log) => [
    log.created_at?.split('T')[0] || '',
    log.user_name || 'System',
    log.role || 'daemon',
    log.action,
    `${log.entity_type}${log.entity_id ? ` (#${log.entity_id})` : ''}`,
    log.reason || '',
  ]);

  const escapeCSV = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const handleExportCSV = () => {
    const headers = ['Date', 'Actor', 'Role', 'Action', 'Entity', 'Reason / Notes'];
    const csv = [headers, ...exportRows]
      .map((row) => row.map((value) => escapeCSV(String(value))).join(','))
      .join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'ziveka-audit-logs.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportPDF = async () => {
    const { pdf, drawHeader, drawFooter } = await createBrandedPdf({ title: 'Ziveka Audit Logs', subtitle: `Filtered records: ${filtered.length}`, logoUrl: logoImg });
    brandedTable(pdf, {
      head: [['Date', 'Actor', 'Role', 'Action', 'Entity', 'Reason / Notes']],
      body: exportRows,
    });
    finishBrandedPdf(pdf, drawHeader, drawFooter, 'ziveka-audit-logs.pdf');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row md:flex-col lg:flex-row justify-between items-start sm:items-center md:items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('navAudit')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('auditLogDescription')}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 md:w-full lg:w-auto">
          <button onClick={handleExportCSV} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 lg:flex-none">
            <Download className="h-3.5 w-3.5 text-slate-500" /> {t('exportCSV')}
          </button>
          <button onClick={handleExportPDF} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100 lg:flex-none">
            <FileText className="h-3.5 w-3.5" /> Export PDF
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative grow">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t('searchAuditTrail')}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
        >
          <option value="all">{t('allActions')}</option>
          <option value="create">{t('create')}</option>
          <option value="update">{t('update')}</option>
          <option value="verify">Verify</option>
          <option value="merge">{t('merge')}</option>
          <option value="refund">Refund</option>
          <option value="decision">{t('decision')}</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">{t('noAuditLogs')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">{t('timestamp')}</th>
                  <th className="py-3 px-4">{t('actor')}</th>
                  <th className="py-3 px-4">{t('action')}</th>
                  <th className="py-3 px-4">{t('entity')}</th>
                  <th className="py-3 px-4">{t('reasonNotes')}</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {log.created_at?.split('T')[0]}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.user_name || 'System'}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{log.role || 'daemon'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          log.action === 'verify' || log.action === 'create'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'update' || log.action === 'decision'
                            ? 'bg-blue-100 text-blue-800'
                            : log.action === 'refund'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{log.reason || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      {(log.old_values || log.new_values) && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                        >
                          Diff
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
            <span className="text-xs text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <span className="text-xs font-semibold text-slate-600">Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Before/After Diff Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Audit Diff Inspector</h3>
                <p className="text-xs text-slate-400">
                  {selectedLog.entity_type} • {selectedLog.action} by {selectedLog.user_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700">Justification:</span>
                <p className="text-slate-900 mt-0.5">{selectedLog.reason || 'Standard system transaction.'}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[11px]">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="font-bold text-rose-900 mb-2">Previous State (Before)</div>
                  <pre className="overflow-x-auto text-rose-800 whitespace-pre-wrap">
                    {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : 'null'}
                  </pre>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="font-bold text-emerald-900 mb-2">Updated State (After)</div>
                  <pre className="overflow-x-auto text-emerald-800 whitespace-pre-wrap">
                    {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : 'null'}
                  </pre>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 text-white font-medium text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
