import { useEffect, useState } from 'react';
import { Save, Trash2, Star, Copy, ExternalLink, Plus, Pencil } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { OptionsBar, TextInput, Field } from '../../components/common/controls';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useCopy } from '../../hooks/useClipboard';
import { useOpenInTool } from '../../hooks/useOpenInTool';
import { useUiStore } from '../../stores/uiStore';
import type { SnippetRecord } from '../../services/storage/db';

export function SnippetsPage() {
  const snippets = useWorkspaceStore((s) => s.snippets);
  const loaded = useWorkspaceStore((s) => s.loaded);
  const load = useWorkspaceStore((s) => s.load);
  const saveSnippet = useWorkspaceStore((s) => s.saveSnippet);
  const deleteSnippet = useWorkspaceStore((s) => s.deleteSnippet);
  const toggleFavorite = useWorkspaceStore((s) => s.toggleSnippetFavorite);
  const toast = useUiStore((s) => s.toast);
  const { copy } = useCopy();
  const openInTool = useOpenInTool();

  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<SnippetRecord | null>(null);
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  const filtered = snippets.filter((s) => {
    const q = filter.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q)) ||
      s.content.toLowerCase().includes(q)
    );
  });

  const submit = () => {
    if (!name.trim()) {
      toast('Enter a name for the snippet.', 'error');
      return;
    }
    void saveSnippet({
      id: editing?.id,
      name: name.trim(),
      content,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      favorite: editing?.favorite ?? false,
    });
    setEditing(null);
    setShowNew(false);
    setName('');
    setTags('');
    setContent('');
    toast(editing ? 'Snippet updated.' : 'Snippet saved.');
  };

  const startEdit = (s: SnippetRecord) => {
    setEditing(s);
    setName(s.name);
    setTags(s.tags.join(', '));
    setContent(s.content);
    setShowNew(true);
  };

  return (
    <ToolPage
      title="Snippets"
      description="Reusable JSON snippets with tags"
      icon={Save}
      actions={
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={() => { setShowNew(true); setEditing(null); setName(''); setTags(''); setContent(''); }} type="button">
          <Plus className="h-3 w-3" aria-hidden />
          New snippet
        </button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <OptionsBar>
          <Field label="Search">
            <TextInput value={filter} onChange={setFilter} placeholder="name, tag or content…" className="w-72" />
          </Field>
          <span className="text-[11px] text-muted">{snippets.length} snippet{snippets.length === 1 ? '' : 's'}</span>
        </OptionsBar>

        {showNew && (
          <div className="border-b border-edge bg-surface px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <TextInput value={name} onChange={setName} placeholder="Snippet name" className="w-64" />
              <TextInput value={tags} onChange={setTags} placeholder="tags, comma separated" className="w-64" />
            </div>
            <textarea
              className="mb-2 block w-full resize-y rounded-md border border-edge bg-surface-2 p-2 font-mono text-xs text-ink outline-none focus:border-accent"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder='{"hello": "world"}'
              spellCheck={false}
            />
            <div className="flex gap-2">
              <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={submit} type="button">
                <Save className="h-3 w-3" aria-hidden />
                {editing ? 'Update' : 'Save'}
              </button>
              <button className="btn !px-3 !py-1 !text-xs" onClick={() => { setShowNew(false); setEditing(null); }} type="button">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="code-scroll min-h-0 flex-1 overflow-y-auto p-3">
          {filtered.length === 0 && (
            <div className="flex h-full items-center justify-center text-xs text-muted">
              {snippets.length === 0 ? 'No snippets yet. Save reusable JSON with the New snippet button.' : 'No snippets match your search.'}
            </div>
          )}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((s) => (
              <div key={s.id} className="flex flex-col rounded-md border border-edge bg-surface px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-xs font-medium text-ink" title={s.name}>{s.name}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button className="icon-btn" onClick={() => void toggleFavorite(s.id)} type="button" aria-label="Toggle favorite">
                      <Star className={`h-3.5 w-3.5 ${s.favorite ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                    </button>
                    <button className="icon-btn" onClick={() => startEdit(s)} type="button" aria-label="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button className="icon-btn" onClick={() => void deleteSnippet(s.id)} type="button" aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-1 min-w-0">
                  <code className="block max-h-24 overflow-hidden whitespace-pre-wrap break-all font-mono text-[11px] leading-snug text-muted">{s.content}</code>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap gap-1">
                    {s.tags.map((t) => (
                      <span key={t} className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] text-muted">{t}</span>
                    ))}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button className="toolbar-btn" onClick={() => copy(s.content, 'Snippet copied')} type="button">
                      <Copy className="h-3 w-3" aria-hidden />
                      Copy
                    </button>
                    <button className="toolbar-btn" onClick={() => { openInTool('editor', s.content); toast(`Opened "${s.name}" in the editor.`); }} type="button">
                      <ExternalLink className="h-3 w-3" aria-hidden />
                      Open
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
