import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
} as const;

const COLORS = {
  success: 'border-emerald-600/40 text-emerald-600 dark:text-emerald-400',
  error: 'border-red-600/40 text-red-600 dark:text-red-400',
  info: 'border-sky-600/40 text-sky-600 dark:text-sky-400',
  warning: 'border-amber-600/40 text-amber-600 dark:text-amber-400',
} as const;

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return (
    <div
      className="pointer-events-none fixed bottom-9 right-3 z-[80] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      aria-live="polite"
      role="status"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2 rounded-md border bg-surface-2 px-3 py-2 text-xs shadow-lg ${COLORS[toast.type]}`}
          >
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="flex-1 text-ink">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="text-muted hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
