import React, { useState, useId } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logoImg from '../assets/logo.jpeg';

/* ─────────────────────────── types ─────────────────────────── */
interface LoginPageProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  demoUsers?: any[];
  loading: boolean;
}

/* ─────────────────── right-panel slide data ─────────────────── */
const SLIDES = [
  {
    key: 'access' as const,
    icon: ShieldCheck,
    labelKey: 'secureAccess' as const,
    headingKey: 'secureAccessHeading' as const,
    bodyKey: 'secureAccessBody' as const,
    accent: '#7DD3FC',
    statKey: 'protected' as const,
    statSubKey: 'campusCredentialsOnly' as const,
  },
  {
    key: 'students' as const,
    icon: Users,
    labelKey: 'studentFlow' as const,
    headingKey: 'studentFlowHeading' as const,
    bodyKey: 'studentFlowBody' as const,
    accent: '#A5B4FC',
    statKey: 'livePipeline' as const,
    statSubKey: 'leadsToEnrolment' as const,
  },
  {
    key: 'performance' as const,
    icon: TrendingUp,
    labelKey: 'performance' as const,
    headingKey: 'performanceHeading' as const,
    bodyKey: 'performanceBody' as const,
    accent: '#FCD34D',
    statKey: 'oneView' as const,
    statSubKey: 'qualityAndEarnings' as const,
  },
];

type SlideKey = 'access' | 'students' | 'performance';

/* ─────────────────── validation helpers ─────────────────────── */
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/* ══════════════════════════ COMPONENT ══════════════════════════ */
export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, loading }) => {
  const { language, setLanguage, t } = useLanguage();
  const { isDark } = useTheme();
  const uid = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passTouched, setPassTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState<SlideKey>('access');

  const slide = SLIDES.find((s) => s.key === activeSlide)!;
  const SlideIcon = slide.icon;

  const emailError = emailTouched && !isValidEmail(email) ? t('validEmailError') : null;
  const passError = passTouched && password.trim() === '' ? t('emptyPasswordError') : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPassTouched(true);
    if (!isValidEmail(email) || password.trim() === '') return;
    setServerError(null);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setServerError(err.message || t('loginFailed'));
    }
  };

  const blue = isDark ? '#3A7DFF' : '#245CFF';
  const blueHover = isDark ? '#2F6FE8' : '#1A4AE6';
  const cyan = isDark ? '#7DD3FC' : '#0EA5E9';
  const cyanHover = isDark ? '#0EA5E9' : '#0284C7';
  const appBg = isDark ? '#0A1026' : '#EAF0F8';
  const cardBg = isDark ? '#121A35' : '#FFFFFF';
  const inputBg = isDark ? '#1B2A4A' : '#F4F7FB';
  const inputBorder = isDark ? 'rgba(125,211,252,0.18)' : '#E8EEF7';
  const focusBorder = isDark ? '#3A7DFF' : '#245CFF';
  const focusRing = isDark ? 'rgba(58,125,255,0.22)' : 'rgba(36,92,255,0.18)';
  const textPrimary = isDark ? '#F8FAFC' : '#0F274F';
  const textSecondary = isDark ? '#94A3B8' : '#475569';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const labelColor = isDark ? '#94A3B8' : '#475569';
  const langBg = isDark ? 'rgba(18,26,53,0.8)' : 'rgba(255,255,255,0.8)';
  const langBorder = isDark ? 'rgba(255,255,255,0.1)' : '#E8EEF7';
  const errorColor = isDark ? '#FDA4AF' : '#BE123C';

  return (
    <div
      className="min-h-screen p-3 sm:p-5 lg:p-8 transition-colors duration-300"
      style={{ backgroundColor: appBg }}
    >
      <div
        className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-4rem)] max-w-[1200px] overflow-hidden rounded-[2rem] border shadow-2xl"
        style={{
          backgroundColor: cardBg,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
          boxShadow: isDark ? '0 30px 80px rgba(0,0,0,0.55)' : '0 20px 60px rgba(15,39,79,0.12)',
        }}
      >
        {/* ═══════════════ LEFT panel (form) ═══════════════ */}
        <section
          className="relative flex w-full flex-col lg:w-[42%]"
          style={{ backgroundColor: cardBg }}
        >
          {/* Top controls */}
          <div className="flex items-center justify-end gap-3 px-5 pt-5 sm:px-7 sm:pt-6">
            <ThemeToggle />
            <div
              className="flex items-center rounded-xl border p-1 transition-colors"
              style={{ backgroundColor: langBg, borderColor: langBorder }}
            >
              {(['en', 'si'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className="rounded-lg px-3 py-1 text-xs font-bold transition-all"
                  style={
                    language === lang
                      ? { backgroundColor: blue, color: '#FFFFFF' }
                      : { color: textSecondary }
                  }
                >
                  {lang === 'en' ? 'English' : '\u0DC3\u0DD2\u0D82\u0DC4\u0DBD'}
                </button>
              ))}
            </div>
          </div>

          {/* Form body */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-10 pt-4 sm:px-10 lg:px-14"
          >
            {/* Logo */}
            <div className="mb-8">
              <img
                src={logoImg}
                alt="Ziveka Online Campus"
                className="h-14 w-auto object-contain object-left"
              />
            </div>

            {/* Heading */}
            <div className="mb-7">
              <p
                className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em]"
                style={{ color: blue }}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {t('welcomeBack')}
              </p>
              <h1
                className="text-[1.85rem] font-black leading-tight tracking-tight"
                style={{ color: textPrimary }}
              >
                {t('loginHeading')}
              </h1>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: textSecondary }}>
                {t('loginSubtitle')}
              </p>
            </div>

            {/* Server error */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  key="server-err"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  role="alert"
                  className="mb-5 flex items-start gap-2.5 rounded-2xl border px-4 py-3.5"
                  style={{
                    backgroundColor: 'rgba(244,63,94,0.08)',
                    borderColor: 'rgba(244,63,94,0.3)',
                    color: errorColor,
                  }}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-medium leading-snug">{serverError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor={`${uid}-email`}
                  className="mb-1.5 block text-xs font-bold"
                  style={{ color: labelColor }}
                >
                  {t('emailAddress')}
                </label>
                <input
                  id={`${uid}-email`}
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  placeholder={t('emailPlaceholder')}
                  aria-describedby={emailError ? `${uid}-email-err` : undefined}
                  aria-invalid={!!emailError}
                  onChange={(e) => { setEmail(e.target.value); setEmailTouched(true); }}
                  onBlur={() => setEmailTouched(true)}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-150"
                  style={{
                    backgroundColor: inputBg,
                    border: `1.5px solid ${emailError ? (isDark ? '#FDA4AF' : '#E11D48') : inputBorder}`,
                    color: textPrimary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = emailError ? (isDark ? '#FDA4AF' : '#E11D48') : focusBorder;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${emailError ? 'rgba(225,29,72,0.18)' : focusRing}`;
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = emailError ? (isDark ? '#FDA4AF' : '#E11D48') : inputBorder;
                  }}
                />
                <AnimatePresence>
                  {emailError && (
                    <motion.p
                      key="email-err"
                      id={`${uid}-email-err`}
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-1.5 flex items-center gap-1 overflow-hidden text-[11px] font-semibold"
                      style={{ color: errorColor }}
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {emailError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor={`${uid}-password`}
                  className="mb-1.5 block text-xs font-bold"
                  style={{ color: labelColor }}
                >
                  {t('password')}
                </label>
                <div className="relative">
                  <input
                    id={`${uid}-password`}
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    placeholder={t('passwordPlaceholder')}
                    aria-describedby={passError ? `${uid}-pass-err` : undefined}
                    aria-invalid={!!passError}
                    onChange={(e) => { setPassword(e.target.value); setPassTouched(true); }}
                    onBlur={() => setPassTouched(true)}
                    className="w-full rounded-xl py-2.5 pl-3.5 pr-11 text-sm outline-none transition-all duration-150"
                    style={{
                      backgroundColor: inputBg,
                      border: `1.5px solid ${passError ? (isDark ? '#FDA4AF' : '#E11D48') : inputBorder}`,
                      color: textPrimary,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = passError ? (isDark ? '#FDA4AF' : '#E11D48') : focusBorder;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${passError ? 'rgba(225,29,72,0.18)' : focusRing}`;
                    }}
                    onBlurCapture={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = passError ? (isDark ? '#FDA4AF' : '#E11D48') : inputBorder;
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? `${t('password')} - ${language === 'si' ? 'සඟවන්න' : 'Hide'}` : `${t('password')} - ${language === 'si' ? 'පෙන්වන්න' : 'Show'}`}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors"
                    style={{ color: textMuted }}
                    onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.color = textPrimary)}
                    onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.color = textMuted)}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <AnimatePresence>
                  {passError && (
                    <motion.p
                      key="pass-err"
                      id={`${uid}-pass-err`}
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-1.5 flex items-center gap-1 overflow-hidden text-[11px] font-semibold"
                      style={{ color: errorColor }}
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {passError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : undefined}
                whileTap={!loading ? { scale: 0.98 } : undefined}
                transition={{ duration: 0.18 }}
                className="relative mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${blue} 0%, ${cyan} 100%)`,
                  boxShadow: `0 6px 24px ${isDark ? 'rgba(58,125,255,0.35)' : 'rgba(36,92,255,0.28)'}`,
                }}
                onMouseOver={(e) => {
                  if (!loading)
                    (e.currentTarget as HTMLButtonElement).style.background = `linear-gradient(135deg, ${blueHover} 0%, ${cyanHover} 100%)`;
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = `linear-gradient(135deg, ${blue} 0%, ${cyan} 100%)`;
                }}
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span>{t('signingIn')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('signIn')}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </motion.button>
            </form>

            <p className="mt-10 text-[11px]" style={{ color: textMuted }}>
              &copy; {new Date().getFullYear()} Ziveka Online Campus. All rights reserved.
            </p>
          </motion.div>
        </section>

        {/* ═══════════════ RIGHT panel (decorative) ═══════════════ */}
        <section
          aria-hidden="true"
          className="relative hidden overflow-hidden lg:flex lg:w-[58%] lg:flex-col"
          style={{ backgroundColor: '#0F274F' }}
        >
          {/* Grid overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(125,211,252,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,0.3) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full border opacity-25" style={{ borderColor: '#7DD3FC' }} />
          <div className="pointer-events-none absolute -right-20 top-36 h-52 w-52 rounded-full border opacity-30" style={{ borderColor: '#F59E0B' }} />
          <div className="pointer-events-none absolute bottom-24 -left-20 h-64 w-64 rounded-full border opacity-20" style={{ borderColor: '#A5B4FC' }} />
          {/* Glow blob */}
          <div className="pointer-events-none absolute left-1/4 top-1/4 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: '#3A7DFF' }} />

          {/* Content */}
          <div className="relative z-10 flex flex-1 flex-col justify-between p-10">
            {/* Logo */}
            <img src={logoImg} alt="Ziveka Online Campus" className="h-20 w-auto object-contain object-left" />

            {/* Animated headline */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-xs"
              >
                <p
                  className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.22em]"
                  style={{ color: slide.accent }}
                >
                  <SlideIcon className="h-4 w-4" />
                  {t(slide.labelKey)}
                </p>
                <h2 className="whitespace-pre-line text-[2.1rem] font-black leading-tight tracking-tight text-white">
                  {t(slide.headingKey)}
                </h2>
                <p className="mt-4 text-sm leading-6" style={{ color: 'rgba(186,219,252,0.7)' }}>{t(slide.bodyKey)}</p>
              </motion.div>
            </AnimatePresence>

            {/* Workspace status card */}
            <div
              className="rounded-2xl border p-5 shadow-2xl"
              style={{
                backgroundColor: 'rgba(8,27,61,0.7)',
                borderColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(186,219,252,0.5)' }}>{t('workspaceStatus')}</p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={`stat-${activeSlide}`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 4 }}
                      transition={{ duration: 0.22 }}
                      className="mt-1.5 text-lg font-black"
                      style={{ color: slide.accent }}
                    >
                      {t(slide.statKey)}
                    </motion.p>
                  </AnimatePresence>
                  <p className="mt-0.5 text-[11px]" style={{ color: 'rgba(186,219,252,0.55)' }}>{t(slide.statSubKey)}</p>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`icon-${activeSlide}`}
                    initial={{ scale: 0.7, rotate: -15, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0.7, rotate: 10, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: slide.accent,
                    }}
                  >
                    <SlideIcon className="h-6 w-6" />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Tab switchers */}
              <div className="mt-5 flex gap-2" role="tablist" aria-label={t('workspacePreview')}>
                {SLIDES.map((s) => {
                  const Icon = s.icon;
                  const isActive = activeSlide === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveSlide(s.key)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-bold capitalize transition-all duration-150"
                      style={
                        isActive
                          ? { backgroundColor: 'rgba(255,255,255,0.14)', color: '#FFFFFF' }
                          : { color: 'rgba(186,219,252,0.5)' }
                      }
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {t(s.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex items-center gap-2.5 text-xs" style={{ color: 'rgba(186,219,252,0.55)' }}>
              <ShieldCheck className="h-4 w-4" style={{ color: '#F59E0B' }} aria-hidden="true" />
              <span>{t('secureCampusAccess')}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
