import React, { useState, useEffect } from 'react';
import { useLanguage } from './i18n/LanguageContext';
import { useTheme } from './context/ThemeContext';
import { User, District, Course, Representative, Lead, Payment, Commission, PayoutBatch, Scholarship, Activity } from './types';
import { api, setAuthToken, getAuthToken } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { QRModal } from './components/QRModal';
import { LeadModal } from './components/LeadModal';
import { DrilldownModal } from './components/DrilldownModal';
import { PayoutStatementModal } from './components/PayoutStatementModal';

// Pages
import { LoginPage } from './pages/LoginPage';
import { PublicReferralPage } from './pages/PublicReferralPage';

// Representative Views
import { RepDashboard } from './pages/Representative/RepDashboard';
import { RepLeads } from './pages/Representative/RepLeads';
import { RepCommissions } from './pages/Representative/RepCommissions';
import { RepScholarships } from './pages/Representative/RepScholarships';
import { RepProfile } from './pages/Representative/RepProfile';
import { RepKPIAnalytics } from './pages/Representative/RepKPIAnalytics';

// Admin / Finance / Staff Views
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { RepresentativeDirectory } from './pages/Admin/RepresentativeDirectory';
import { LeadPipeline } from './pages/Admin/LeadPipeline';
import { AdmissionsWorkspace } from './pages/Admin/AdmissionsWorkspace';
import { PaymentVerification } from './pages/Admin/PaymentVerification';
import { CommissionWorkspace } from './pages/Admin/CommissionWorkspace';
import { PayoutBatches } from './pages/Admin/PayoutBatches';
import { ScholarshipBoard } from './pages/Admin/ScholarshipBoard';
import { ReportsHub } from './pages/Admin/ReportsHub';
import { SystemSettingsView } from './pages/Admin/SystemSettingsView';
import { CourseManager } from './pages/Admin/CourseManager';
import { AuditLogsView } from './pages/Admin/AuditLogsView';
import { PermissionManagement } from './pages/Admin/PermissionManagement';
import { UserManagement } from './pages/Admin/UserManagement';
import { AccountProfile } from './pages/AccountProfile';
import { Menu, X } from 'lucide-react';

const representativeTabs = new Set([
  'rep_dashboard',
  'rep_referral_tools',
  'rep_leads',
  'rep_commissions',
  'rep_scholarships',
  'rep_kpis',
  'rep_profile',
  'profile',
]);

const adminTabs = new Set([
  'admin_dashboard',
  'representatives',
  'lead_pipeline',
  'admissions',
  'payments',
  'commissions',
  'payouts',
  'scholarships',
  'reports',
  'settings',
  'courses',
  'permissions',
  'user_management',
  'audit_logs',
  'profile',
]);

const getTabFromHash = () => {
  const hash = window.location.hash;
  if (!hash.startsWith('#/') || hash.startsWith('#/r/')) return '';
  return hash.slice(2).trim();
};

export const App: React.FC = () => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Master Data State
  const [districts, setDistricts] = useState<District[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>(() => getTabFromHash());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPublicMode, setIsPublicMode] = useState<boolean>(() => window.location.hash.startsWith('#/r/'));
  const [publicReferralCode, setPublicReferralCode] = useState<string>('ZV-CMB-KASUN');

  // Rep Portal State
  const [repDashboardData, setRepDashboardData] = useState<any>(null);

  // Admin Master State
  const [adminDashboardData, setAdminDashboardData] = useState<any>(null);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payoutBatches, setPayoutBatches] = useState<PayoutBatch[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [scholarshipQuota, setScholarshipQuota] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [repPerformance, setRepPerformance] = useState<any[]>([]);
  const [rolePageAccess, setRolePageAccess] = useState<Record<string, boolean>>({});

  // Modals State
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [statementData, setStatementData] = useState<any | null>(null);
  const [drilldownModal, setDrilldownModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    data: any[];
    type: any;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    data: [],
    type: 'generic',
  });

  const isTabAllowedForRole = (tab: string, role: string) =>
    role === 'representative' ? representativeTabs.has(tab) : adminTabs.has(tab);

  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
    const nextHash = `#/${tab}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  };

  // Keep public and authenticated navigation in the browser history stack.
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/r/')) {
        const code = hash.replace('#/r/', '').trim();
        if (code) setPublicReferralCode(code);
        setIsPublicMode(true);
        return;
      }

      setIsPublicMode(false);
      const tab = getTabFromHash();
      if (tab && (!currentUser || isTabAllowedForRole(tab, currentUser.role))) {
        setActiveTab(tab);
      } else if (currentUser) {
        navigateToTab(currentUser.role === 'representative' ? 'rep_dashboard' : 'admin_dashboard');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [currentUser]);

  // Initial Load: Master Data
  useEffect(() => {
    const initApp = async () => {
      try {
        const [distRes, crsRes] = await Promise.all([
          api.getDistricts().catch(() => ({ districts: [] })),
          api.getCourses().catch(() => ({ courses: [] })),
        ]);

        setDistricts(distRes.districts);
        setCourses(crsRes.courses);

        // Check active session
        const token = getAuthToken();
        if (token) {
          try {
            const meRes = await api.getMe();
            setCurrentUser(meRes.user);
            if (meRes.user.must_change_password) {
              navigateToTab('profile');
            } else {
              setDefaultTabForRole(meRes.user.role);
            }
            const settingsRes = await api.getSettings().catch(() => null);
            setRolePageAccess(settingsRes?.settings.user_registration_role_access || {});
            if (meRes.user.role === 'super_admin') {
              const allCourses = await api.getCourses(true);
              setCourses(allCourses.courses);
            }
          } catch (_) {
            setAuthToken(null);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    initApp();
  }, []);

  const setDefaultTabForRole = (role: string) => {
    const savedTab = getTabFromHash();
    const defaultTab = role === 'representative' ? 'rep_dashboard' : 'admin_dashboard';
    navigateToTab(isTabAllowedForRole(savedTab, role) ? savedTab : defaultTab);
  };

  const refreshCourses = async () => {
    const response = await api.getCourses(currentUser?.role === 'super_admin');
    setCourses(response.courses);
  };

  // Load portal data on user or tab change
  const refreshData = async () => {
    if (!currentUser) return;

    try {
      if (currentUser.role === 'representative') {
        const [repDash, leadsRes, commsRes, scholRes] = await Promise.all([
          api.getMyRepDashboard().catch(() => null),
          api.getLeads().catch(() => ({ leads: [] })),
          api.getCommissions().catch(() => ({ commissions: [] })),
          api.getScholarships().catch(() => ({ scholarships: [], quota: null })),
        ]);
        if (repDash) setRepDashboardData(repDash);
        setLeads(leadsRes.leads || []);
        setCommissions(commsRes.commissions || []);
        setScholarships(scholRes.scholarships || []);
      } else {
        const [adminDash, repsRes, leadsRes, payRes, commsRes, batchRes, scholRes, actRes, perfRes] =
          await Promise.all([
            api.getGlobalDashboard().catch(() => null),
            api.getRepresentatives().catch(() => ({ representatives: [] })),
            api.getLeads().catch(() => ({ leads: [] })),
            api.getPayments().catch(() => ({ payments: [] })),
            api.getCommissions().catch(() => ({ commissions: [] })),
            api.getPayoutBatches().catch(() => ({ batches: [] })),
            api.getScholarships().catch(() => ({ scholarships: [], quota: null })),
            api.getActivities().catch(() => ({ activities: [] })),
            api.getRepPerformance().catch(() => ({ performance: [] })),
          ]);

        if (adminDash) setAdminDashboardData(adminDash);
        setRepresentatives(repsRes.representatives || []);
        setLeads(leadsRes.leads || []);
        setPayments(payRes.payments || []);
        setCommissions(commsRes.commissions || []);
        setPayoutBatches(batchRes.batches || []);
        setScholarships(scholRes.scholarships || []);
        setScholarshipQuota(scholRes.quota);
        setActivities(actRes.activities || []);
        setRepPerformance(perfRes.performance || []);
      }
    } catch (err) {
      console.error('Data refresh error:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, activeTab]);

  const handleLogin = async (email: string, pass: string) => {
    setAuthLoading(true);
    try {
      const res = await api.login(email, pass);
      setAuthToken(res.token);
      setCurrentUser(res.user);
      if (res.requires_password_change) {
        navigateToTab('profile');
      } else {
        setDefaultTabForRole(res.user.role);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (_) {}
    setAuthToken(null);
    setCurrentUser(null);
  };

  // Open Public Landing Mode
  if (isPublicMode || activeTab === 'public_referral') {
    return (
      <PublicReferralPage
        referralCodeFromUrl={publicReferralCode}
        onBackToPortal={() => {
          setIsPublicMode(false);
          if (currentUser) {
            setDefaultTabForRole(currentUser.role);
          } else {
            setActiveTab('');
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
          }
        }}
        districts={districts}
        courses={courses}
      />
    );
  }

  if (authLoading && !currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A1026] text-white p-6">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-[#3A7DFF] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-slate-300">Restoring your session...</p>
        </div>
      </main>
    );
  }

  // Not Logged In -> Render Login Page
  if (!currentUser) {
    return (
      <LoginPage
        onLogin={handleLogin}
        loading={authLoading}
      />
    );
  }

  const isRep = currentUser.role === 'representative';
  const activeRep = currentUser.representative || (repDashboardData ? repDashboardData.representative : null);

  const badgeCounts = {
    unverifiedPayments: adminDashboardData?.exceptions?.unverified_payments || 0,
    pendingScholarships: adminDashboardData?.exceptions?.pending_scholarships || 0,
    duplicateDisputes: adminDashboardData?.exceptions?.duplicate_disputes || 0,
  };

  return (
    <div
      className={`h-screen overflow-hidden flex flex-col font-sans transition-colors duration-300 ${
        isDark ? 'bg-[#0A1026] text-[#F8FAFC]' : 'bg-[#F4F7FB] text-[#0F274F]'
      }`}
    >
      {/* Main Workspace Body */}
      <div className="flex min-h-0 grow">
        {/* Left Sidebar */}
        {isMobileSidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        <Sidebar
          currentRole={currentUser.role}
          activeTab={activeTab}
          onSelectTab={navigateToTab}
          permissions={currentUser.permissions || []}
          rolePageAccess={rolePageAccess}
          badgeCounts={badgeCounts}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <div className="min-w-0 min-h-0 grow flex flex-col">
          <Navbar
            currentUser={currentUser}
            onLogout={handleLogout}
            activeTab={activeTab}
            onOpenProfile={() => navigateToTab('profile')}
          />

          {/* Main Content Area */}
          <main className="min-h-0 grow overflow-y-auto p-3 pb-20 sm:p-6 sm:pb-6 lg:p-8 lg:pb-8 max-w-7xl mx-auto w-full">
          {/* Representative Portal Tabs */}
          {isRep && activeTab === 'rep_dashboard' && (
            <RepDashboard
              representative={activeRep}
              currentUser={currentUser}
              dashboardData={repDashboardData}
              onOpenQRModal={() => setIsQRModalOpen(true)}
              onOpenLeadModal={() => setIsLeadModalOpen(true)}
              onNavigateTab={navigateToTab}
            />
          )}

          {isRep && activeTab === 'rep_referral_tools' && (
            <div
              className={`p-6 rounded-3xl border space-y-4 max-w-2xl ${
                isDark ? 'bg-[#1B2A4A] border-white/5' : 'bg-[#FCFCFD] border-[#E8EEF7]'
              }`}
            >
              <h2 className="text-xl font-bold">{t('navReferralTools')}</h2>
              <p className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
                Share your personal QR code or direct registration link to automatically attribute incoming students
              </p>
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="px-5 py-2.5 bg-[#3A7DFF] hover:bg-[#2F6FE8] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Open QR Generator & Share Modal
              </button>
            </div>
          )}

          {isRep && activeTab === 'rep_leads' && (
            <RepLeads
              leads={leads}
              onOpenLeadModal={() => setIsLeadModalOpen(true)}
            />
          )}

          {isRep && activeTab === 'rep_commissions' && (
            <RepCommissions
              commissions={commissions}
              representative={activeRep}
              onOpenStatement={setStatementData}
            />
          )}

          {isRep && activeTab === 'rep_scholarships' && (
            <RepScholarships
              scholarships={scholarships}
              districts={districts}
              courses={courses}
              onScholarshipSubmitted={refreshData}
            />
          )}

          {isRep && activeTab === 'rep_kpis' && (
            <RepKPIAnalytics
              representative={activeRep}
              kpis={repDashboardData?.kpis}
            />
          )}

          {isRep && activeTab === 'rep_profile' && (
            <RepProfile
              representative={activeRep}
              currentUser={currentUser}
            />
          )}

          {/* Admin & Master Console Tabs */}
          {!isRep && activeTab === 'admin_dashboard' && (
            <AdminDashboard
              currentUser={currentUser}
              dashboardData={adminDashboardData}
              leads={leads}
              payments={payments}
              onOpenDrilldown={(title, subtitle, data, type) =>
                setDrilldownModal({ isOpen: true, title, subtitle, data, type })
              }
              onNavigateTab={navigateToTab}
              onOpenLeadModal={() => setIsLeadModalOpen(true)}
            />
          )}

          {!isRep && activeTab === 'representatives' && (
            <RepresentativeDirectory
              representatives={representatives}
              districts={districts}
              onRefresh={refreshData}
            />
          )}

          {!isRep && activeTab === 'lead_pipeline' && (
            <LeadPipeline
              leads={leads}
              districts={districts}
              courses={courses}
              onOpenLeadModal={() => setIsLeadModalOpen(true)}
              onRefresh={refreshData}
            />
          )}

          {!isRep && activeTab === 'admissions' && (
            <AdmissionsWorkspace
              leads={leads}
              activities={activities}
              courses={courses}
              onRefresh={refreshData}
            />
          )}

          {!isRep && activeTab === 'payments' && (
            <PaymentVerification
              payments={payments}
              leads={leads}
              courses={courses}
              onRefresh={refreshData}
              canVerify={currentUser.role === 'finance_officer' || currentUser.role === 'super_admin'}
            />
          )}

          {!isRep && activeTab === 'commissions' && (
            <CommissionWorkspace
              commissions={commissions}
              representatives={representatives}
              onRefresh={refreshData}
              canApprove={currentUser.role === 'finance_officer' || currentUser.role === 'super_admin'}
            />
          )}

          {!isRep && activeTab === 'payouts' && (
            <PayoutBatches
              batches={payoutBatches}
              approvedCommissions={commissions.filter((c) => c.status === 'approved')}
              representatives={representatives}
              onRefresh={refreshData}
              canManage={currentUser.role === 'finance_officer' || currentUser.role === 'super_admin'}
            />
          )}

          {!isRep && activeTab === 'scholarships' && (
            <ScholarshipBoard
              scholarships={scholarships}
              quota={scholarshipQuota}
              onRefresh={refreshData}
              canReview={currentUser.role === 'super_admin' || currentUser.role === 'campus_admin'}
            />
          )}

          {!isRep && activeTab === 'reports' && (
            <ReportsHub
              reportData={adminDashboardData}
              repPerformance={repPerformance}
            />
          )}

          {!isRep && activeTab === 'settings' && <SystemSettingsView />}

          {!isRep && activeTab === 'courses' && currentUser.role === 'super_admin' && (
            <CourseManager courses={courses} onRefresh={refreshCourses} />
          )}

          {!isRep && activeTab === 'permissions' && currentUser.role === 'super_admin' && (
            <PermissionManagement />
          )}

          {!isRep && activeTab === 'user_management' && (
            <UserManagement districts={districts} />
          )}

          {!isRep && activeTab === 'audit_logs' && <AuditLogsView />}

          {activeTab === 'profile' && <AccountProfile currentUser={currentUser} onProfileUpdated={setCurrentUser} />}
          </main>
        </div>
      </div>

      <button
        type="button"
        aria-label={isMobileSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMobileSidebarOpen}
        onClick={() => setIsMobileSidebarOpen((open) => !open)}
        className="fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#245CFF] text-white shadow-xl ring-4 ring-white/20 lg:hidden"
      >
        {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* QR & Share Modal */}
      {isQRModalOpen && (
        <QRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          representative={activeRep}
          referralCode={activeRep?.active_referral_code}
        />
      )}

      {/* Add Lead Modal */}
      {isLeadModalOpen && (
        <LeadModal
          isOpen={isLeadModalOpen}
          onClose={() => setIsLeadModalOpen(false)}
          onLeadCreated={refreshData}
          districts={districts}
          courses={courses}
          defaultReferralCode={activeRep?.active_referral_code?.code}
        />
      )}

      {/* Drilldown Modal (SRS Section 13.1) */}
      {drilldownModal.isOpen && (
        <DrilldownModal
          isOpen={drilldownModal.isOpen}
          onClose={() => setDrilldownModal({ ...drilldownModal, isOpen: false })}
          title={drilldownModal.title}
          subtitle={drilldownModal.subtitle}
          data={drilldownModal.data}
          type={drilldownModal.type}
        />
      )}

      {/* Printable Payout Statement Modal */}
      {statementData && (
        <PayoutStatementModal
          isOpen={!!statementData}
          onClose={() => setStatementData(null)}
          statementData={statementData}
        />
      )}
    </div>
  );
};
