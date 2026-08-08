import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Modal } from './Modal';
import { useUiStore } from '../../stores/uiStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useDraftsStore } from '../../stores/draftsStore';
import { useHistoryStore } from '../../stores/historyStore';
import { toolLabelForPath } from '../../hooks/useGlobalShortcuts';

export function SaveSnippetDialog() {
  const open = useUiStore((s) => s.saveSnippetOpen);
  const setOpen = useUiStore((s) => s.setSaveSnippetOpen);
  const toast = useUiStore((s) => s.toast);
  const saveSnippet = useWorkspaceStore((s) => s.saveSnippet);
  const location = useLocation();
  const drafts = useDraftsStore((s) => s.drafts);

  const toolId = location.pathname.match(/^\/tools\/([^/]+)/)?.[1] ?? 'editor';
  const content = drafts[toolId] ?? '';

  const [name, setName] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (open) {
      setName(toolLabelForPath(location.pathname));
      setTags('');
    }
  }, [open, location.pathname]);

  const save = async () => {
    const trimmedName = name.trim() || toolLabelForPath(location.pathname);
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    await saveSnippet({
      name: trimmedName,
      content,
      tags: tagList,
      favorite: false,
    });
    toast(`Snippet "${trimmedName}" saved`, 'success');
    setOpen(false);
    if (useHistoryStore.getState().enabled) {
      void useHistoryStore.getState().add({
        tool: 'snippets',
        toolLabel: 'Snippet saved',
        input: content,
        output: '',
        settings: JSON.stringify({ name: trimmedName, tags: tagList }),
      });
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Save snippet" width="max-w-md">
      <div className="space-y-3">
        <div>
          <label className="label" htmlFor="snippet-name">
            Name
          </label>
          <input
            id="snippet-name"
            className="input mt-1 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pagination response"
          />
        </div>
        <div>
          <label className="label" htmlFor="snippet-tags">
            Tags (comma separated)
          </label>
          <input
            id="snippet-tags"
            className="input mt-1 w-full"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="api, response"
          />
        </div>
        <p className="rounded bg-surface-3 px-2 py-1.5 text-[11px] text-muted">
          Saving <code className="font-mono">{content.length}</code> characters from{' '}
          <strong className="text-ink">{toolLabelForPath(location.pathname)}</strong>. Stored
          locally in your browser (IndexedDB).
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={!content}>
            Save snippet
          </button>
        </div>
      </div>
    </Modal>
  );
}
