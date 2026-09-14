import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import logoImg from '../../assets/logo.jpeg';
import { createBrandedPdf, brandedTable, finishBrandedPdf } from '../../services/brandedPdf';
import { BarChart3, Download, FileText, Printer, Filter, Award, TrendingUp, DollarSign } from 'lucide-react';

interface ReportsHubProps {
  reportData: any;
  repPerformance: any[];
}

export const ReportsHub: React.FC<ReportsHubProps> = ({ reportData, repPerformance }) => {
  const { t, formatCurrency } = useLanguage();
  const [activeReportTab, setActiveReportTab] = useState<'reps' | 'districts' | 'finance'>('reps');

  const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReps = () => {
    const headers = ['Rep ID', 'Name', 'District', 'Leads', 'Paid Students', 'Conversion %', 'Revenue LKR', 'Commission LKR', 'Quality Score'];
    const rows = repPerformance.map((r) => [
      r.representative_id,
      `"${r.name}"`,
      r.district,
      r.leads_count,
      r.paid_count,
      r.conversion_rate,
      r.revenue,
      r.commission_total,
      r.quality_score,
    ]);
    exportCSV('Ziveka_Representative_Performance_Report', headers, rows);
  };

  const handleExportDistricts = () => {
    const headers = ['District Code', 'District Name', 'Reps Count', 'Leads Count', 'Paid Students', 'Revenue LKR'];
    const rows = (reportData?.districts || []).map((d: any) => [
      d.code,
      `"${d.name}"`,
      d.reps_count,
      d.leads_count,
      d.paid_students_count,
      d.revenue,
    ]);
    exportCSV('Ziveka_District_Acquisition_Report', headers, rows);
  };

  const handleExportFinance = () => {
    const headers = ['Metric', 'Amount LKR'];
    const rows = [
      ['Gross Fees Invoiced', reportData?.summary?.gross_fees || 0],
      ['Total Commission Liability', reportData?.summary?.commission_payable || 0],
      ['Target Bonus Liability', reportData?.summary?.bonus_payable || 0],
    ];
    exportCSV('Ziveka_Financial_Liability_Report', headers, rows);
  };

  const handleExportPDF = async () => {
    const { pdf, drawHeader, drawFooter } = await createBrandedPdf({ title: 'Ziveka Reports & Analytics', logoUrl: logoImg });

    if (activeReportTab === 'reps') {
      const headers = ['Rep ID', 'Name', 'District', 'Leads', 'Paid Students', 'Conversion %', 'Revenue LKR', 'Commission LKR', 'Quality Score'];
      const rows = repPerformance.map((r) => [r.representative_id, r.name, r.district, r.leads_count, r.paid_count, `${r.conversion_rate}%`, r.revenue, r.commission_total, `${r.quality_score}%`]);
      brandedTable(pdf, { startY: 61, head: [headers], body: rows });
      finishBrandedPdf(pdf, drawHeader, drawFooter, 'Ziveka_Representative_Performance_Report.pdf');
      return;
    }

    if (activeReportTab === 'districts') {
      const headers = ['District Code', 'District Name', 'Province', 'Representatives', 'Total Leads', 'Paid Enrolments', 'Revenue LKR'];
      const rows = (reportData?.districts || []).map((d: any) => [d.code, d.name, d.province, d.reps_count, d.leads_count, d.paid_students_count, d.revenue || 0]);
      brandedTable(pdf, { startY: 61, head: [headers], body: rows });
      finishBrandedPdf(pdf, drawHeader, drawFooter, 'Ziveka_District_Acquisition_Report.pdf');
      return;
    }

    const rows = [
      ['Gross Fees Invoiced', formatCurrency(reportData?.summary?.gross_fees || 0)],
      ['Total Commission Liability', formatCurrency(reportData?.summary?.commission_payable || 0)],
      ['Target Bonus Liability', formatCurrency(reportData?.summary?.bonus_payable || 0)],
    ];
    brandedTable(pdf, { startY: 61, head: [['Metric', 'Amount']], body: rows });
    finishBrandedPdf(pdf, drawHeader, drawFooter, 'Ziveka_Financial_Liability_Report.pdf');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row md:flex-col lg:flex-row justify-between items-start sm:items-center md:items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('navReports')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Executive financial intelligence, representative performance rankings, and regional student acquisition analytics
          </p>
        </div>
        <div className="flex w-full items-center space-x-2 md:w-full lg:w-auto">
          <button
            onClick={activeReportTab === 'reps' ? handleExportReps : activeReportTab === 'districts' ? handleExportDistricts : handleExportFinance}
            className="flex-1 justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors lg:flex-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportCSV')}</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex-1 justify-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors lg:flex-none"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Report View Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold px-2">
        <button
          onClick={() => setActiveReportTab('reps')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeReportTab === 'reps' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
          }`}
        >
          Representative Performance & Quality Ranking
        </button>
        <button
          onClick={() => setActiveReportTab('districts')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeReportTab === 'districts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
          }`}
        >
          District Acquisition Summary
        </button>
        <button
          onClick={() => setActiveReportTab('finance')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeReportTab === 'finance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
          }`}
        >
          Commission Liability & Fee Collection
        </button>
      </div>

      {/* Tab 1: Rep Performance */}
      {activeReportTab === 'reps' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Representative</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4 text-center">Leads</th>
                  <th className="py-3 px-4 text-center">Paid Students</th>
                  <th className="py-3 px-4 text-center">Conversion %</th>
                  <th className="py-3 px-4 text-right">Net Revenue</th>
                  <th className="py-3 px-4 text-right">Commission Earned</th>
                  <th className="py-3 px-4 text-center">Quality Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repPerformance.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{r.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.representative_id}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{r.district}</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">{r.leads_count}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{r.paid_count}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{r.conversion_rate}%</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(r.revenue)}</td>
                    <td className="py-3 px-4 text-right font-black text-indigo-700">
                      {formatCurrency(r.commission_total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                        {r.quality_score}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Districts */}
      {activeReportTab === 'districts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">District Code</th>
                  <th className="py-3 px-4">District Name</th>
                  <th className="py-3 px-4">Province</th>
                  <th className="py-3 px-4 text-center">Representatives</th>
                  <th className="py-3 px-4 text-center">Total Leads</th>
                  <th className="py-3 px-4 text-center">Paid Enrolments</th>
                  <th className="py-3 px-4 text-right">Net Revenue Collection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(reportData?.districts || []).map((d: any) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{d.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {d.name} <span className="text-slate-400 font-normal">({d.name_si})</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{d.province}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{d.reps_count}</td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700">{d.leads_count}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{d.paid_students_count}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(d.revenue || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Financial Liability */}
      {activeReportTab === 'finance' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Gross Fees Invoiced</span>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(reportData?.summary?.gross_fees || 0)}</div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Commission Liability</span>
            <div className="text-2xl font-black text-indigo-700">
              {formatCurrency(reportData?.summary?.commission_payable || 0)}
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Target Bonus Liability</span>
            <div className="text-2xl font-black text-amber-700">
              {formatCurrency(reportData?.summary?.bonus_payable || 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
