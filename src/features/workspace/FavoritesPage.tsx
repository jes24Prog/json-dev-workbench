import { useEffect } from 'react';
import { Star, Copy, ExternalLink, Trash2, Save } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { useHistoryStore } from '../../stores/historyStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useCopy } from '../../hooks/useClipboard';
import { useOpenInTool } from '../../hooks/useOpenInTool';
import { useUiStore } from '../../stores/uiStore';

export function FavoritesPage() {
  const historyEntries = useHistoryStore((s) => s.entries);
  const historyLoaded = useHistoryStore((s) => s.loaded);
  const loadHistory = useHistoryStore((s) => s.load);
  const snippets = useWorkspaceStore((s) => s.snippets);
  const snippetsLoaded = useWorkspaceStore((s) => s.loaded);
  const loadWorkspace = useWorkspaceStore((s) => s.load);
  const deleteSnippet = useWorkspaceStore((s) => s.deleteSnippet);
  const toggleSnippetFavorite = useWorkspaceStore((s) => s.toggleSnippetFavorite);
  const removeHistory = useHistoryStore((s) => s.remove);
  const toggleHistoryFavorite = useHistoryStore((s) => s.toggleFavorite);
  const { copy } = useCopy();
  const openInTool = useOpenInTool();
  const toast = useUiStore((s) => s.toast);

  useEffect(() => {
    if (!historyLoaded) void loadHistory();
    if (!snippetsLoaded) void loadWorkspace();
  }, [historyLoaded, snippetsLoaded, loadHistory, loadWorkspace]);

  const favoriteSnippets = snippets.filter((s) => s.favorite);
  const favoriteHistory = historyEntries.filter((e) => e.favorite);

  return (
    <ToolPage title="Favorites" description="Starred snippets and history" icon={Star}>
      <div className="code-scroll h-full overflow-y-auto p-3">
        {favoriteSnippets.length === 0 && favoriteHistory.length === 0 && (
          <div className="flex h-full items-center justify-center text-xs text-muted">
            No favorites yet. Star snippets or history entries to pin them here.
          </div>
        )}

        {favoriteSnippets.length > 0 && (
          <div className="mb-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted">
              <Save className="h-3 w-3" aria-hidden />
              Snippets
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {favoriteSnippets.map((s) => (
                <div key={s.id} className="rounded-md border border-edge bg-surface px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-xs font-medium text-ink">{s.name}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      <button className="icon-btn" onClick={() => void toggleSnippetFavorite(s.id)} type="button" aria-label="Unstar">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      </button>
                      <button className="icon-btn" onClick={() => void deleteSnippet(s.id)} type="button" aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <code className="mt-1 block max-h-20 overflow-hidden whitespace-pre-wrap break-all font-mono text-[11px] leading-snug text-muted">{s.content}</code>
                  <div className="mt-2 flex items-center gap-1">
                    <button className="toolbar-btn" onClick={() => copy(s.content, 'Snippet copied')} type="button">
                      <Copy className="h-3 w-3" aria-hidden /> Copy
                    </button>
                    <button className="toolbar-btn" onClick={() => { openInTool('editor', s.content); toast(`Opened "${s.name}".`); }} type="button">
                      <ExternalLink className="h-3 w-3" aria-hidden /> Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {favoriteHistory.length > 0 && (
          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-wide text-muted">History</div>
            {favoriteHistory.map((e) => (
              <div key={e.id} className="mb-2 rounded-md border border-edge bg-surface px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-ink">{e.toolLabel}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button className="icon-btn" onClick={() => void toggleHistoryFavorite(e.id)} type="button" aria-label="Unstar">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    </button>
                    <button className="icon-btn" onClick={() => { void openInTool(e.tool, e.inputPreview); toast(`Opened ${e.toolLabel}.`); }} type="button" aria-label="Use in tool">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <button className="icon-btn" onClick={() => copy(e.outputPreview, 'Output copied')} type="button" aria-label="Copy">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button className="icon-btn" onClick={() => void removeHistory(e.id)} type="button" aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <code className="mt-1 block max-h-16 overflow-hidden whitespace-pre-wrap break-all font-mono text-[11px] leading-snug text-muted">{e.inputPreview}</code>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolPage>
  );
}
