import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import logoImg from '../../assets/logo.jpeg';
import { createBrandedPdf, brandedTable, finishBrandedPdf } from '../../services/brandedPdf';
import { PayoutBatch, Commission, Representative } from '../../types';
import { api } from '../../services/api';
import { Receipt, CheckCircle, Plus, FileText, Building2, Printer, Check, CreditCard, DollarSign, ArrowUpRight, Search, Landmark, Send, Download } from 'lucide-react';

interface PayoutBatchesProps {
  batches: PayoutBatch[];
  approvedCommissions: Commission[];
  representatives?: Representative[];
  onRefresh: () => void;
  canManage: boolean;
}

export const PayoutBatches: React.FC<PayoutBatchesProps> = ({
  batches,
  approvedCommissions,
  representatives = [],
  onRefresh,
  canManage,
}) => {
  const { t, formatCurrency } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'payable_reps' | 'completed_transfers' | 'batch_generator'>('payable_reps');
  const [payableReps, setPayableReps] = useState<any[]>([]);
  const [loadingPayables, setLoadingPayables] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Deposit Modal State
  const [selectedRepForDeposit, setSelectedRepForDeposit] = useState<any | null>(null);
  const [depositAmount, setDepositAmount] = useState<number | ''>('');
  const [bankTransferRef, setBankTransferRef] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [depositNotes, setDepositNotes] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [showDepositConfirmation, setShowDepositConfirmation] = useState(false);
  const [depositSuccessMsg, setDepositSuccessMsg] = useState<string | null>(null);

  // Batch Completion Modal State
  const [completeBatchId, setCompleteBatchId] = useState<number | null>(null);
  const [bankRef, setBankRef] = useState('');
  const [notes, setNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  const fetchPayableReps = async () => {
    setLoadingPayables(true);
    try {
      const res = await api.getPayableRepresentatives();
      setPayableReps(res.payable_representatives || []);
    } catch (err) {
      console.error('Failed to load payable reps:', err);
    } finally {
      setLoadingPayables(false);
    }
  };

  useEffect(() => {
    fetchPayableReps();
  }, [batches, approvedCommissions]);

  const totalDisbursedAllTime = batches
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  const totalPendingBalance = payableReps.reduce((sum, r) => sum + Number(r.balance_payable), 0);

  const handleOpenDepositModal = (repData: any) => {
    setSelectedRepForDeposit(repData);
    setDepositAmount(repData.balance_payable);
    setBankTransferRef('BOC-TXN-' + Math.floor(100000 + Math.random() * 900000));
    setDepositDate(new Date().toISOString().split('T')[0]);
    setDepositNotes(`Commission bank transfer for ${repData.representative.user?.name || repData.representative.representative_id}`);
    setShowDepositConfirmation(false);
    setDepositSuccessMsg(null);
  };

  const handleDirectDepositSubmit = async () => {
    if (!selectedRepForDeposit || !depositAmount || Number(depositAmount) <= 0) return;
    if (!bankTransferRef.trim()) {
      alert('Please enter a bank transfer transaction reference.');
      return;
    }

    setDepositing(true);
    try {
      const res = await api.depositRepresentativeCommission({
        representative_id: selectedRepForDeposit.representative.id,
        amount: Number(depositAmount),
        bank_transfer_reference: bankTransferRef.trim(),
        deposit_date: depositDate,
        notes: depositNotes,
      });

      setDepositSuccessMsg(res.message);
      setShowDepositConfirmation(false);
      setTimeout(() => {
        setSelectedRepForDeposit(null);
        setDepositSuccessMsg(null);
      }, 1500);

      onRefresh();
      fetchPayableReps();
    } catch (err: any) {
      alert(err.message || 'Deposit failed');
    } finally {
      setDepositing(false);
    }
  };

  const handleDepositFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0 || !bankTransferRef.trim()) {
      if (!bankTransferRef.trim()) alert('Please enter a bank transfer transaction reference.');
      return;
    }
    setShowDepositConfirmation(true);
  };

  const handleCompleteBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeBatchId) return;
    setCompleting(true);
    try {
      await api.completePayoutBatch(completeBatchId, bankRef, notes);
      setCompleteBatchId(null);
      setBankRef('');
      setNotes('');
      onRefresh();
      fetchPayableReps();
    } catch (err: any) {
      alert(err.message || 'Failed to complete batch');
    } finally {
      setCompleting(false);
    }
  };

  const filteredPayableReps = payableReps.filter((r) => {
    const repName = r.representative?.user?.name || '';
    const repId = r.representative?.representative_id || '';
    const district = r.representative?.primary_district?.name || '';
    const bank = r.bank_details?.bank_name || '';
    const s = searchTerm.toLowerCase();

    return (
      repName.toLowerCase().includes(s) ||
      repId.toLowerCase().includes(s) ||
      district.toLowerCase().includes(s) ||
      bank.toLowerCase().includes(s)
    );
  });

  const exportHeaders = activeSubTab === 'payable_reps'
    ? ['Representative', 'Representative ID', 'District', 'Bank', 'Account Number', 'Total Earned', 'Total Paid Out', 'Balance Due']
    : ['Batch Number', 'Disbursed Date', 'Period', 'Amount Disbursed', 'Transfer Reference', 'Status'];

  const exportRows = activeSubTab === 'payable_reps'
    ? filteredPayableReps.map((r) => [
        r.representative?.user?.name || r.representative?.representative_id || '',
        r.representative?.representative_id || '',
        r.representative?.primary_district?.name || '',
        r.bank_details?.bank_name || '',
        r.bank_details?.account_number || '',
        formatCurrency(r.total_earned),
        formatCurrency(r.total_paid),
        formatCurrency(r.balance_payable),
      ])
    : batches.map((batch) => [
        batch.batch_number,
        batch.completed_at?.split('T')[0] || batch.created_at?.split('T')[0] || '',
        batch.period,
        formatCurrency(batch.total_amount),
        batch.bank_transfer_reference || '',
        batch.status,
      ]);

  const escapeCSV = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const handleExportCSV = () => {
    const csv = [exportHeaders, ...exportRows]
      .map((row) => row.map((value) => escapeCSV(String(value))).join(','))
      .join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
    link.download = activeSubTab === 'payable_reps' ? 'ziveka-payout-balances.csv' : 'ziveka-payout-batches.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportPDF = async () => {
    const title = activeSubTab === 'payable_reps' ? 'Ziveka Payout Balances' : 'Ziveka Payout Batch History';
    const { pdf, drawHeader, drawFooter } = await createBrandedPdf({ title, subtitle: `Records: ${exportRows.length}`, logoUrl: logoImg });
    brandedTable(pdf, {
      head: [exportHeaders],
      body: exportRows,
    });
    finishBrandedPdf(pdf, drawHeader, drawFooter, activeSubTab === 'payable_reps' ? 'ziveka-payout-balances.pdf' : 'ziveka-payout-batches.pdf');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row md:flex-col lg:flex-row justify-between items-start sm:items-center md:items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('navPayouts')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct bank deposit processing, commission disbursement ledger, and representative payment statements
          </p>
        </div>
        <div className="flex w-full items-center gap-2 md:w-full lg:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 justify-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors lg:flex-none"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex-1 justify-center px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors lg:flex-none"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Commissions Disbursed (Paid Out)</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalDisbursedAllTime)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Deposited into representatives bank accounts</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Outstanding Balance Payable</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(totalPendingBalance)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting bank transfer deposit</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Completed Bank Disbursal Runs</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {batches.filter((b) => b.status === 'completed').length} Transfers
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Audit verified bank batches</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab('payable_reps')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
            activeSubTab === 'payable_reps'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Representative Bank Balances &amp; Direct Deposits</span>
          {payableReps.filter((r) => r.balance_payable > 0).length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {payableReps.filter((r) => r.balance_payable > 0).length} Due
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('completed_transfers')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
            activeSubTab === 'completed_transfers'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Bank Deposit &amp; Batch History ({batches.length})</span>
        </button>
      </div>

      {/* Tab 1: Representative Payable Balances & Direct Deposits */}
      {activeSubTab === 'payable_reps' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative grow">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search representative by name, rep ID, district, or bank name..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3.5 px-4">Representative</th>
                    <th className="py-3.5 px-4">Primary District</th>
                    <th className="py-3.5 px-4">Verified Bank Account Details</th>
                    <th className="py-3.5 px-4 text-right">Total Earned</th>
                    <th className="py-3.5 px-4 text-right">Total Paid Out</th>
                    <th className="py-3.5 px-4 text-right">Balance Due</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayableReps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                        No representatives with payable balances found.
                      </td>
                    </tr>
                  ) : (
                    filteredPayableReps.map((r) => {
                      const rep = r.representative;
                      const hasBalance = r.balance_payable > 0;
                      return (
                        <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{rep.user?.name || rep.representative_id}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{rep.representative_id}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {rep.primary_district?.name || '—'}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800 flex items-center space-x-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{r.bank_details?.bank_name || 'Bank of Ceylon'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Acc: {r.bank_details?.account_number || '—'} • {r.bank_details?.account_name || rep.user?.name}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                            {formatCurrency(r.total_earned)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                            {formatCurrency(r.total_paid)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-amber-600">
                            {formatCurrency(r.balance_payable)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {canManage && (
                              <button
                                onClick={() => handleOpenDepositModal(r)}
                                disabled={!hasBalance}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 ml-auto transition ${
                                  hasBalance
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                <Send className="w-3 h-3" />
                                <span>Deposit to Bank</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Completed Bank Transfers & Batch History */}
      {activeSubTab === 'completed_transfers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {batches.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No bank transfer payout records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3.5 px-4">Transfer / Batch No.</th>
                    <th className="py-3.5 px-4">Disbursed Date</th>
                    <th className="py-3.5 px-4">Period</th>
                    <th className="py-3.5 px-4 text-right">Amount Disbursed</th>
                    <th className="py-3.5 px-4">Bank Transfer Reference</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{b.batch_number}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {b.completed_at ? b.completed_at.split('T')[0] : b.created_at?.split('T')[0]}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{b.period}</td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                        {formatCurrency(b.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {b.bank_transfer_reference || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            b.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-[11px] text-slate-500 max-w-xs truncate">
                        {b.notes || 'Direct bank deposit'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Direct Bank Deposit Modal */}
      {selectedRepForDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 relative">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Bank Commission Deposit</h3>
                  <p className="text-xs text-slate-500">
                    Disburse commission payout to representative bank account
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRepForDeposit(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {depositSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>{depositSuccessMsg}</span>
              </div>
            )}

            {/* Representative Bank Details Summary Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Representative:</span>
                <span className="font-bold text-slate-900">
                  {selectedRepForDeposit.representative.user?.name} ({selectedRepForDeposit.representative.representative_id})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank &amp; Branch:</span>
                <span className="font-medium text-slate-800">
                  {selectedRepForDeposit.bank_details?.bank_name} • {selectedRepForDeposit.bank_details?.bank_branch || 'Main'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Number:</span>
                <span className="font-mono font-bold text-indigo-700">
                  {selectedRepForDeposit.bank_details?.account_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Holder:</span>
                <span className="font-medium text-slate-800">
                  {selectedRepForDeposit.bank_details?.account_name || selectedRepForDeposit.representative.user?.name}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-600 font-semibold">Total Payable Due:</span>
                <span className="font-black text-amber-600 text-sm">
                  {formatCurrency(selectedRepForDeposit.balance_payable)}
                </span>
              </div>
            </div>

            <form onSubmit={handleDepositFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deposit Amount (LKR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank Transfer Reference / Transaction ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bankTransferRef}
                  onChange={(e) => setBankTransferRef(e.target.value)}
                  placeholder="e.g. BOC-TXN-9988123"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deposit Date</label>
                <input
                  type="date"
                  required
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Finance Notes / Transfer Memo</label>
                <textarea
                  rows={2}
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  placeholder="Direct online bank transfer processed via Commercial Bank corporate portal..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedRepForDeposit(null)}
                  disabled={depositing}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={depositing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition disabled:opacity-50"
                >
                  {depositing ? (
                    <span>Recording Bank Deposit…</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm &amp; Disburse Payment</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {showDepositConfirmation && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md">
                <div role="alertdialog" aria-modal="true" className="w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="flex items-start gap-3 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-5 py-4 text-white">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-300/20">
                      <Check className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-bold tracking-tight">Confirm Bank Deposit</h2>
                      <p className="mt-0.5 text-[11px] text-slate-300">Ziveka Online Campus</p>
                    </div>
                    <button type="button" onClick={() => setShowDepositConfirmation(false)} aria-label="Close confirmation" className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white">
                      <span className="text-lg leading-none">×</span>
                    </button>
                  </div>
                  <div className="space-y-2 px-5 py-6 text-sm text-slate-700">
                    <p>Are you sure you want to disburse this commission payment?</p>
                    <p className="font-bold text-slate-900">{selectedRepForDeposit.representative.user?.name || selectedRepForDeposit.representative.representative_id}</p>
                    <p className="text-xs text-slate-500">Amount: {formatCurrency(Number(depositAmount))}</p>
                    <p className="text-xs text-slate-500">Transfer reference: {bankTransferRef}</p>
                    <p className="text-xs text-emerald-700">This will mark the approved commission as paid and record the bank transfer.</p>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
                    <button type="button" onClick={() => setShowDepositConfirmation(false)} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200">Cancel</button>
                    <button type="button" onClick={handleDirectDepositSubmit} disabled={depositing} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" /> {depositing ? 'Disbursing...' : 'Yes, Disburse Payment'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
