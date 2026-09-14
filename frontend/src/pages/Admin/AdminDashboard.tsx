import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Lead, Payment, User } from '../../types';
import { motion } from 'motion/react';
import {
  Users,
  UserCheck,
  CreditCard,
  Percent,
  Award,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  MapPin,
  Plus,
  BarChart3,
  CircleDot,
  Layers,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';

interface AdminDashboardProps {
  currentUser: User;
  dashboardData: any;
  leads?: Lead[];
  payments?: Payment[];
  onOpenDrilldown: (title: string, subtitle: string, data: any[], type: any) => void;
  onNavigateTab: (tab: string) => void;
  onOpenLeadModal?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  dashboardData,
  leads = [],
  payments = [],
  onOpenDrilldown,
  onNavigateTab,
  onOpenLeadModal,
}) => {
  const { t, formatCurrency } = useLanguage();
  const { isDark } = useTheme();

  // Chart Presentation Mode Switch: 'both' (Bar + Dots), 'bar' (Bar only), 'dot' (Dots only)
  const [chartMode, setChartMode] = useState<'both' | 'bar' | 'dot'>('both');

  // Chart Data Dimension Switch: 'districts' | 'funnel' | 'timeline'
  const [dataDimension, setDataDimension] = useState<'districts' | 'funnel' | 'timeline'>('districts');

  const { summary = {}, funnel = {}, districts = [], exceptions = {} } = dashboardData || {};

  interface ChartItem {
    name: string;
    leads: number;
    verified: number;
    target: number;
    revenue?: number;
  }

  // Real Data Processor for Districts Dimension
  const districtChartData: ChartItem[] = useMemo(() => {
    if (!Array.isArray(districts) || districts.length === 0) return [];
    return districts
      .filter((d: any) => d.leads_count > 0 || d.paid_students_count > 0 || d.reps_count > 0)
      .slice(0, 8)
      .map((d: any) => ({
        name: d.name || 'District',
        leads: Number(d.leads_count) || 0,
        verified: Number(d.paid_students_count) || 0,
        target: Math.max(5, Math.round((Number(d.leads_count) || 0) * 0.7)),
        revenue: Number(d.revenue) || 0,
      }));
  }, [districts]);

  // Real Data Processor for Funnel Dimension
  const funnelChartData: ChartItem[] = useMemo(() => {
    return [
      {
        name: t('status_new') || 'New',
        leads: Number(funnel.new) || 0,
        verified: Number(funnel.paid) || 0,
        target: Math.round((Number(summary.total_leads) || 0) * 0.8),
      },
      {
        name: t('status_contacted') || 'Contacted',
        leads: Number(funnel.contacted) || 0,
        verified: Number(funnel.paid) || 0,
        target: Math.round((Number(summary.total_leads) || 0) * 0.7),
      },
      {
        name: t('status_qualified') || 'Qualified',
        leads: Number(funnel.qualified) || 0,
        verified: Number(funnel.paid) || 0,
        target: Math.round((Number(summary.total_leads) || 0) * 0.6),
      },
      {
        name: t('status_application') || 'Application',
        leads: Number(funnel.application) || 0,
        verified: Number(funnel.paid) || 0,
        target: Math.round((Number(summary.total_leads) || 0) * 0.5),
      },
      {
        name: t('status_payment_pending') || 'Pending Pay',
        leads: Number(funnel.payment_pending) || 0,
        verified: Number(funnel.paid) || 0,
        target: Math.round((Number(summary.total_leads) || 0) * 0.4),
      },
      {
        name: t('status_paid') || 'Paid Enrolled',
        leads: Number(funnel.paid) || 0,
        verified: Number(funnel.paid) || 0,
        target: Number(funnel.paid) || 0,
      },
    ];
  }, [funnel, summary, t]);

  // Real Data Processor for Timeline (from actual Leads array)
  const timelineChartData: ChartItem[] = useMemo(() => {
    if (!Array.isArray(leads) || leads.length === 0) {
      return districtChartData;
    }

    const grouped: Record<string, { leads: number; verified: number }> = {};
    leads.forEach((l) => {
      const dateStr = l.created_at ? l.created_at.split('T')[0] : 'Recent';
      if (!grouped[dateStr]) grouped[dateStr] = { leads: 0, verified: 0 };
      grouped[dateStr].leads += 1;
      if (l.status === 'paid') grouped[dateStr].verified += 1;
    });

    const entries = Object.entries(grouped)
      .slice(-7)
      .map(([date, counts]) => ({
        name: date.length > 5 ? date.slice(5) : date,
        leads: counts.leads,
        verified: counts.verified,
        target: Math.max(2, Math.round(counts.leads * 0.75)),
      }));

    return entries.length > 0 ? entries : districtChartData;
  }, [leads, districtChartData]);

  // Current active data based on dimension switch
  const activeChartData: ChartItem[] =
    dataDimension === 'districts'
      ? districtChartData.length > 0 ? districtChartData : funnelChartData
      : dataDimension === 'funnel'
      ? funnelChartData
      : timelineChartData;

  if (!dashboardData) {
    return (
      <div className="p-16 text-center">
        <div className="animate-spin w-10 h-10 border-3 border-[#3A7DFF] border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
          Loading Live Campus Console...
        </p>
      </div>
    );
  }

  // Real Top Executive Metric Cards
  const coreMetrics = [
    {
      title: t('cardTotalLeads'),
      value: summary.total_leads || 0,
      subValue: `${summary.conversion_rate || 0}% Conversion Rate`,
      icon: Users,
      color: '#3A7DFF',
      badgeBg: isDark ? 'bg-[#3A7DFF]/20 text-[#7DD3FC]' : 'bg-[#EEF2FF] text-[#245CFF]',
      action: () => onNavigateTab('lead_pipeline'),
    },
    {
      title: t('cardPaidEnrolments'),
      value: summary.paid_enrolments || 0,
      subValue: 'Verified Real Enrolments',
      icon: UserCheck,
      color: '#10B981',
      badgeBg: isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
      action: () => onNavigateTab('payments'),
    },
    {
      title: t('cardNetCollected'),
      value: formatCurrency(summary.net_collected || 0),
      subValue: `Pending: ${formatCurrency(summary.outstanding || 0)}`,
      icon: CreditCard,
      color: '#F59E0B',
      badgeBg: isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-700',
      action: () => onNavigateTab('payments'),
    },
    {
      title: t('cardCommissionPayable'),
      value: formatCurrency(summary.commission_payable || 0),
      subValue: `Bonus: ${formatCurrency(summary.bonus_payable || 0)}`,
      icon: Percent,
      color: '#8B5CF6',
      badgeBg: isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-700',
      action: () => onNavigateTab('commissions'),
    },
  ];

  const staffFirstName = currentUser.name.trim().split(/\s+/)[0] || 'Staff';

  return (
    <div className="space-y-6">
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
            <span>Staff &amp; Management</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome back, {staffFirstName}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Executive access for <span className="font-bold text-white">{currentUser.role.replace('_', ' ')}</span>
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (onOpenLeadModal) onOpenLeadModal();
            else onNavigateTab('lead_pipeline');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl font-black text-xs flex items-center space-x-2 shadow-lg cursor-pointer transition-all ${
            isDark
              ? 'bg-gradient-to-r from-[#3A7DFF] to-[#7DD3FC] text-slate-950 shadow-[#3A7DFF]/30'
              : 'bg-gradient-to-r from-[#245CFF] to-[#0EA5E9] text-white shadow-blue-500/30'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Student Lead</span>
        </motion.button>
      </div>

      {/* 4 Core Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {coreMetrics.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={card.action}
              className={`p-5 rounded-3xl border cursor-pointer transition-all duration-200 group flex flex-col justify-between ${
                isDark
                  ? 'bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 border-white/5 hover:border-[#7DD3FC]/30 shadow-lg'
                  : 'bg-[#FCFCFD] hover:bg-white border-[#E8EEF7] hover:border-[#CBD5E1] shadow-xs'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'text-[#94A3B8]' : 'text-[#475569]'
                  }`}
                >
                  {card.title}
                </span>
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: `${card.color}25`, color: card.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
                  }`}
                >
                  {card.value}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <span className={`text-[11px] font-semibold ${card.badgeBg} px-2 py-0.5 rounded-full`}>
                    {card.subValue}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#3A7DFF] transition-colors" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Centerpiece: Real Dot & Bar Chart with Presentation & Dimension Switches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Chart Box (Left 8 Columns) */}
        <div
          className={`lg:col-span-8 p-6 rounded-3xl border space-y-5 ${
            isDark
              ? 'bg-[#1B2A4A] border-white/10 shadow-xl'
              : 'bg-[#FCFCFD] border-[#E8EEF7] shadow-sm'
          }`}
        >
          {/* Header Controls (All in ONE single clean row) */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-3 border-b border-white/5">
            {/* Left: Title & Active Dimension Indicator */}
            <div className="flex items-center space-x-2.5 shrink-0">
              <BarChart3 className="w-5 h-5 text-[#3A7DFF]" />
              <div>
                <h3
                  className={`font-black text-base tracking-tight ${
                    isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
                  }`}
                >
                  Live Analytics
                </h3>
                <p className={`text-[11px] font-medium ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
                  Real database metrics • Showing{' '}
                  <span className={`font-bold ${isDark ? 'text-[#7DD3FC]' : 'text-[#245CFF]'}`}>
                    {dataDimension === 'districts'
                      ? 'Districts'
                      : dataDimension === 'funnel'
                      ? 'Funnel Stages'
                      : 'Daily Timeline'}
                  </span>
                </p>
              </div>
            </div>

            {/* Right: Both Switchers in ONE single row */}
            <div className="flex items-center space-x-2.5 flex-nowrap overflow-x-auto max-w-full pb-1 lg:pb-0">
              {/* Chart Mode Switcher: Both / Bar / Dots */}
              <div
                className={`inline-flex items-center p-1 rounded-xl border shrink-0 ${
                  isDark ? 'bg-[#121A35] border-white/10' : 'bg-[#F4F7FB] border-[#E8EEF7]'
                }`}
              >
                <button
                  onClick={() => setChartMode('both')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                    chartMode === 'both'
                      ? isDark
                        ? 'bg-[#3A7DFF] text-white shadow-xs'
                        : 'bg-white text-[#245CFF] shadow-xs'
                      : isDark
                      ? 'text-[#94A3B8] hover:text-white'
                      : 'text-[#475569] hover:text-[#0F274F]'
                  }`}
                >
                  <Layers className="w-3 h-3 mr-1" />
                  <span>Both</span>
                </button>
                <button
                  onClick={() => setChartMode('bar')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                    chartMode === 'bar'
                      ? isDark
                        ? 'bg-[#3A7DFF] text-white shadow-xs'
                        : 'bg-white text-[#245CFF] shadow-xs'
                      : isDark
                      ? 'text-[#94A3B8] hover:text-white'
                      : 'text-[#475569] hover:text-[#0F274F]'
                  }`}
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  <span>Bar Only</span>
                </button>
                <button
                  onClick={() => setChartMode('dot')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                    chartMode === 'dot'
                      ? isDark
                        ? 'bg-[#3A7DFF] text-white shadow-xs'
                        : 'bg-white text-[#245CFF] shadow-xs'
                      : isDark
                      ? 'text-[#94A3B8] hover:text-white'
                      : 'text-[#475569] hover:text-[#0F274F]'
                  }`}
                >
                  <CircleDot className="w-3 h-3 mr-1" />
                  <span>Dots Only</span>
                </button>
              </div>

              {/* Data Dimension Switcher: Districts / Funnel / Timeline */}
              <div
                className={`inline-flex items-center p-1 rounded-xl border shrink-0 ${
                  isDark ? 'bg-[#121A35] border-white/10' : 'bg-[#F4F7FB] border-[#E8EEF7]'
                }`}
              >
                <button
                  onClick={() => setDataDimension('districts')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    dataDimension === 'districts'
                      ? isDark
                        ? 'bg-[#3A7DFF] text-white shadow-xs'
                        : 'bg-white text-[#245CFF] shadow-xs'
                      : isDark
                      ? 'text-[#94A3B8] hover:text-white'
                      : 'text-[#475569] hover:text-[#0F274F]'
                  }`}
                >
                  Districts
                </button>
                <button
                  onClick={() => setDataDimension('funnel')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    dataDimension === 'funnel'
                      ? isDark
                        ? 'bg-[#3A7DFF] text-white shadow-xs'
                        : 'bg-white text-[#245CFF] shadow-xs'
                      : isDark
                      ? 'text-[#94A3B8] hover:text-white'
                      : 'text-[#475569] hover:text-[#0F274F]'
                  }`}
                >
                  Funnel
                </button>
                <button
                  onClick={() => setDataDimension('timeline')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    dataDimension === 'timeline'
                      ? isDark
                        ? 'bg-[#3A7DFF] text-white shadow-xs'
                        : 'bg-white text-[#245CFF] shadow-xs'
                      : isDark
                      ? 'text-[#94A3B8] hover:text-white'
                      : 'text-[#475569] hover:text-[#0F274F]'
                  }`}
                >
                  Timeline
                </button>
              </div>
            </div>
          </div>

          {/* ComposedChart Container */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={activeChartData} margin={{ top: 20, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? 'rgba(255,255,255,0.05)' : '#E8EEF7'}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#121A35' : '#FCFCFD',
                    borderColor: isDark ? 'rgba(125,211,252,0.2)' : '#E8EEF7',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                    color: isDark ? '#F8FAFC' : '#0F274F',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(value) => (
                    <span style={{ color: isDark ? '#F8FAFC' : '#0F274F', fontWeight: 600 }}>
                      {value === 'leads'
                        ? 'Total Inquiries / Leads'
                        : value === 'verified'
                        ? 'Verified Enrolments (Dots)'
                        : 'Benchmark Target (Dots)'}
                    </span>
                  )}
                />

                {/* Render Bar Chart when mode is 'both' or 'bar' */}
                {(chartMode === 'both' || chartMode === 'bar') && (
                  <Bar dataKey="leads" name="leads" radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {activeChartData.map((_, index) => (
                      <Cell
                        key={`real-bar-${index}`}
                        fill={isDark ? 'rgba(58, 125, 255, 0.55)' : '#245CFF'}
                        opacity={isDark && chartMode === 'both' ? 0.9 : 1}
                      />
                    ))}
                  </Bar>
                )}

                {/* Render Dots when mode is 'both' or 'dot' */}
                {(chartMode === 'both' || chartMode === 'dot') && (
                  <>
                    {/* Glowing Emerald Dots for Verified Students */}
                    <Line
                      type="monotone"
                      dataKey="verified"
                      name="verified"
                      stroke={isDark ? '#7DD3FC' : '#0EA5E9'}
                      strokeWidth={chartMode === 'dot' ? 2 : 2.5}
                      dot={{
                        r: chartMode === 'dot' ? 7 : 5.5,
                        fill: isDark ? '#7DD3FC' : '#0EA5E9',
                        stroke: isDark ? '#121A35' : '#FFFFFF',
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 8.5,
                        fill: isDark ? '#7DD3FC' : '#0EA5E9',
                        stroke: isDark ? '#3A7DFF' : '#245CFF',
                        strokeWidth: 3,
                      }}
                    />

                    {/* Gold Dots for Target Thresholds */}
                    <Line
                      type="monotone"
                      dataKey="target"
                      name="target"
                      stroke={isDark ? '#F59E0B' : '#E59E21'}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={{
                        r: 5,
                        fill: isDark ? '#F59E0B' : '#E59E21',
                        stroke: isDark ? '#121A35' : '#FFFFFF',
                        strokeWidth: 2,
                      }}
                    />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real Audit & Target Completion Gauge (Right 4 Columns) */}
        <div
          className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between space-y-6 ${
            isDark
              ? 'bg-[#1B2A4A] border-white/10 shadow-xl'
              : 'bg-[#FCFCFD] border-[#E8EEF7] shadow-sm'
          }`}
        >
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`font-black text-sm uppercase tracking-wider ${
                  isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
                }`}
              >
                Conversion Health
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  isDark
                    ? 'bg-[#121A35] text-[#7DD3FC] border-[#7DD3FC]/20'
                    : 'bg-[#F4F7FB] text-[#0EA5E9] border-[#E8EEF7]'
                }`}
              >
                {summary.conversion_rate || 0}% Target
              </span>
            </div>

            {/* Circular Gauge */}
            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    stroke={isDark ? 'rgba(255,255,255,0.08)' : '#E8EEF7'}
                    strokeWidth="9"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    stroke={isDark ? '#F59E0B' : '#E59E21'}
                    strokeWidth="9"
                    strokeDasharray={2 * Math.PI * 68}
                    strokeDashoffset={2 * Math.PI * 68 * (1 - Math.min(1, (summary.conversion_rate || 0) / 100))}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="56"
                    stroke={isDark ? 'rgba(125,211,252,0.15)' : 'rgba(36,92,255,0.1)'}
                    strokeWidth="2"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span
                    className={`text-3xl font-black tracking-tight ${
                      isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
                    }`}
                  >
                    {summary.conversion_rate || 0}%
                  </span>
                  <span
                    className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 ${
                      isDark ? 'text-[#7DD3FC]' : 'text-[#245CFF]'
                    }`}
                  >
                    VERIFIED &amp; PAID
                  </span>
                </div>
              </div>
            </div>

            {/* Real Metrics Progress */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold">{summary.paid_enrolments || 0} Students</span>
                  <span className={isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}>
                    Verified Collections
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#3A7DFF] to-[#7DD3FC] rounded-full"
                    style={{
                      width: `${summary.total_leads ? Math.min(100, Math.round(((summary.paid_enrolments || 0) / summary.total_leads) * 100)) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold">{funnel.scholarship || 0} Nominations</span>
                  <span className={isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}>
                    Scholarship Quota
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
                    style={{
                      width: `${summary.total_leads ? Math.min(100, Math.round(((funnel.scholarship || 0) / summary.total_leads) * 100)) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigateTab('reports')}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
              isDark
                ? 'bg-[#3A7DFF] hover:bg-[#2F6FE8] text-white shadow-md'
                : 'bg-[#0F274F] hover:bg-[#1B2A4A] text-white shadow-xs'
            }`}
          >
            <span>View Full Financial Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Real District Leaderboard & Exceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real District Contribution Leaderboard */}
        <div
          className={`lg:col-span-6 p-6 rounded-3xl border space-y-4 ${
            isDark
              ? 'bg-[#1B2A4A] border-white/5 shadow-md'
              : 'bg-[#FCFCFD] border-[#E8EEF7] shadow-xs'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3
                className={`font-black text-sm ${
                  isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
                }`}
              >
                District Revenue Leaderboard
              </h3>
              <p className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
                Live collections from database by district &amp; active representatives
              </p>
            </div>
            <MapPin className="w-4 h-4 text-[#3A7DFF]" />
          </div>

          <div className="divide-y divide-white/5 max-h-64 overflow-y-auto pr-1">
            {districts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No regional data recorded yet.</p>
            ) : (
              districts
                .filter((d: any) => d.leads_count > 0 || d.reps_count > 0 || d.revenue > 0)
                .map((d: any) => (
                  <div
                    key={d.id}
                    className="py-2.5 flex justify-between items-center hover:bg-white/5 px-2 rounded-xl transition-colors"
                  >
                    <div>
                      <div
                        className={`font-bold text-xs ${
                          isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
                        }`}
                      >
                        {d.name} <span className="text-slate-400 font-normal text-[11px]">({d.name_si})</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {d.reps_count || 0} Active Reps • {d.leads_count || 0} Registered Leads
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold text-xs ${
                          isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
                        }`}
                      >
                        {formatCurrency(d.revenue || 0)}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        {d.paid_students_count || 0} Paid Enrolments
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Operational Exception Queue */}
        <div
          className={`lg:col-span-6 p-6 rounded-3xl border space-y-4 ${
            isDark
              ? 'bg-[#1B2A4A] border-white/5 shadow-md'
              : 'bg-[#FCFCFD] border-[#E8EEF7] shadow-xs'
          }`}
        >
          <div className="flex justify-between items-center">
            <h3
              className={`font-black text-sm flex items-center space-x-2 ${
                isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
              <span>{t('exceptionQueueTitle')}</span>
            </h3>
            <span className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
              Pending administrative actions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <motion.div
              whileHover={{ y: -2 }}
              onClick={() => onNavigateTab('lead_pipeline')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isDark
                  ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
              }`}
            >
              <div className="text-xs font-bold text-[#F59E0B]">{t('exceptionDupDisputes')}</div>
              <div className="text-2xl font-black mt-1 text-[#D97706]">
                {exceptions.duplicate_disputes || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Pending duplicate review</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              onClick={() => onNavigateTab('payments')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isDark
                  ? 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20'
                  : 'bg-blue-50/60 border-blue-200 hover:bg-blue-50'
              }`}
            >
              <div className="text-xs font-bold text-[#3A7DFF]">{t('exceptionUnverifiedPayments')}</div>
              <div className="text-2xl font-black mt-1 text-[#245CFF]">
                {exceptions.unverified_payments || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Bank slips awaiting verification</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              onClick={() => onNavigateTab('lead_pipeline')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isDark
                  ? 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20'
                  : 'bg-purple-50/60 border-purple-200 hover:bg-purple-50'
              }`}
            >
              <div className="text-xs font-bold text-[#8B5CF6]">{t('exceptionMissingNics')}</div>
              <div className="text-2xl font-black mt-1 text-[#7C3AED]">
                {exceptions.missing_nics || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Missing national ID records</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              onClick={() => onNavigateTab('scholarships')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isDark
                  ? 'bg-pink-500/10 border-pink-500/30 hover:bg-pink-500/20'
                  : 'bg-pink-50/60 border-pink-200 hover:bg-pink-50'
              }`}
            >
              <div className="text-xs font-bold text-[#EC4899]">{t('exceptionScholarships')}</div>
              <div className="text-2xl font-black mt-1 text-[#DB2777]">
                {exceptions.pending_scholarships || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Candidates awaiting decision</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
