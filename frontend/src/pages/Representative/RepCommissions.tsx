import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Commission, Representative } from '../../types';
import { api } from '../../services/api';
import { Percent, Printer, FileText, CheckCircle2, AlertCircle, ArrowUpRight, TrendingUp, Building, Landmark, Check, Clock } from 'lucide-react';

interface RepCommissionsProps {
  commissions: Commission[];
  representative: Representative | null;
  onOpenStatement: (data: any) => void;
}

export const RepCommissions: React.FC<RepCommissionsProps> = ({
  commissions,
  representative,
  onOpenStatement,
}) => {
  const { t, formatCurrency } = useLanguage();
  const [activeTab, setActiveTab] = useState<'ledger' | 'bank_deposits'>('ledger');
  const [loadingStmt, setLoadingStmt] = useState(false);
  const [statementData, setStatementData] = useState<any | null>(null);

  const totalEarned = commissions.reduce(
    (acc, c) => acc + (['eligible', 'approved', 'paid'].includes(c.status) ? Number(c.amount) : 0),
    0
  );
  const totalPaid = commissions.reduce(
    (acc, c) => acc + (c.status === 'paid' ? Number(c.amount) : 0),
    0
  );
  const balancePayable = commissions.reduce(
    (acc, c) => acc + (['eligible', 'approved'].includes(c.status) ? Number(c.amount) : 0),
    0
  );

  const fetchStatement = async () => {
    if (!representative) return;
    try {
      const res = await api.getRepStatement(representative.id);
      setStatementData(res);
    } catch (err) {
      console.error('Failed to load statement details:', err);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [representative, commissions]);

  const handleGenerateStatement = async () => {
    if (!representative) return;
    setLoadingStmt(true);
    try {
      const res = await api.getRepStatement(representative.id);
      onOpenStatement(res);
    } catch (err: any) {
      alert('Failed to generate statement.');
    } finally {
      setLoadingStmt(false);
    }
  };

  const bankDeposits = statementData?.bank_deposits || [];

  return (
    <div className="space-y-6">
      {/* Header with Balance Summary */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('navMyCommissions')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent per-student commission earnings (LKR 3,000), target milestone bonuses, and bank deposit history
          </p>
        </div>
        <button
          onClick={handleGenerateStatement}
          disabled={loadingStmt}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>{loadingStmt ? 'Generating...' : t('printStatement')}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">{t('stmtEarned')}</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalEarned)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Base commission + Unlocked bonuses</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Paid Out (Deposited to Bank)</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalPaid)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Disbursed directly to your bank account</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">{t('stmtBalance')}</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(balancePayable)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting next finance deposit batch</span>
        </div>
      </div>

      {/* Verified Bank Account Details Banner */}
      {representative && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400 shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                Registered Bank Account for Commission Deposits
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {representative.bank_name || 'Bank of Ceylon'} • {representative.bank_branch || 'Main Branch'}
              </div>
              <div className="text-xs text-slate-300 font-mono mt-0.5">
                Account: <span className="font-bold text-amber-300">{representative.account_number || '12345678901'}</span> • Holder: {representative.account_name || representative.user?.name}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl text-xs text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Bank Account Verified for Payouts</span>
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Commission Transaction Ledger ({commissions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('bank_deposits')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'bank_deposits'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Bank Deposit &amp; Payout Records ({bankDeposits.length})</span>
        </button>
      </div>

      {/* Tab 1: Commission Ledger Table */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 font-bold text-xs text-slate-800 uppercase tracking-wider">
            Transaction Ledger &amp; Milestone Awards
          </div>
          {commissions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No commission transactions recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3.5 px-4">Transaction Ref</th>
                    <th className="py-3.5 px-4">Particulars / Student</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Effective Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissions.map((comm) => (
                    <tr key={comm.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{comm.transaction_id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {comm.enrolment?.student?.full_name || comm.adjustment_reason || 'Target Milestone Bonus'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {comm.enrolment?.course?.title || 'Milestone Tier'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 capitalize font-medium text-slate-600">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            comm.type === 'bonus' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {comm.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        {formatCurrency(comm.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            comm.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : comm.status === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : comm.status === 'reversed'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {comm.status === 'paid' ? 'Paid to Bank' : comm.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500">{comm.effective_date?.split('T')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Bank Deposit & Payout Records */}
      {activeTab === 'bank_deposits' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 font-bold text-xs text-slate-800 uppercase tracking-wider">
            Completed Bank Commission Deposits
          </div>
          {bankDeposits.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50 text-indigo-400" />
              <h4 className="font-bold text-xs text-slate-700">No Bank Deposits Recorded Yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Once campus finance officers disburse your earned commissions into your bank account, official transfer reference numbers and receipts will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3.5 px-4">Transfer / Batch Ref</th>
                    <th className="py-3.5 px-4">Deposit Date</th>
                    <th className="py-3.5 px-4">Bank Transaction ID</th>
                    <th className="py-3.5 px-4 text-right">Amount Disbursed</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bankDeposits.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{b.batch_number}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {b.completed_at ? b.completed_at.split('T')[0] : b.created_at?.split('T')[0]}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-indigo-700">
                        {b.bank_transfer_reference || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                        {formatCurrency(b.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          Deposited
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-[11px] text-slate-500">{b.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
