import { useEffect, useState } from 'react';
import { GitCompare, Play, Loader2 } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { ErrorBox } from '../../components/common/ErrorBox';
import { useDraft } from '../../stores/draftsStore';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';
import { useHeavyTask } from '../../hooks/useHeavyTask';
import { useHistoryStore } from '../../stores/historyStore';
import { parseJson } from '../../core/json/parse';
import { diffJson, changesToLines } from '../../core/diff';
import type { DiffResult } from '../../core/diff';

export function DiffPage() {
  const left = useDraft('diff-left');
  const right = useDraft('diff-right');
  const addHistory = useHistoryStore((s) => s.add);
  const historyEnabled = useHistoryStore((s) => s.enabled);

  const [lines, setLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DiffResult | null>(null);

  const heavy = useHeavyTask<DiffResult, { left: string; right: string }>(({ left: l, right: r }) => {
    const lp = parseJson(l);
    if (!lp.ok) return { ok: false, error: `Left input: ${lp.error.message}` };
    const rp = parseJson(r);
    if (!rp.ok) return { ok: false, error: `Right input: ${rp.error.message}` };
    return diffJson(lp.value, rp.value);
  });

  const run = () => {
    setError(null);
    if (!left.value.trim() || !right.value.trim()) {
      setError('Both inputs are required. Paste JSON on each side.');
      setLines([]);
      setSummary(null);
      return;
    }
    const sizeBytes = left.value.length + right.value.length;
    heavy.run({ left: left.value, right: right.value }, sizeBytes, {
      type: 'diff',
      toWorkerPayload: (p) => p,
    });
  };

  useEffect(() => {
    if (heavy.result) {
      const result = heavy.result as DiffResult;
      setSummary(result);
      const formatted = changesToLines(result.changes);
      setLines(formatted);
      if (historyEnabled && formatted.length > 0) {
        void addHistory({
          tool: 'diff',
          toolLabel: 'JSON Diff',
          input: left.value,
          output: `${result.added} added · ${result.removed} removed · ${result.modified} modified`,
          settings: JSON.stringify({ equal: result.equal }),
        });
      }
    } else if (heavy.error) {
      setError(heavy.error);
      setLines([]);
      setSummary(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heavy.result, heavy.error]);

  useRunShortcut(run);

  return (
    <ToolPage
      title="JSON Diff"
      description="Side-by-side document comparison"
      icon={GitCompare}
      actions={
        <>
          {summary && (
            <span className="text-[11px] text-muted">
              <span className="text-emerald-600 dark:text-emerald-400">+{summary.added}</span>{' '}
              <span className="text-red-500">-{summary.removed}</span>{' '}
              <span className="text-amber-600 dark:text-amber-400">~{summary.modified}</span>
              {summary.equal && <span className="ml-2 text-muted">Identical ✓</span>}
            </span>
          )}
          <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={run} type="button" disabled={heavy.running}>
            {heavy.running ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <Play className="h-3 w-3" aria-hidden />}
            {heavy.running ? 'Comparing…' : 'Compare'}
          </button>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="grid min-h-0 flex-[2] grid-cols-2">
          <div className="min-h-0 border-r border-edge">
            <JsonInputPanel value={left.value} onChange={left.setValue} label="Left" placeholder='Paste the "before" JSON' />
          </div>
          <div className="min-h-0">
            <JsonInputPanel value={right.value} onChange={right.setValue} label="Right" placeholder='Paste the "after" JSON' />
          </div>
        </div>
        {error && (
          <div className="border-t border-edge px-4 py-3">
            <ErrorBox error={{ message: error, line: 0, column: 0, offset: 0, category: 'UNEXPECTED_TOKEN' }} />
          </div>
        )}
        <div className="min-h-0 flex-[3] border-t border-edge">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b border-edge px-3 py-1">
              <span className="text-[10px] uppercase tracking-wide text-muted">Unified diff</span>
              <span className="ml-auto text-[10px] text-muted">{lines.length} lines</span>
            </div>
            <div className="code-scroll min-h-0 flex-1 overflow-auto font-mono text-[12px] leading-relaxed">
              {lines.length > 0 ? (
                <table className="w-full border-collapse">
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={i} className={rowClass(line)}>
                        <td className="w-8 select-none border-r border-edge px-2 text-right text-muted">{i + 1}</td>
                        <td className="w-6 select-none text-center text-muted">{line.charAt(0)}</td>
                        <td className="whitespace-pre-wrap px-2">{line.slice(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-xs text-muted">
                  {error ? '' : 'Paste two JSON documents and press Compare (Ctrl+Enter).'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolPage>
  );
}

function rowClass(line: string): string {
  if (line.startsWith('+')) return 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300';
  if (line.startsWith('-')) return 'bg-red-600/10 text-red-600 dark:text-red-400';
  return 'text-ink';
}
