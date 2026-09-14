import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Representative } from '../../types';
import { Award } from 'lucide-react';

interface RepKPIAnalyticsProps {
  representative: Representative | null;
  kpis: any;
}

export const RepKPIAnalytics: React.FC<RepKPIAnalyticsProps> = ({ representative, kpis }) => {
  const { t } = useLanguage();

  const qualityScore = kpis?.quality_score ?? representative?.quality_score ?? 0;
  const components = kpis?.quality_components ?? {};

  const weights = [
    { component: t('paidEnrolmentRate'), weight: '30%', score: components.paid_enrolment_rate ?? 0, note: t('paidEnrolmentCriteria') },
    { component: t('day30Persistence'), weight: '25%', score: components.day_30_persistence ?? 0, note: t('persistenceCriteria') },
    { component: t('netCampusRevenue'), weight: '20%', score: components.net_revenue ?? 0, note: t('revenueCriteria') },
    { component: t('refundRateRisk'), weight: '15%', score: components.refund_rate ?? 0, note: t('refundCriteria') },
    { component: t('complianceDataAccuracy'), weight: '10%', score: components.compliance ?? 0, note: t('complianceCriteria') },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('navQualityKPI')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('weightedQualityScore')}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('compositeQualityScore')}</span>
          <span className="text-3xl font-black text-indigo-600">{Number(qualityScore).toFixed(1)}%</span>
        </div>
      </div>

      {/* Quality Philosophy Note */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
        <div className="font-bold flex items-center space-x-1.5">
          <Award className="w-4 h-4 text-amber-600" />
          <span>{t('qualityScoringPrinciple')}</span>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          {t('qualityScoringDescription')}
        </p>
      </div>

      {/* Weighted Score Breakdown Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-bold text-xs text-slate-800 uppercase tracking-wider">
          {t('scoringComponentDistribution')}
        </div>
        <table className="mobile-card-table w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4">{t('component')}</th>
              <th className="py-3 px-4 text-center">{t('suggestedWeight')}</th>
              <th className="py-3 px-4 text-center">{t('yourRating')}</th>
              <th className="py-3 px-4">{t('evaluationCriteria')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {weights.map((w, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-slate-900">{w.component}</td>
                <td className="py-3 px-4 text-center font-bold text-indigo-700">{w.weight}</td>
                <td className="py-3 px-4 text-center font-black text-emerald-600">{Number(w.score).toFixed(1)}%</td>
                <td className="py-3 px-4 text-slate-500 text-[11px]">{w.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
