import React, { useEffect, useState } from 'react';
import { AlertTriangle, Info, ShieldCheck, X } from 'lucide-react';

type PromptRequest = {
  message: string;
  defaultValue: string;
  resolve: (value: string | null) => void;
};

let pendingPrompt: ((value: string | null) => void) | null = null;

export const requestPrompt = (message: string, defaultValue = ''): Promise<string | null> => {
  return new Promise((resolve) => {
    pendingPrompt = resolve;
    window.dispatchEvent(new CustomEvent<PromptRequest>('ziveka:prompt', {
      detail: { message, defaultValue, resolve },
    }));
  });
};

export const ThemedAlertHost: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [promptRequest, setPromptRequest] = useState<PromptRequest | null>(null);
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => {
    const nativeAlert = window.alert;
    window.alert = (nextMessage?: string) => setMessage(nextMessage || 'Something went wrong.');
    const handlePrompt = (event: Event) => {
      const nextRequest = (event as CustomEvent<PromptRequest>).detail;
      setPromptRequest(nextRequest);
      setPromptValue(nextRequest.defaultValue);
    };
    window.addEventListener('ziveka:prompt', handlePrompt);

    return () => {
      window.alert = nativeAlert;
      window.removeEventListener('ziveka:prompt', handlePrompt);
    };
  }, []);

  const closePrompt = (value: string | null) => {
    promptRequest?.resolve(value);
    if (pendingPrompt) pendingPrompt = null;
    setPromptRequest(null);
  };

  if (message === null && promptRequest === null) return null;

  if (promptRequest) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md" onClick={() => closePrompt(null)}>
        <form
          role="dialog"
          aria-modal="true"
          onSubmit={(event) => {
            event.preventDefault();
            closePrompt(promptValue);
          }}
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl animate-in fade-in zoom-in-95"
        >
          <div className="flex items-start gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-5 py-4 text-white">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300 ring-1 ring-inset ring-amber-300/20">
              <Info className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold tracking-tight">Additional information required</h2>
              <p className="mt-0.5 text-[11px] text-slate-300">Ziveka Online Campus</p>
            </div>
            <button type="button" onClick={() => closePrompt(null)} aria-label="Close prompt" className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 px-5 py-6 sm:px-6">
            <label htmlFor="app-prompt-input" className="block text-sm leading-6 text-slate-700">{promptRequest.message}</label>
            <input
              id="app-prompt-input"
              autoFocus
              value={promptValue}
              onChange={(event) => setPromptValue(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
            <button type="button" onClick={() => closePrompt(null)} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200">Cancel</button>
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700">
              <ShieldCheck className="h-4 w-4" /> OK
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md"
      onClick={() => setMessage(null)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Notification"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl animate-in fade-in zoom-in-95"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-5 py-4 text-white">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-400/15 text-rose-300 ring-1 ring-inset ring-rose-300/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold tracking-tight">Action could not be completed</h2>
            <p className="mt-0.5 text-[11px] text-slate-300">Ziveka Online Campus</p>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            aria-label="Close notification"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-6 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Info className="h-4 w-4" />
            </div>
            <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{message}</p>
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button
            type="button"
            autoFocus
            onClick={() => setMessage(null)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <ShieldCheck className="h-4 w-4" />
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
