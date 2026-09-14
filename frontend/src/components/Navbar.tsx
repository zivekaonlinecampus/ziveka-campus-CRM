import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { User } from '../types';
import { LogOut, Search } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { motion } from 'motion/react';
import { getProfilePictureUrl } from '../services/api';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenProfile: () => void;
  activeTab?: string;
  onOpenNotifications?: () => void;
  activeWorkspace?: string;
  onSelectWorkspace?: (ws: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenProfile,
  activeTab = 'admin_dashboard',
  activeWorkspace = 'HR',
  onSelectWorkspace,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { isDark } = useTheme();

  const pageLabels: Record<string, string> = {
    admin_dashboard: t('navDashboard'),
    rep_dashboard: t('navDashboard'),
    rep_referral_tools: t('navReferralTools'),
    rep_leads: t('navMyLeads'),
    rep_commissions: t('navMyCommissions'),
    rep_scholarships: t('navMyScholarships'),
    rep_kpis: t('navQualityKPI'),
    rep_profile: t('navMyProfile'),
    representatives: t('navRepresentatives'),
    lead_pipeline: t('navLeads'),
    admissions: t('navAdmissions'),
    payments: t('navPayments'),
    commissions: t('navCommissions'),
    payouts: t('navPayouts'),
    scholarships: t('navScholarships'),
    reports: t('navReports'),
    settings: t('navSettings'),
    courses: t('navCourses'),
    audit_logs: t('navAudit'),
    user_management: t('registerUsers'),
    permissions: t('permissions'),
    profile: t('accountProfile'),
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 border-b backdrop-blur-xl ${
        isDark
          ? 'bg-[#121A35]/90 border-white/5 shadow-[0_4px_25px_rgba(0,0,0,0.3)]'
          : 'bg-[#FCFCFD]/90 border-[#E8EEF7] shadow-xs'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 justify-between items-center h-16 gap-2">
          <div className={`flex min-w-0 items-center gap-2 text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
            <span className="hidden shrink-0 sm:inline">{t('appName')}</span>
            <span className="text-slate-400">/</span>
            <span className={`min-w-0 truncate font-bold ${isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'}`}>
              {pageLabels[activeTab] || t('navDashboard')}
            </span>
          </div>

          {/* Right Header Actions */}
          <div className="flex shrink-0 items-center space-x-1.5 sm:space-x-4">
            {/* Theme Toggle (Dark / Light Mode) */}
            <ThemeToggle />

            {/* Bilingual Switcher */}
            <div
              className={`flex items-center p-1 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-[#1B2A4A] border-white/10'
                  : 'bg-[#F4F7FB] border-[#E8EEF7]'
              }`}
            >
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === 'en'
                    ? isDark
                      ? 'bg-[#3A7DFF] text-white shadow-xs'
                      : 'bg-white text-[#245CFF] shadow-xs'
                    : isDark
                    ? 'text-[#94A3B8] hover:text-white'
                    : 'text-[#475569] hover:text-[#0F274F]'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('si')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === 'si'
                    ? isDark
                      ? 'bg-[#3A7DFF] text-white shadow-xs'
                      : 'bg-white text-[#245CFF] shadow-xs'
                    : isDark
                    ? 'text-[#94A3B8] hover:text-white'
                    : 'text-[#475569] hover:text-[#0F274F]'
                }`}
              >
                සිං
              </button>
            </div>

            {/* Current User Badge & Profile */}
            {currentUser && (
              <div
                className={`flex items-center space-x-2 pl-3 border-l ${
                  isDark ? 'border-white/10' : 'border-[#E8EEF7]'
                }`}
              >
                <button type="button" onClick={onOpenProfile} className="flex items-center space-x-2 rounded-lg text-left cursor-pointer">
                  {getProfilePictureUrl(currentUser.profile_picture_path) ? (
                    <img src={getProfilePictureUrl(currentUser.profile_picture_path) as string} alt="" className="h-8 w-8 rounded-full object-cover shadow-xs" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3A7DFF] to-[#7DD3FC] text-white flex items-center justify-center font-black text-xs shadow-xs">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden lg:block">
                    <div className={`text-xs font-bold leading-none ${isDark ? 'text-[#F8FAFC]' : 'text-[#0F274F]'}`}>
                      {currentUser.name}
                    </div>
                    <div className={`text-[10px] font-semibold capitalize mt-0.5 ${isDark ? 'text-[#7DD3FC]' : 'text-[#245CFF]'}`}>
                      {t(`role_${currentUser.role}` as any) || currentUser.role}
                    </div>
                  </div>
                </button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors ml-1 cursor-pointer"
                  title={t('logout')}
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
