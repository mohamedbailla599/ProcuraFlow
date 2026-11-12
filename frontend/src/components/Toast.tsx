import React, { useEffect, useState, useMemo } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

interface ToastProps {
  toast?: ToastMessage | null;
  toasts?: ToastMessage[];
  onClose: (id?: string) => void;
}

const ToastItem: React.FC<{
  toast: ToastMessage;
  onClose: (id: string) => void;
}> = ({ toast, onClose }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const duration = 4200;
    const intervalMs = 25;
    const step = (intervalMs / duration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev <= step) {
            clearInterval(timer);
            onClose(toast.id);
            return 0;
          }
          return prev - step;
        });
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [toast.id, isPaused, onClose]);

  const config = useMemo(() => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          iconBg: 'bg-emerald-500/20 text-emerald-400',
          border: 'border-emerald-500/40 shadow-emerald-950/20',
          progressBg: 'bg-gradient-to-r from-emerald-500 to-teal-400',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          iconBg: 'bg-amber-500/20 text-amber-400',
          border: 'border-amber-500/40 shadow-amber-950/20',
          progressBg: 'bg-gradient-to-r from-amber-500 to-yellow-400',
        };
      case 'info':
        return {
          icon: <Info className="w-4 h-4 text-sky-400" />,
          iconBg: 'bg-sky-500/20 text-sky-400',
          border: 'border-sky-500/40 shadow-sky-950/20',
          progressBg: 'bg-gradient-to-r from-sky-500 to-teal-400',
        };
      case 'error':
      default:
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
          iconBg: 'bg-rose-500/20 text-rose-400',
          border: 'border-rose-500/40 shadow-rose-950/20',
          progressBg: 'bg-gradient-to-r from-rose-500 to-red-400',
        };
    }
  }, [toast.type]);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden flex flex-col rounded-2xl shadow-2xl border text-sm max-w-md w-full bg-slate-900/95 dark:bg-slate-850/95 backdrop-blur-md text-white transition-all duration-200 animate-slide-in-right ${config.border}`}
    >
      <div className="p-3.5 flex items-start space-x-3">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${config.iconBg}`}
        >
          {config.icon}
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <p className="font-semibold text-xs leading-relaxed text-slate-100 break-words">
            {toast.text}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer shrink-0"
          aria-label="Fermer la notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Auto-dismiss timer progress bar */}
      <div className="w-full bg-slate-800/80 h-1">
        <div
          className={`h-1 transition-all duration-75 ${config.progressBg}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const Toast: React.FC<ToastProps> = ({ toast, toasts, onClose }) => {
  const activeToasts = useMemo(() => {
    if (toasts && toasts.length > 0) return toasts;
    if (toast) return [toast];
    return [];
  }, [toast, toasts]);

  if (activeToasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none"
    >
      {activeToasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={(id) => onClose(id)} />
      ))}
    </div>
  );
};
