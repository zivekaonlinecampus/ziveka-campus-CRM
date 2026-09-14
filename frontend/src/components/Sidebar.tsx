import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';
import logoImg from '../assets/logo.jpeg';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  GitPullRequest,
  GraduationCap,
  CreditCard,
  Percent,
  Receipt,
  Award,
  BarChart3,
  Sliders,
  ShieldAlert,
  QrCode,
  UserCheck,
  User,
  UserPlus,
  BookOpen,
  KeyRound,
  Headphones,
  ArrowUpRight,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentRole: UserRole;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  permissions?: string[];
  rolePageAccess?: Partial<Record<UserRole, boolean>>;
  badgeCounts?: {
    unverifiedPayments?: number;
    pendingScholarships?: number;
    duplicateDisputes?: number;
  };
  onLogout?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onSelectTab,
  permissions = [],
  rolePageAccess = {},
  badgeCounts = {},
  onLogout,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const isRep = currentRole === 'representative';
  const isAdmin = currentRole === 'super_admin' || currentRole === 'campus_admin';
  const isFinance = currentRole === 'finance_officer' || currentRole === 'super_admin';
  const isCounsellor = currentRole === 'counsellor' || isAdmin;
  const isAuditor = currentRole === 'auditor';

  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
    show: boolean;
    section?: 'main' | 'system';
  }

  const navItems: NavItem[] = [
    // Representative Portal Tabs
    {
      id: 'rep_dashboard',
      label: t('navDashboard'),
      icon: LayoutDashboard,
      show: isRep,
      section: 'main',
    },
    {
      id: 'rep_referral_tools',
      label: t('navReferralTools'),
      icon: QrCode,
      show: isRep,
      section: 'main',
    },
    {
      id: 'rep_leads',
      label: t('navMyLeads'),
      icon: Users,
      show: isRep,
      section: 'main',
    },
    {
      id: 'rep_commissions',
      label: t('navMyCommissions'),
      icon: Percent,
      show: isRep,
      section: 'main',
    },
    {
      id: 'rep_scholarships',
      label: t('navMyScholarships'),
      icon: Award,
      show: isRep,
      section: 'main',
    },
    {
      id: 'rep_kpis',
      label: t('navQualityKPI'),
      icon: BarChart3,
      show: isRep,
      section: 'main',
    },
    {
      id: 'rep_profile',
      label: t('navMyProfile'),
      icon: User,
      show: isRep,
      section: 'system',
    },

    // Admin & Master Portals Tabs
    {
      id: 'admin_dashboard',
      label: t('navDashboard'),
      icon: LayoutDashboard,
      show: !isRep,
      section: 'main',
    },
    {
      id: 'representatives',
      label: t('navRepresentatives'),
      icon: UserCheck,
      show: isAdmin || isFinance || isAuditor,
      section: 'main',
    },
    {
      id: 'lead_pipeline',
      label: t('navLeads'),
      icon: GitPullRequest,
      badge: badgeCounts.duplicateDisputes,
      show: isAdmin || isCounsellor || isAuditor,
      section: 'main',
    },
    /*
    {
      id: 'admissions',
      label: t('navAdmissions'),
      icon: GraduationCap,
      show: isAdmin || isCounsellor,
      section: 'main',
    },
    */
    {
      id: 'payments',
      label: t('navPayments'),
      icon: CreditCard,
      badge: badgeCounts.unverifiedPayments,
      show: isFinance || isAuditor,
      section: 'main',
    },
    {
      id: 'commissions',
      label: t('navCommissions'),
      icon: Percent,
      show: isFinance || isAuditor,
      section: 'main',
    },
    {
      id: 'payouts',
      label: t('navPayouts'),
      icon: Receipt,
      show: isFinance || isAuditor,
      section: 'main',
    },
    {
      id: 'scholarships',
      label: t('navScholarships'),
      icon: Award,
      badge: badgeCounts.pendingScholarships,
      show: isAdmin || isFinance || isAuditor,
      section: 'main',
    },
    {
      id: 'reports',
      label: t('navReports'),
      icon: BarChart3,
      show: !isRep,
      section: 'main',
    },
    {
      id: 'courses',
      label: t('navCourses'),
      icon: BookOpen,
      show: currentRole === 'super_admin',
      section: 'system',
    },
    {
      id: 'user_management',
      label: t('registerUsers'),
      icon: UserPlus,
      show: currentRole === 'super_admin' || Boolean(rolePageAccess[currentRole]) || permissions.includes('manage_user_accounts'),
      section: 'system',
    },
    {
      id: 'permissions',
      label: t('permissions'),
      icon: KeyRound,
      show: currentRole === 'super_admin',
      section: 'system',
    },
    {
      id: 'settings',
      label: t('navSettings'),
      icon: Sliders,
      show: currentRole === 'super_admin',
      section: 'system',
    },
    {
      id: 'audit_logs',
      label: t('navAudit'),
      icon: ShieldAlert,
      show: currentRole === 'super_admin' || currentRole === 'auditor',
      section: 'system',
    },
  ];

  const mainItems = navItems.filter((i) => i.show && i.section === 'main');
  const systemItems = navItems.filter((i) => i.show && i.section === 'system');

  return (
    <aside
      className={`${isMobileOpen ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-50 w-[min(18rem,88vw)] h-screen max-h-screen overflow-y-auto p-4 flex-col justify-between shrink-0 transition-colors duration-300 border-r lg:static lg:flex lg:w-64 ${
        isDark
          ? 'bg-[#121A35] border-white/5 text-[#F8FAFC]'
          : 'bg-[#0F274F] border-[#E8EEF7] text-white'
      }`}
    >
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onCloseMobile}
        className="absolute right-3 top-3 rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="space-y-6">
        <div className="-mx-4 -mt-4 flex min-h-52 flex-col items-stretch justify-center gap-3 border-b border-white/10 px-5 py-4">
          <img src={logoImg} alt="Ziveka Online Campus" className="h-24 w-full object-contain" />
          <div className="flex flex-col items-start px-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-white">{t('appName')}</span>
            </div>
            <span className="text-[10px] font-medium text-[#94A3B8]">{t('crmTitle')}</span>
          </div>
        </div>

        {/* Navigation Header */}
        <div className="px-3 pt-2 flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#7DD3FC]/80">
            {isRep ? t('representativeWorkspace') : t('masterWorkspace')}
          </span>
        </div>

        {/* Main Navigation Items */}
        <nav className="space-y-1.5">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                whileHover={{ x: isActive ? 0 : 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'bg-[#0A1026] text-[#F8FAFC] shadow-lg border-l-4 border-[#3A7DFF]'
                      : 'bg-[#FCFCFD] text-[#0F274F] shadow-md border-l-4 border-[#245CFF]'
                    : isDark
                    ? 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1B2A4A]/60'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? isDark
                          ? 'text-[#7DD3FC]'
                          : 'text-[#245CFF]'
                        : isDark
                        ? 'text-[#94A3B8]'
                        : 'text-slate-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>

                {item.badge && item.badge > 0 ? (
                  <span
                    className={`px-2 py-0.5 text-xs font-black rounded-full shadow-xs ${
                      isActive
                        ? isDark
                          ? 'bg-[#3A7DFF] text-white'
                          : 'bg-[#245CFF] text-white'
                        : 'bg-[#F59E0B] text-slate-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
                </div>
              </motion.button>
            );
            })}
        </nav>

        {/* System & Settings Section */}
        {systemItems.length > 0 && (
          <div className="pt-3 border-t border-white/10 space-y-1.5">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t('systemControl')}
            </div>
            {systemItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: isActive ? 0 : 3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-[#0A1026] text-[#F8FAFC] shadow-lg border-l-4 border-[#3A7DFF]'
                        : 'bg-[#FCFCFD] text-[#0F274F] shadow-md border-l-4 border-[#245CFF]'
                      : isDark
                      ? 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1B2A4A]/60'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? isDark
                            ? 'text-[#7DD3FC]'
                            : 'text-[#245CFF]'
                          : isDark
                          ? 'text-[#94A3B8]'
                          : 'text-slate-300'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Section: Support 24/7 Widget Card (matching reference image) */}
      <div className="mt-6 space-y-3">
        <div
          className={`p-4 rounded-2xl relative overflow-hidden border backdrop-blur-md transition-all ${
            isDark
              ? 'bg-[#1B2A4A]/70 border-white/10 shadow-lg'
              : 'bg-white/10 border-white/15 shadow-md'
          }`}
        >
          {/* Subtle glow circle in corner */}
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#3A7DFF]/20 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10 mb-2">
            <div>
              <div className="text-xs font-black text-white flex items-center space-x-1.5">
                <Headphones className="w-3.5 h-3.5 text-[#7DD3FC]" />
                <span>{t('support247')}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {t('contactHelpdesk')}
              </p>
            </div>
          </div>

          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href="mailto:Helpdesk@zivekaCampus.com"
            aria-label="Email Help Desk"
            className={`w-full mt-2 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer ${
              isDark
                ? 'bg-gradient-to-r from-[#D97706] to-[#F59E0B] hover:from-[#B45309] hover:to-[#D97706] text-slate-950 font-black'
                : 'bg-gradient-to-r from-[#C67A00] to-[#E59E21] text-white font-bold'
            }`}
          >
            <span>{t('helpDesk')}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </motion.a>
        </div>

      </div>
    </aside>
  );
};
