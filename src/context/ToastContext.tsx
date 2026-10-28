import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number; // ms, defaults to 4000; set to 0 or Infinity for persistent
  action?: ToastAction;
}

export interface ToastItem extends ToastOptions {
  id: string;
  createdAt: number;
  isExiting?: boolean;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (options: ToastOptions | string) => string;
  addToast: (options: ToastOptions | string) => string;
  success: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  error: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  info: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  warning: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATION = 4000;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idCounter = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (options: ToastOptions | string): string => {
      idCounter.current += 1;
      const id = `toast-${Date.now()}-${idCounter.current}`;

      const normalized: ToastItem =
        typeof options === 'string'
          ? {
              id,
              title: options,
              type: 'success',
              duration: DEFAULT_DURATION,
              createdAt: Date.now(),
            }
          : {
              id,
              title: options.title,
              message: options.message,
              type: options.type || 'success',
              duration: options.duration !== undefined ? options.duration : DEFAULT_DURATION,
              action: options.action,
              createdAt: Date.now(),
            };

      setToasts((prev) => {
        // Keep max 4 concurrent toasts to avoid viewport clutter
        const truncated = prev.length >= 4 ? prev.slice(prev.length - 3) : prev;
        return [...truncated, normalized];
      });

      return id;
    },
    []
  );

  const success = useCallback(
    (title: string, message?: string, options?: Partial<ToastOptions>) => {
      return showToast({ title, message, type: 'success', ...options });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<ToastOptions>) => {
      return showToast({ title, message, type: 'error', duration: 5500, ...options });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string, options?: Partial<ToastOptions>) => {
      return showToast({ title, message, type: 'info', ...options });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<ToastOptions>) => {
      return showToast({ title, message, type: 'warning', duration: 5000, ...options });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        addToast: showToast,
        success,
        error,
        info,
        warning,
        dismissToast,
        clearToasts,
      }}
    >
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// --------------------------------------------------------------------------
// Toast Viewport and Card Component
// --------------------------------------------------------------------------

interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ToastViewport: React.FC<ToastViewportProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      aria-live="polite"
      className="fixed z-[100] top-4 right-4 sm:top-6 sm:right-6 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </aside>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? DEFAULT_DURATION;
  const isAutoDismissing = duration > 0 && duration !== Infinity;

  useEffect(() => {
    if (!isAutoDismissing) return;

    let timerId: any = null;
    let intervalId: any = null;

    if (!isPaused) {
      const intervalMs = 40;
      intervalId = setInterval(() => {
        setProgress((prev) => {
          const next = Math.max(0, prev - (intervalMs / duration) * 100);
          return next;
        });
      }, intervalMs);

      timerId = setTimeout(() => {
        onDismiss();
      }, duration);
    }

    return () => {
      if (timerId) clearTimeout(timerId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [duration, isPaused, isAutoDismissing, onDismiss]);

  const typeConfig = {
    success: {
      border: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-500/15 text-emerald-400',
      icon: <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />,
      progressBar: 'bg-emerald-500',
      tag: 'SUCCESS',
    },
    error: {
      border: 'border-rose-500/35',
      badgeBg: 'bg-rose-500/15 text-rose-400',
      icon: <XCircle className="w-4 h-4 shrink-0 text-rose-400" />,
      progressBar: 'bg-rose-500',
      tag: 'ERROR',
    },
    warning: {
      border: 'border-amber-500/35',
      badgeBg: 'bg-amber-500/15 text-amber-400',
      icon: <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />,
      progressBar: 'bg-amber-500',
      tag: 'NOTICE',
    },
    info: {
      border: 'border-emerald-600/30',
      badgeBg: 'bg-emerald-500/15 text-emerald-300',
      icon: <Info className="w-4 h-4 shrink-0 text-emerald-300" />,
      progressBar: 'bg-emerald-400',
      tag: 'INFO',
    },
  }[toast.type || 'success'];

  return (
    <div
      role="status"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-xl bg-stone-900/95 backdrop-blur-md text-stone-100 shadow-xl border ${
        typeConfig.border
      } transition-all duration-200 ease-out ${
        toast.isExiting
          ? 'opacity-0 translate-x-4 scale-95'
          : 'opacity-100 translate-x-0 scale-100'
      }`}
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        {/* Status Icon */}
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${typeConfig.badgeBg}`}
        >
          {typeConfig.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-stone-100 leading-snug tracking-tight">
              {toast.title}
            </h4>
          </div>

          {toast.message && (
            <p className="text-xs text-stone-300 mt-1 leading-relaxed line-clamp-3">
              {toast.message}
            </p>
          )}

          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
              className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>{toast.action.label}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="text-stone-400 hover:text-stone-100 p-1 rounded-md transition-colors shrink-0 -mr-1 -mt-1 hover:bg-stone-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Line */}
      {isAutoDismissing && (
        <div className="h-0.5 w-full bg-stone-800">
          <div
            className={`h-full ${typeConfig.progressBar} transition-all ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
