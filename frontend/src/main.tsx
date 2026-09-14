import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import { ThemedAlertHost } from './components/ThemedAlertHost'

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application render error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A1026] text-white p-6">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121A35] p-8 text-center shadow-xl">
          <h1 className="text-lg font-bold text-white">Unable to load this page</h1>
          <p className="mt-2 break-words text-sm text-slate-300">{this.state.error?.message || 'Please refresh and try again.'}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-[#3A7DFF] px-4 py-2 text-xs font-bold text-white hover:bg-[#2F6FE8] cursor-pointer">Refresh page</button>
        </section>
      </main>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <AppErrorBoundary>
          <App />
          <ThemedAlertHost />
        </AppErrorBoundary>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
)
