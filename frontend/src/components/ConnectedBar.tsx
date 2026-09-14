import React from 'react';
import { motion } from 'motion/react';
import { Link2, QrCode, GraduationCap, CreditCard, Percent, Award, BookOpen, UserPlus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ConnectedBarProps {
  onSelectTab: (tab: string) => void;
  activeTab?: string;
  isRep?: boolean;
}

export const ConnectedBar: React.FC<ConnectedBarProps> = ({ onSelectTab, activeTab, isRep }) => {
  const { isDark } = useTheme();

  const items = isRep
    ? [
        {
          id: 'rep_referral_tools',
          name: 'QR Referral Engine',
          subtitle: 'Active Link',
          icon: QrCode,
          color: '#3A7DFF',
          bgLight: '#EFF6FF',
          bgDark: 'rgba(58, 125, 255, 0.15)',
          online: true,
        },
        {
          id: 'rep_leads',
          name: 'Direct Leads',
          subtitle: 'Real-time Pipeline',
          icon: UserPlus,
          color: '#0EA5E9',
          bgLight: '#F0F9FF',
          bgDark: 'rgba(14, 165, 233, 0.15)',
          online: true,
        },
        {
          id: 'rep_commissions',
          name: 'Fast Commission',
          subtitle: 'Tier Calculation',
          icon: Percent,
          color: '#F59E0B',
          bgLight: '#FFFBEB',
          bgDark: 'rgba(245, 158, 11, 0.15)',
          online: true,
        },
        {
          id: 'rep_scholarships',
          name: 'Scholarship Quota',
          subtitle: 'District Allocation',
          icon: Award,
          color: '#10B981',
          bgLight: '#ECFDF5',
          bgDark: 'rgba(16, 185, 129, 0.15)',
          online: true,
        },
      ]
    : [
        {
          id: 'lead_pipeline',
          name: 'Lead Pipeline',
          subtitle: 'Multi-channel',
          icon: UserPlus,
          color: '#3A7DFF',
          bgLight: '#EEF2FF',
          bgDark: 'rgba(58, 125, 255, 0.15)',
          online: true,
        },
        {
          id: 'admissions',
          name: 'Admissions Desk',
          subtitle: 'Student Enrolment',
          icon: GraduationCap,
          color: '#0EA5E9',
          bgLight: '#F0F9FF',
          bgDark: 'rgba(14, 165, 233, 0.15)',
          online: true,
        },
        {
          id: 'payments',
          name: 'Payment Verification',
          subtitle: 'Bank Slips / Online',
          icon: CreditCard,
          color: '#10B981',
          bgLight: '#ECFDF5',
          bgDark: 'rgba(16, 185, 129, 0.15)',
          online: true,
        },
        {
          id: 'commissions',
          name: 'Commission Engine',
          subtitle: 'Automated Payouts',
          icon: Percent,
          color: '#F59E0B',
          bgLight: '#FFFBEB',
          bgDark: 'rgba(245, 158, 11, 0.15)',
          online: true,
        },
        {
          id: 'scholarships',
          name: 'Scholarship Board',
          subtitle: 'CSR & Merit',
          icon: Award,
          color: '#8B5CF6',
          bgLight: '#F5F3FF',
          bgDark: 'rgba(139, 92, 246, 0.15)',
          online: true,
        },
        {
          id: 'courses',
          name: 'Curriculum Hub',
          subtitle: 'Academic Programs',
          icon: BookOpen,
          color: '#EC4899',
          bgLight: '#FDF2F8',
          bgDark: 'rgba(236, 72, 153, 0.15)',
          online: true,
        },
      ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 mb-6">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <motion.div
            key={item.id}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectTab(item.id)}
            className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-between text-center border ${
              isActive
                ? isDark
                  ? 'bg-[#1B2A4A] border-[#3A7DFF] shadow-[0_0_20px_rgba(58,125,255,0.25)]'
                  : 'bg-white border-[#245CFF] shadow-[0_4px_20px_rgba(36,92,255,0.12)]'
                : isDark
                ? 'bg-[#1B2A4A]/80 hover:bg-[#1B2A4A] border-white/5 hover:border-[#7DD3FC]/30 shadow-md'
                : 'bg-[#FCFCFD] hover:bg-white border-[#E8EEF7] hover:border-[#CBD5E1] shadow-xs'
            }`}
          >
            {/* Top row: Link icon and Live Status dot */}
            <div className="w-full flex items-center justify-between mb-3 text-slate-400">
              <Link2 className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-[#3A7DFF]' : 'text-slate-400/60 group-hover:text-slate-400'}`} />
              {item.online && (
                <div className="flex items-center space-x-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
              )}
            </div>

            {/* Central Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-2.5 transition-transform duration-200 group-hover:scale-110 shadow-xs"
              style={{
                backgroundColor: isDark ? item.bgDark : item.bgLight,
                color: item.color,
              }}
            >
              <Icon className="w-6 h-6" />
            </div>

            {/* Label */}
            <div>
              <div
                className={`text-xs font-bold tracking-tight transition-colors ${
                  isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'
                }`}
              >
                {item.name}
              </div>
              <div
                className={`text-[10px] truncate max-w-[120px] ${
                  isDark ? 'text-[#94A3B8]' : 'text-[#475569]'
                }`}
              >
                {item.subtitle}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
