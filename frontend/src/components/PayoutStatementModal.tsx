import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { X, Printer, Download, CheckCircle2, Building2, User } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

interface PayoutStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  statementData: any;
}

export const PayoutStatementModal: React.FC<PayoutStatementModalProps> = ({
  isOpen,
  onClose,
  statementData,
}) => {
  const { t, formatCurrency } = useLanguage();

  if (!isOpen || !statementData) return null;

  const { representative, summary, items, statement_number, statement_date } = statementData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Action Header - Hidden during print */}
        <div className="no-print px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base">{t('stmtTitle')}</h3>
              <p className="text-xs text-slate-400">{statement_number}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('printStatement')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Statement Sheet */}
        <div className="p-8 overflow-y-auto space-y-6 grow bg-white text-slate-800 font-sans" id="printable-voucher">
          {/* Statement Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div className="flex items-center space-x-3">
              <img src={logoImg} alt="Ziveka Campus Logo" className="h-14 w-auto object-contain rounded-md" />
              <div>
                <h1 className="text-xl font-black text-slate-950 tracking-tight">{t('appName')}</h1>
                <p className="text-xs text-slate-500 font-medium">{t('tagline')}</p>
                <p className="text-[11px] text-slate-400">Head Office: Colombo, Sri Lanka • info@zivekacampus.com</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-full uppercase tracking-wider mb-2">
                Commission Statement
              </span>
              <div className="text-xs font-mono text-slate-500">Ref: {statement_number}</div>
              <div className="text-xs text-slate-500">{t('stmtDate')}: {statement_date}</div>
            </div>
          </div>

          {/* Representative & Bank Info */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Representative Profile</div>
              <div className="font-bold text-sm text-slate-900">{representative.user?.name}</div>
              <div className="text-xs text-slate-600 font-mono mt-0.5">ID: {representative.representative_id}</div>
              <div className="text-xs text-slate-600">District: {representative.primary_district?.name}</div>
              <div className="text-xs text-slate-600">Mobile: {representative.user?.mobile}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Disbursement Bank Account</div>
              <div className="font-bold text-sm text-slate-900">{representative.bank_name || 'Bank of Ceylon'}</div>
              <div className="text-xs text-slate-600">Branch: {representative.bank_branch || 'Main Branch'}</div>
              <div className="text-xs text-slate-600">Account Name: {representative.account_name || representative.user?.name}</div>
              <div className="text-xs font-mono font-bold text-indigo-700">A/C: {representative.account_number || 'XXXXXXXXXX'}</div>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <div className="text-[11px] text-indigo-800 font-medium">{t('stmtEarned')}</div>
              <div className="text-base font-extrabold text-indigo-950 mt-1">{formatCurrency(summary.total_earned)}</div>
            </div>
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div className="text-[11px] text-emerald-800 font-medium">{t('stmtPaid')}</div>
              <div className="text-base font-extrabold text-emerald-950 mt-1">{formatCurrency(summary.total_paid)}</div>
            </div>
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
              <div className="text-[11px] text-amber-800 font-medium">{t('stmtBalance')}</div>
              <div className="text-base font-extrabold text-amber-950 mt-1">{formatCurrency(summary.balance_payable)}</div>
            </div>
          </div>

          {/* Transactions Itemized Table */}
          <div>
            <div className="font-bold text-xs text-slate-800 mb-2 uppercase tracking-wider">Itemized Transactions & Target Bonuses</div>
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Transaction ID</th>
                  <th className="py-2 px-3">Student / Particulars</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">{item.effective_date?.split('T')[0]}</td>
                    <td className="py-2 px-3 font-mono font-medium">{item.transaction_id}</td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-800">
                        {item.enrolment?.student?.full_name || item.adjustment_reason || 'Target Milestone Bonus'}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.enrolment?.course?.title || ''}</div>
                    </td>
                    <td className="py-2 px-3 capitalize font-medium text-slate-600">{item.type}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(item.amount)}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          item.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures & Authorization */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
            <div>
              <div className="h-12 border-b border-dashed border-slate-300 mb-2"></div>
              <p className="font-semibold text-slate-700">Representative Signature</p>
              <p className="text-[10px] text-slate-400">Kasun Perera / Attributed Rep</p>
            </div>
            <div>
              <div className="h-12 border-b border-dashed border-slate-300 mb-2 flex items-end justify-center">
                <span className="font-serif italic text-indigo-900 font-bold text-sm">Ziveka Campus Finance</span>
              </div>
              <p className="font-semibold text-slate-700">{t('stmtAuthSignature')}</p>
              <p className="text-[10px] text-slate-400">Finance & Accounts Department</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
