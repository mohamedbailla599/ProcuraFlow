import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;

    setProgress(100);
    const startTime = Date.now();
    const duration = 4000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`relative overflow-hidden flex flex-col rounded-2xl shadow-2xl border text-sm max-w-md ${
          isSuccess
            ? 'bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald-950/20'
            : 'bg-slate-900/95 text-white border-rose-500/40 shadow-rose-950/20'
        }`}
      >
        <div className="p-4 flex items-center space-x-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-in zoom-in" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 animate-in zoom-in" />
            )}
          </div>
          <p className="flex-1 font-semibold text-xs leading-relaxed text-slate-100">{toast.text}</p>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress countdown bar */}
        <div className="w-full bg-slate-800 h-1">
          <div
            className={`h-1 transition-all duration-75 ${
              isSuccess ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
