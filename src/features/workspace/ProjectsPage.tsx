import { useEffect, useState } from 'react';
import { LayoutGrid, Plus, Trash2, ExternalLink, Copy, FolderOpen } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { TextInput } from '../../components/common/controls';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUiStore } from '../../stores/uiStore';
import { useCopy } from '../../hooks/useClipboard';
import { useOpenInTool } from '../../hooks/useOpenInTool';
import type { ProjectItemKind } from '../../services/storage/db';

const KIND_LABELS: Record<ProjectItemKind, string> = {
  document: 'Document',
  schema: 'Schema',
  query: 'Query',
  mock: 'Mock',
  transformation: 'Transformation',
  response: 'Response',
};

export function ProjectsPage() {
  const projects = useWorkspaceStore((s) => s.projects);
  const projectItems = useWorkspaceStore((s) => s.projectItems);
  const loaded = useWorkspaceStore((s) => s.loaded);
  const load = useWorkspaceStore((s) => s.load);
  const createProject = useWorkspaceStore((s) => s.createProject);
  const deleteProject = useWorkspaceStore((s) => s.deleteProject);
  const saveProjectItem = useWorkspaceStore((s) => s.saveProjectItem);
  const deleteProjectItem = useWorkspaceStore((s) => s.deleteProjectItem);
  const toast = useUiStore((s) => s.toast);
  const { copy } = useCopy();
  const openInTool = useOpenInTool();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<{ projectId: string; name: string; kind: ProjectItemKind; content: string } | null>(null);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  const create = () => {
    if (!name.trim()) {
      toast('Enter a project name.', 'error');
      return;
    }
    void createProject(name.trim(), description.trim());
    setName('');
    setDescription('');
    setShowNew(false);
    toast('Project created.');
  };

  const addItem = () => {
    if (!itemForm) return;
    if (!itemForm.name.trim()) {
      toast('Enter an item name.', 'error');
      return;
    }
    void saveProjectItem({
      projectId: itemForm.projectId,
      kind: itemForm.kind,
      name: itemForm.name.trim(),
      content: itemForm.content,
    });
    setItemForm(null);
    toast('Item added to project.');
  };

  const itemToTool = (kind: ProjectItemKind): string => {
    switch (kind) {
      case 'schema':
        return 'schema-validator';
      case 'query':
        return 'jsonpath';
      case 'mock':
        return 'schema-mock';
      case 'response':
        return 'api-response';
      case 'transformation':
        return 'transform';
      case 'document':
      default:
        return 'editor';
    }
  };

  return (
    <ToolPage
      title="Projects"
      description="Organize documents, schemas and queries"
      icon={LayoutGrid}
      actions={
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={() => setShowNew(true)} type="button">
          <Plus className="h-3 w-3" aria-hidden />
          New project
        </button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        {showNew && (
          <div className="border-b border-edge bg-surface px-4 py-3">
            <div className="mb-2 flex flex-wrap gap-2">
              <TextInput value={name} onChange={setName} placeholder="Project name" className="w-64" />
              <TextInput value={description} onChange={setDescription} placeholder="Description (optional)" className="w-80" />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={create} type="button">
                <Plus className="h-3 w-3" aria-hidden />
                Create
              </button>
              <button className="btn !px-3 !py-1 !text-xs" onClick={() => setShowNew(false)} type="button">
                Cancel
              </button>
            </div>
          </div>
        )}
        <div className="code-scroll min-h-0 flex-1 overflow-y-auto p-3">
          {projects.length === 0 && (
            <div className="flex h-full items-center justify-center text-xs text-muted">
              No projects yet. Group related JSON documents, schemas and queries into projects.
            </div>
          )}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => {
              const items = projectItems.filter((i) => i.projectId === p.id);
              const isOpen = expanded === p.id;
              return (
                <div key={p.id} className="rounded-md border border-edge bg-surface px-3 py-2">
                  <button className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setExpanded(isOpen ? null : p.id)} type="button">
                    <span className="min-w-0 truncate text-xs font-medium text-ink">{p.name}</span>
                    <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted">
                      <FolderOpen className="h-3 w-3" />
                      {items.length}
                    </span>
                  </button>
                  {p.description && <div className="mt-0.5 text-[11px] text-muted">{p.description}</div>}
                  <div className="mt-1 text-[10px] text-muted">{new Date(p.updatedAt).toLocaleDateString()}</div>
                  {isOpen && (
                    <div className="mt-2 border-t border-edge pt-2">
                      <button
                        className="mb-2 flex items-center gap-1 text-[11px] text-primary hover:underline"
                        onClick={() => setItemForm({ projectId: p.id, name: '', kind: 'document', content: '' })}
                        type="button"
                      >
                        <Plus className="h-3 w-3" aria-hidden />
                        Add item
                      </button>
                      {itemForm?.projectId === p.id && (
                        <div className="mb-2 space-y-1.5">
                          <TextInput value={itemForm.name} onChange={(v) => setItemForm({ ...itemForm, name: v })} placeholder="Item name" className="w-full" />
                          <select
                            className="input w-full py-1 text-xs"
                            value={itemForm.kind}
                            onChange={(e) => setItemForm({ ...itemForm, kind: e.target.value as ProjectItemKind })}
                          >
                            {(Object.keys(KIND_LABELS) as ProjectItemKind[]).map((k) => (
                              <option key={k} value={k}>{KIND_LABELS[k]}</option>
                            ))}
                          </select>
                          <textarea
                            className="block w-full resize-y rounded-md border border-edge bg-surface-2 p-2 font-mono text-xs text-ink outline-none focus:border-accent"
                            rows={3}
                            value={itemForm.content}
                            onChange={(e) => setItemForm({ ...itemForm, content: e.target.value })}
                            spellCheck={false}
                          />
                          <div className="flex gap-2">
                            <button className="btn btn-primary !px-2 !py-0.5 !text-[11px]" onClick={addItem} type="button">Save</button>
                            <button className="btn !px-2 !py-0.5 !text-[11px]" onClick={() => setItemForm(null)} type="button">Cancel</button>
                          </div>
                        </div>
                      )}
                      {items.map((item) => (
                        <div key={item.id} className="mb-1 flex items-center justify-between gap-2 rounded bg-surface-2 px-2 py-1">
                          <div className="min-w-0">
                            <div className="truncate text-[11px] text-ink">{item.name}</div>
                            <div className="text-[10px] text-muted">{KIND_LABELS[item.kind]}</div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button className="icon-btn" onClick={() => copy(item.content, 'Item content copied')} type="button" aria-label="Copy">
                              <Copy className="h-3 w-3" />
                            </button>
                            <button className="icon-btn" onClick={() => { void openInTool(itemToTool(item.kind), item.content); toast(`Opened "${item.name}".`); }} type="button" aria-label="Open">
                              <ExternalLink className="h-3 w-3" />
                            </button>
                            <button className="icon-btn" onClick={() => void deleteProjectItem(item.id)} type="button" aria-label="Delete item">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {items.length === 0 && <div className="text-[10px] text-muted">No items yet.</div>}
                      <button
                        className="mt-2 flex items-center gap-1 text-[10px] text-error hover:underline"
                        onClick={() => { void deleteProject(p.id); toast('Project deleted.'); }}
                        type="button"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden />
                        Delete project
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
