'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';

type Tone = 'success' | 'error' | 'info';
type Toast = { id: number; message: string; tone: Tone };
type ToastFn = (message: string, tone?: Tone) => void;

const TONE: Record<Tone, string> = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-gray-800' };

const ToastContext = createContext<ToastFn>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((items) => items.filter((t) => t.id !== id)), []);

  const toast = useCallback<ToastFn>(
    (message, tone = 'info') => {
      const id = ++seq.current;
      setToasts((items) => [...items, { id, message, tone }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={clsx('flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg', TONE[t.tone])}
          >
            <span>{t.message}</span>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="ml-auto text-lg leading-none">
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
