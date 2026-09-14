import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { X, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

interface DrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  data: any[];
  type: 'commissions' | 'leads' | 'payments' | 'scholarships' | 'representatives' | 'generic';
}

export const DrilldownModal: React.FC<DrilldownModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  data,
  type,
}) => {
  const { t, formatCurrency } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto grow">
          {data.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No records found matching this criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                    <th className="py-2.5 px-3">Identifier / Ref</th>
                    <th className="py-2.5 px-3">Name / Title</th>
                    <th className="py-2.5 px-3">Detail</th>
                    <th className="py-2.5 px-3 text-right">Amount / Value</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((item, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-slate-900">
                        {item.transaction_id || item.receipt_number || item.lead_id || item.representative_id || item.application_id || `#${idx + 1}`}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {item.full_name || item.applicant_name || item.name || item.representative?.user?.name || '—'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.email || item.mobile || item.course?.title || item.type || ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {item.district?.name || item.primary_district?.name || item.line_item || item.hold_reason || item.notes || item.period || '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-900">
                        {item.amount !== undefined
                          ? formatCurrency(item.amount)
                          : item.total_fee !== undefined
                          ? formatCurrency(item.total_fee)
                          : item.waiver_amount !== undefined
                          ? formatCurrency(item.waiver_amount)
                          : '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'paid' || item.status === 'verified' || item.status === 'approved' || item.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'pending' || item.status === 'eligible' || item.status === 'submitted' || item.status === 'application'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'reversed' || item.status === 'refunded' || item.status === 'lost' || item.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {item.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>Showing {data.length} records</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-xs transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
