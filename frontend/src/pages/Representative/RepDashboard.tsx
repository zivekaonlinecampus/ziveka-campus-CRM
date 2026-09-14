import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Representative, Lead, Commission, User } from '../../types';
import { motion } from 'motion/react';
import {
  Users,
  UserCheck,
  Percent,
  Award,
  TrendingUp,
  QrCode,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface RepDashboardProps {
  representative: Representative | null;
  currentUser: User;
  dashboardData: any;
  onOpenQRModal: () => void;
  onOpenLeadModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const RepDashboard: React.FC<RepDashboardProps> = ({
  representative,
  currentUser,
  dashboardData,
  onOpenQRModal,
  onOpenLeadModal,
  onNavigateTab,
}) => {
  const { t, formatCurrency } = useLanguage();
  const { isDark } = useTheme();

  if (!dashboardData) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin w-10 h-10 border-3 border-[#3A7DFF] border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
          Loading Representative Console...
        </p>
      </div>
    );
  }

  const { kpis, bonus_progress, pipeline = {}, recent_leads, recent_commissions } = dashboardData;

  const cards = [
    {
      title: t('cardTotalLeads'),
      value: kpis.total_leads,
      icon: Users,
      color: '#3A7DFF',
      bgLight: 'bg-blue-50 text-blue-700 border-blue-100',
      bgDark: 'bg-[#3A7DFF]/15 text-[#7DD3FC] border-[#3A7DFF]/30',
      action: () => onNavigateTab('rep_leads'),
    },
    {
      title: t('cardRepPaidStudents'),
      value: kpis.paid_students,
      icon: UserCheck,
      color: '#10B981',
      bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      bgDark: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      action: () => onNavigateTab('rep_leads'),
    },
    {
      title: t('cardRepEarnedCommission'),
      value: formatCurrency(kpis.earned_commission),
      icon: Percent,
      color: '#F59E0B',
      bgLight: 'bg-amber-50 text-amber-700 border-amber-100',
      bgDark: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      action: () => onNavigateTab('rep_commissions'),
    },
    {
      title: t('cardRepQualityScore'),
      value: `${kpis.quality_score}%`,
      icon: Award,
      color: '#8B5CF6',
      bgLight: 'bg-purple-50 text-purple-700 border-purple-100',
      bgDark: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      action: () => onNavigateTab('rep_kpis'),
    },
  ];

  const representativeFirstName = (representative?.user?.name || currentUser.name).trim().split(/\s+/)[0];

  const performanceData = [
    ['new', 'New'],
    ['contacted', 'Contacted'],
    ['qualified', 'Qualified'],
    ['application', 'Application'],
    ['payment_pending', 'Payment Pending'],
    ['paid', 'Paid'],
  ].map(([status, label]) => ({
    name: label,
    leads: Number(pipeline[status]) || 0,
    paid: status === 'paid' ? Number(kpis.paid_students) || 0 : 0,
    target: Math.max(1, Math.round((Number(pipeline[status]) || 0) * 0.5)),
  }));

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div
        className={`rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 ${
          isDark
            ? 'bg-gradient-to-r from-[#121A35] via-[#1B2A4A] to-[#121A35] border-white/10 text-white'
            : 'bg-gradient-to-r from-[#0F274F] via-[#1B2A4A] to-[#0F274F] border-[#E8EEF7] text-white'
        }`}
      >
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-[#7DD3FC] text-xs font-bold mb-1 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#3A7DFF]" />
            <span>{representative?.primary_district?.name} District Representative</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome back, {representativeFirstName}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Rep ID: <span className="font-mono font-bold text-white">{representative?.representative_id}</span> • Active Referral Code:{' '}
            <span className="font-mono font-bold text-[#F59E0B]">
              {representative?.active_referral_code?.code || 'ZV-CMB-DEMO'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenLeadModal}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center space-x-2 shadow-lg cursor-pointer transition-all ${
              isDark
                ? 'bg-gradient-to-r from-[#3A7DFF] to-[#7DD3FC] text-slate-950 shadow-[#3A7DFF]/30'
                : 'bg-gradient-to-r from-[#245CFF] to-[#0EA5E9] text-white shadow-blue-500/30'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('addLead')}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenQRModal}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl flex items-center space-x-2 backdrop-blur-md transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#F59E0B]" />
            <span>{t('navReferralTools')}</span>
          </motion.button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={card.action}
              className={`p-5 rounded-3xl border cursor-pointer transition-all duration-200 group ${
                isDark
                  ? 'bg-[#1B2A4A]/90 hover:bg-[#1B2A4A] border-white/5 hover:border-[#7DD3FC]/30 shadow-lg'
                  : 'bg-[#FCFCFD] hover:bg-white border-[#E8EEF7] hover:border-[#CBD5E1] shadow-xs'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-xs font-semibold ${
                    isDark ? 'text-[#94A3B8] group-hover:text-[#F8FAFC]' : 'text-[#475569] group-hover:text-[#0F274F]'
                  }`}
                >
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl ${isDark ? card.bgDark : card.bgLight}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-xl sm:text-2xl font-black ${
                  isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
                }`}
              >
                {card.value}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Target Bonus Milestone Tracker */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDark
            ? 'bg-[#1B2A4A] border-white/5 shadow-md'
            : 'bg-[#FCFCFD] border-[#E8EEF7] shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3
              className={`font-black text-sm flex items-center space-x-2 ${
                isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-[#3A7DFF]" />
              <span>{t('bonusTargetTitle')}</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
              {t('bonusRuleNote')}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                isDark
                  ? 'bg-[#3A7DFF]/20 text-[#7DD3FC] border-[#7DD3FC]/30'
                  : 'bg-[#EEF2FF] text-[#245CFF] border-[#245CFF]/20'
              }`}
            >
              {bonus_progress.current_paid_count} Paid Qualifying Students
            </span>
          </div>
        </div>

        {/* 3 Tier Step Progression */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div
            className={`p-4 rounded-2xl border transition-all ${
              bonus_progress.current_paid_count >= 5
                ? isDark
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-xs'
                : isDark
                ? 'bg-[#121A35] border-white/5 text-[#94A3B8]'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex justify-between items-center text-xs font-bold mb-1">
              <span>{t('bonusTier5')}</span>
              {bonus_progress.current_paid_count >= 5 && (
                <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[10px]">
                  Unlocked
                </span>
              )}
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (bonus_progress.current_paid_count / 5) * 100)}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">Target: 5 Students reached</div>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-all ${
              bonus_progress.current_paid_count >= 10
                ? isDark
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-xs'
                : isDark
                ? 'bg-[#121A35] border-white/5 text-[#94A3B8]'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex justify-between items-center text-xs font-bold mb-1">
              <span>{t('bonusTier10')}</span>
              {bonus_progress.current_paid_count >= 10 && (
                <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[10px]">
                  Unlocked
                </span>
              )}
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-[#3A7DFF] h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (bonus_progress.current_paid_count / 10) * 100)}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">Target: 10 Students reached</div>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-all ${
              bonus_progress.current_paid_count >= 20
                ? isDark
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-xs'
                : isDark
                ? 'bg-[#121A35] border-white/5 text-[#94A3B8]'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex justify-between items-center text-xs font-bold mb-1">
              <span>{t('bonusTier20')}</span>
              {bonus_progress.current_paid_count >= 20 && (
                <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[10px]">
                  Unlocked
                </span>
              )}
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-[#8B5CF6] h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (bonus_progress.current_paid_count / 20) * 100)}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">Target: 20 Students reached</div>
          </div>
        </div>
      </div>

      <div className={`rounded-3xl border p-6 ${isDark ? 'bg-[#1B2A4A] border-white/5 shadow-md' : 'bg-[#FCFCFD] border-[#E8EEF7] shadow-xs'}`}>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className={`font-black text-base ${isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'}`}>Representative Performance</h3>
            <p className={`text-[11px] font-medium ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>Lead pipeline progress and paid enrolment target</p>
          </div>
          <span className={`text-xs font-bold ${isDark ? 'text-[#7DD3FC]' : 'text-[#245CFF]'}`}>{kpis.total_leads} total leads</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={performanceData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={isDark ? 'rgba(125,211,252,0.12)' : '#E8EEF7'} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#475569' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#121A35' : '#FCFCFD', borderColor: isDark ? 'rgba(125,211,252,0.2)' : '#E8EEF7', borderRadius: '12px', color: isDark ? '#F8FAFC' : '#0F274F', fontSize: '11px' }} />
              <Bar dataKey="leads" name="Leads" fill={isDark ? 'rgba(58,125,255,0.55)' : '#245CFF'} radius={[6, 6, 0, 0]} maxBarSize={34} />
              <Line type="monotone" dataKey="target" name="Target" stroke={isDark ? '#F59E0B' : '#E59E21'} strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: isDark ? '#F59E0B' : '#E59E21' }} />
              <Line type="monotone" dataKey="paid" name="Paid Students" stroke={isDark ? '#7DD3FC' : '#0EA5E9'} strokeWidth={2.5} dot={{ r: 4, fill: isDark ? '#7DD3FC' : '#0EA5E9', stroke: isDark ? '#121A35' : '#FCFCFD', strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Section: Recent Leads & Recent Commissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div
          className={`p-6 rounded-3xl border space-y-4 ${
            isDark
              ? 'bg-[#1B2A4A] border-white/5 shadow-md'
              : 'bg-[#FCFCFD] border-[#E8EEF7] shadow-xs'
          }`}
        >
          <div className="flex justify-between items-center">
            <h3
              className={`font-black text-sm ${
                isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
              }`}
            >
              {t('navMyLeads')}
            </h3>
            <button
              onClick={() => onNavigateTab('rep_leads')}
              className="text-xs font-semibold text-[#3A7DFF] hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-white/5 overflow-x-auto">
            {recent_leads.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No leads submitted yet.</p>
            ) : (
              recent_leads.slice(0, 5).map((l: Lead) => (
                <div key={l.id} className="py-3 flex justify-between items-center hover:bg-white/5 transition-colors px-2 rounded-xl">
                  <div>
                    <div
                      className={`font-bold text-xs ${
                        isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
                      }`}
                    >
                      {l.full_name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {l.mobile} • {l.course?.title}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      l.status === 'paid'
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : l.status === 'application' || l.status === 'payment_pending'
                        ? isDark
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-amber-50 text-[#C67A00] border border-[#E59E21]/40'
                        : isDark
                        ? 'bg-slate-500/20 text-slate-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {t(`status_${l.status}` as any) || l.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Commission Transactions */}
        <div
          className={`p-6 rounded-3xl border space-y-4 ${
            isDark
              ? 'bg-[#1B2A4A] border-white/5 shadow-md'
              : 'bg-[#FCFCFD] border-[#E8EEF7] shadow-xs'
          }`}
        >
          <div className="flex justify-between items-center">
            <h3
              className={`font-black text-sm ${
                isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
              }`}
            >
              {t('navMyCommissions')}
            </h3>
            <button
              onClick={() => onNavigateTab('rep_commissions')}
              className="text-xs font-semibold text-[#3A7DFF] hover:underline flex items-center space-x-1"
            >
              <span>View Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-white/5 overflow-x-auto">
            {recent_commissions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No commission entries yet.</p>
            ) : (
              recent_commissions.slice(0, 5).map((c: Commission) => (
                <div key={c.id} className="py-3 flex justify-between items-center hover:bg-white/5 transition-colors px-2 rounded-xl">
                  <div>
                    <div
                      className={`font-mono text-xs font-bold ${
                        isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
                      }`}
                    >
                      {c.transaction_id}
                    </div>
                    <div className="text-[11px] text-slate-400 capitalize">
                      {c.type} • {c.effective_date?.split('T')[0]}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold text-xs ${
                        isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
                      }`}
                    >
                      {formatCurrency(c.amount)}
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        c.status === 'paid'
                          ? isDark
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.status === 'approved'
                          ? isDark
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-blue-50 text-[#245CFF] border border-blue-200'
                          : isDark
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-amber-50 text-[#C67A00] border border-[#E59E21]/40'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
