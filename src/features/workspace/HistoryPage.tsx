import { useEffect } from 'react';
import { History, Trash2, Star, Copy, ExternalLink, Eraser } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { useHistoryStore } from '../../stores/historyStore';
import { useCopy } from '../../hooks/useClipboard';
import { useOpenInTool } from '../../hooks/useOpenInTool';
import { useUiStore } from '../../stores/uiStore';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function HistoryPage() {
  const entries = useHistoryStore((s) => s.entries);
  const loaded = useHistoryStore((s) => s.loaded);
  const load = useHistoryStore((s) => s.load);
  const remove = useHistoryStore((s) => s.remove);
  const toggleFavorite = useHistoryStore((s) => s.toggleFavorite);
  const clear = useHistoryStore((s) => s.clear);
  const { copy } = useCopy();
  const openInTool = useOpenInTool();
  const toast = useUiStore((s) => s.toast);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  return (
    <ToolPage
      title="History"
      description="Local operation history"
      icon={History}
      actions={
        entries.length > 0 ? (
          <button className="btn !px-3 !py-1 !text-xs" onClick={() => { void clear(); toast('History cleared.'); }} type="button">
            <Eraser className="h-3 w-3" aria-hidden />
            Clear all
          </button>
        ) : undefined
      }
    >
      <div className="code-scroll h-full overflow-y-auto p-3">
        {entries.length === 0 && (
          <div className="flex h-full items-center justify-center text-xs text-muted">
            No history yet. Operations you run in tools appear here and stay on your device.
          </div>
        )}
        {entries.map((e) => (
          <div key={e.id} className="mb-2 rounded-md border border-edge bg-surface px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-xs font-medium text-ink">{e.toolLabel}</span>
                <span className="shrink-0 text-[10px] text-muted">{formatTime(e.timestamp)}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button className="icon-btn" onClick={() => void toggleFavorite(e.id)} type="button" aria-label="Toggle favorite">
                  <Star className={`h-3.5 w-3.5 ${e.favorite ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                </button>
                <button className="icon-btn" onClick={() => { void openInTool(e.tool, e.inputPreview); toast(`Opened ${e.toolLabel} with the recorded input.`); }} type="button" aria-label="Use in tool">
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
                <button className="icon-btn" onClick={() => copy(e.outputPreview, 'Output copied')} type="button" aria-label="Copy output">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button className="icon-btn" onClick={() => void remove(e.id)} type="button" aria-label="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-1 grid grid-cols-1 gap-2 lg:grid-cols-2">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted">Input</div>
                <code className="mt-0.5 block max-h-20 overflow-hidden whitespace-pre-wrap break-all font-mono text-[11px] leading-snug text-muted">{e.inputPreview}</code>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted">Output</div>
                <code className="mt-0.5 block max-h-20 overflow-hidden whitespace-pre-wrap break-all font-mono text-[11px] leading-snug text-muted">{e.outputPreview}</code>
              </div>
            </div>
            {e.settings && (
              <div className="mt-1 truncate font-mono text-[10px] text-muted" title={e.settings}>
                settings: {e.settings}
              </div>
            )}
          </div>
        ))}
      </div>
    </ToolPage>
  );
}
