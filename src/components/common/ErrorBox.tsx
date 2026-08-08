import { AlertTriangle, CheckCircle2, Copy } from 'lucide-react';
import type { JsonParseError } from '../../core/json/parse';
import { useCopy } from '../../hooks/useClipboard';

export interface ErrorBoxProps {
  error: JsonParseError;
  onGoToError?: () => void;
}

export function ErrorBox({ error, onGoToError }: ErrorBoxProps) {
  const { copy } = useCopy();
  return (
    <div className="rounded-md border border-red-600/40 bg-red-600/5 p-3 text-sm" role="alert">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
          <div>
            <p className="font-semibold text-red-600 dark:text-red-400">
              {error.category === 'EMPTY_INPUT' ? 'Empty input' : 'Invalid JSON'}
            </p>
            {error.line > 0 && (
              <p className="mt-0.5 text-xs text-muted">
                Line: {error.line} · Column: {error.column}
              </p>
            )}
            <p className="mt-1 text-ink">{error.message}</p>
            {error.expected && error.expected.length > 0 && (
              <p className="mt-1 text-xs text-muted">
                Expected: {error.expected.join(', ')}
              </p>
            )}
            {error.suggestion && (
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                Suggestion: {error.suggestion}
              </p>
            )}
          </div>
        </div>
        <button
          className="toolbar-btn shrink-0"
          onClick={() =>
            copy(
              `${error.message}\nLine: ${error.line}\nColumn: ${error.column}${error.suggestion ? `\nSuggestion: ${error.suggestion}` : ''}`,
              'Error details copied',
            )
          }
          type="button"
          aria-label="Copy error details"
        >
          <Copy className="h-3 w-3" aria-hidden />
        </button>
      </div>
      {onGoToError && (
        <button
          className="mt-2 text-xs font-medium text-accent underline-offset-2 hover:underline"
          onClick={onGoToError}
          type="button"
        >
          Go to error
        </button>
      )}
    </div>
  );
}

export function SuccessBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-600/40 bg-emerald-600/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3 w-3" aria-hidden />
      {children}
    </span>
  );
}
