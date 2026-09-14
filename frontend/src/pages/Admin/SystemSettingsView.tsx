import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { SystemSettingsMap } from '../../types';
import { api } from '../../services/api';
import { Settings, Save, Shield, Percent, Sparkles, Check } from 'lucide-react';

interface SystemSettingsViewProps {
  initialSettings?: SystemSettingsMap;
  onRefresh?: () => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  initialSettings,
  onRefresh,
}) => {
  const { t, formatCurrency } = useLanguage();
  const [settings, setSettings] = useState<SystemSettingsMap>(
    initialSettings || {
      registration_fee: 10000,
      course_fee: 30000,
      total_student_fee: 40000,
      base_commission: 3000,
      target_bonus_5: 5000,
      target_bonus_10: 15000,
      target_bonus_20: 40000,
      scholarship_quota: 25,
      scholarship_waiver_value: 40000,
      attribution_window_days: 30,
      quality_score_weights: {
        paid_enrolment_rate: 0.35,
        day_30_persistence: 0.25,
        net_revenue: 0.2,
        refund_rate: 0.1,
        compliance: 0.1,
      },
    }
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!initialSettings) {
      api.getSettings().then((res) => {
        if (res.settings) setSettings(res.settings);
      }).catch(() => {});
    }
  }, [initialSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">{t('navSettings')}</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Campus financial fee parameters, representative commission rates, milestone bonus tiers, and operational rules
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-xs font-bold text-emerald-800 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>System parameters updated and audit-logged successfully.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Financial Rates */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <Percent className="w-4 h-4 text-indigo-600" />
            <span>Core Financial &amp; Commission Rates</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Fee (LKR)</label>
              <input
                type="number"
                step="any"
                value={settings.registration_fee}
                onChange={(e) => setSettings({ ...settings, registration_fee: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Fee (LKR)</label>
              <input
                type="number"
                step="any"
                value={settings.course_fee}
                onChange={(e) => setSettings({ ...settings, course_fee: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Commission / Student (LKR)</label>
              <input
                type="number"
                step="any"
                value={settings.base_commission}
                onChange={(e) => setSettings({ ...settings, base_commission: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Milestone Bonus Tiers */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Target Milestone Bonus Tiers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tier 1: 5 Students Bonus (LKR)</label>
              <input
                type="number"
                step="any"
                value={settings.target_bonus_5}
                onChange={(e) => setSettings({ ...settings, target_bonus_5: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tier 2: 10 Students Bonus (LKR)</label>
              <input
                type="number"
                step="any"
                value={settings.target_bonus_10}
                onChange={(e) => setSettings({ ...settings, target_bonus_10: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tier 3: 20 Students Bonus (LKR)</label>
              <input
                type="number"
                step="any"
                value={settings.target_bonus_20}
                onChange={(e) => setSettings({ ...settings, target_bonus_20: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Scholarship Quota */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="font-bold text-sm text-slate-900">Scholarship Quota &amp; Attribution Window</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Intake Scholarship Cap</label>
              <input
                type="number"
                step="any"
                value={settings.scholarship_quota}
                onChange={(e) => setSettings({ ...settings, scholarship_quota: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Referral Attribution Window (Days)</label>
              <input
                type="number"
                step="any"
                value={settings.attribution_window_days}
                onChange={(e) => setSettings({ ...settings, attribution_window_days: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? t('loading') : 'Save System Parameters'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
