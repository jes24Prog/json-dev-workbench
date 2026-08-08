import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { JsonValue } from '../../types/json';
import { toJsonPointer, toJsonPathString, toBracketPath } from '../../core/json/path';
import { previewValue, deleteAt, setAt, renameAt, duplicateAt, addChildAt, moveNode } from '../../core/tree';

export interface TreeViewerProps {
  value: JsonValue;
  searchQuery?: string;
  onChange?: (next: JsonValue) => void;
  onSelect?: (path: string[]) => void;
}

interface TreeCtx {
  value: JsonValue;
  editable: boolean;
  expanded: Set<string>;
  toggle: (path: string[]) => void;
  expandAll: () => void;
  collapseAll: () => void;
  searchQuery: string;
  onSelect?: (path: string[]) => void;
  onChange?: (next: JsonValue) => void;
}

const Ctx = createContext<TreeCtx | null>(null);

function useTree(): TreeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('TreeViewer context missing');
  return ctx;
}

export function TreeViewer({ value, searchQuery = '', onChange, onSelect }: TreeViewerProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['']));
  const editable = onChange !== undefined;

  const toggle = (path: string[]) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      const key = toJsonPointer(path);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    const all: string[] = [];
    collectPaths(value, [], all);
    setExpanded(new Set(all));
  };
  const collapseAll = () => setExpanded(new Set());

  const totalNodes = useMemo(() => countNodes(value), [value]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-edge px-2 py-1">
        <span className="text-[11px] text-muted">
          {totalNodes.toLocaleString()} node{totalNodes === 1 ? '' : 's'}
          {searchQuery ? ' · search active' : ''}
        </span>
        <div className="flex items-center gap-1">
          <button type="button" className="icon-btn" title="Expand all" onClick={expandAll}>
            <IconExpandAll />
          </button>
          <button type="button" className="icon-btn" title="Collapse all" onClick={collapseAll}>
            <IconCollapseAll />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-1">
        <Ctx.Provider value={{ value, editable, expanded, toggle, expandAll, collapseAll, searchQuery, onSelect, onChange }}>
          <Row path={[]} node={value} keyName={null} depth={0} />
        </Ctx.Provider>
      </div>
    </div>
  );
}

function Row({ path, node, keyName, depth }: { path: string[]; node: JsonValue; keyName: string | null; depth: number }) {
  const { value: root, expanded, toggle, searchQuery, onSelect, editable, onChange } = useTree();
  const isArray = Array.isArray(node);
  const isObject = typeof node === 'object' && node !== null;
  const hasChildren = isArray || isObject;
  const pathKey = toJsonPointer(path);
  const isExpanded = expanded.has(pathKey) || searchQuery !== '';
  const [editing, setEditing] = useState<'key' | 'value' | null>(null);
  const [draft, setDraft] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = (res: { ok: boolean; value?: JsonValue; error?: string }) => {
    if (res.ok && res.value !== undefined && editable) {
      onChange?.(res.value);
      setError(null);
    } else {
      setError(res.error ?? 'Operation failed');
    }
  };
  const startEdit = (mode: 'key' | 'value') => {
    if (!editable) return;
    setEditing(mode);
    setError(null);
    setDraft(mode === 'key' ? (keyName ?? '') : typeof node === 'string' ? node : JSON.stringify(node, null, 2));
  };

  const commitEdit = () => {
    if (!editing) return;
    if (editing === 'key' && keyName !== null) {
      const res = renameAt(root, path, draft);
      if (res.ok) apply(res);
      else setError(res.error ?? 'Rename failed');
    } else if (editing === 'value') {
      try {
        const parsed = draft.trim() === '' ? null : (JSON.parse(draft) as JsonValue);
        const res = setAt(root, path, parsed);
        if (res.ok) apply(res);
        else setError(res.error ?? 'Edit failed');
      } catch {
        setError('Invalid JSON value');
      }
    }
    setEditing(null);
  };

  const handleDelete = () => {
    if (path.length === 0) return;
    const res = deleteAt(root, path);
    apply(res);
  };

  const handleDuplicate = () => {
    if (path.length === 0) return;
    const res = duplicateAt(root, path);
    apply(res);
  };

  const handleAddChild = () => {
    if (Array.isArray(node)) {
      const res = addChildAt(root, path, '', null, true);
      apply(res);
      if (res.ok) {
        const arr = getNodeAt(res.value ?? root, path);
        const idx = Array.isArray(arr) ? arr.length - 1 : 0;
        toggle([...path, String(idx)]);
      }
    } else if (isObject) {
      const res = addChildAt(root, path, 'property', null, false);
      apply(res);
      if (res.ok) toggle([...path, 'property']);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const from = e.dataTransfer.getData('text/json-path');
    if (!from || from === pathKey) return;
    const fromPath = parsePointer(from);
    const res = moveNode(root, fromPath, path);
    apply(res);
  };

  const isMatchSelf = searchQuery !== '' && matchSelf(node, searchQuery);
  const labelColor = colorFor(node);

  return (
    <div
      className={dragOver ? 'rounded outline-2 outline outline-blue-500' : ''}
      draggable={editable && path.length > 0}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/json-path', pathKey);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        if (!editable || path.length === 0) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onDoubleClick={() => onSelect?.(path)}
    >
      <div className="group flex items-center gap-0.5 rounded px-1 py-[1px] hover:bg-surface-3" style={{ paddingLeft: depth * 14 }}>
        <button
          type="button"
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted hover:bg-surface-3 disabled:opacity-0"
          onClick={() => toggle(path)}
          disabled={!hasChildren}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <span className="text-[9px] leading-none">{isExpanded ? '▾' : '▸'}</span>
        </button>
        {keyName !== null && (
          <>
            <span
              className={`shrink-0 cursor-default font-mono text-xs ${isMatchSelf ? 'bg-amber-200 dark:bg-amber-900/50' : ''}`}
              onDoubleClick={() => startEdit('key')}
              title={editable ? 'Double-click to rename' : undefined}
            >
              {editing === 'key' ? (
                <input
                  autoFocus
                  className="w-32 rounded border border-blue-500 bg-surface px-1 font-mono text-xs text-ink"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') setEditing(null);
                  }}
                />
              ) : (
                <span className="text-ink">"{keyName}"</span>
              )}
            </span>
            <span className="text-muted">:</span>
          </>
        )}
        {editing === 'value' ? (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <input
              autoFocus
              className="min-w-0 flex-1 rounded border border-blue-500 bg-surface px-1 font-mono text-xs text-ink"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') setEditing(null);
              }}
            />
          </div>
        ) : !hasChildren ? (
          <span
            className={`min-w-0 flex-1 cursor-default truncate font-mono text-xs ${labelColor}`}
            onDoubleClick={() => startEdit('value')}
            title={editable ? 'Double-click to edit' : undefined}
          >
            {previewValue(node)}
          </span>
        ) : (
          <span className={`min-w-0 flex-1 truncate font-mono text-xs ${labelColor}`}>{previewValue(node)}</span>
        )}
        {error && <span className="shrink-0 text-[10px] text-red-500">{error}</span>}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {path.length > 0 && (
            <>
              <IconButton title="Copy value" onClick={() => void copyText(typeof node === 'string' ? node : JSON.stringify(node, null, 2))}>
                <IconCopy />
              </IconButton>
              <IconButton title="Copy JSON Pointer" onClick={() => void copyText(pathKey)}>
                <IconPointer />
              </IconButton>
              <IconButton title="Copy bracket path" onClick={() => void copyText(toBracketPath(path))}>
                <IconBracket />
              </IconButton>
              <IconButton title="Copy JSONPath" onClick={() => void copyText(toJsonPathString(path))}>
                <IconPath />
              </IconButton>
            </>
          )}
          {editable && (
            <>
              {path.length > 0 && (
                <IconButton title="Edit value" onClick={() => startEdit('value')}>
                  <IconEdit />
                </IconButton>
              )}
              {hasChildren && (
                <IconButton title={isArray ? 'Add array item' : 'Add property'} onClick={handleAddChild}>
                  <IconAdd />
                </IconButton>
              )}
              {path.length > 0 && (
                <>
                  <IconButton title="Duplicate" onClick={handleDuplicate}>
                    <IconDuplicate />
                  </IconButton>
                  <IconButton title="Delete" className="text-red-500" onClick={handleDelete}>
                    <IconTrash />
                  </IconButton>
                </>
              )}
            </>
          )}
        </div>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {entriesOf(node).map(([k, v]) => (
            <Row key={`${pathKey}/${k}`} path={[...path, k]} node={v} keyName={k} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function entriesOf(node: JsonValue): [string, JsonValue][] {
  if (Array.isArray(node)) {
    return node.map((v, i) => [String(i), v] as [string, JsonValue]);
  }
  return Object.entries(node as Record<string, JsonValue>);
}

function getNodeAt(root: JsonValue, path: string[]): JsonValue | undefined {
  let node: JsonValue = root;
  for (const seg of path) {
    if (node === null || typeof node !== 'object') return undefined;
    if (Array.isArray(node)) {
      const idx = Number(seg);
      if (!Number.isInteger(idx) || idx < 0 || idx >= node.length) return undefined;
      node = node[idx];
    } else {
      const obj = node as Record<string, JsonValue>;
      if (!(seg in obj)) return undefined;
      node = obj[seg];
    }
  }
  return node;
}

function parsePointer(pointer: string): string[] {
  if (!pointer || pointer === '') return [];
  return pointer
    .split('/')
    .slice(1)
    .map((seg) => decodeURIComponent(seg.replace(/~1/g, '/').replace(/~0/g, '~')));
}

function matchSelf(node: JsonValue, query: string): boolean {
  const q = query.toLowerCase();
  if (typeof node === 'string') return node.toLowerCase().includes(q);
  if (typeof node === 'number' || typeof node === 'boolean') return String(node).toLowerCase().includes(q);
  return false;
}

function colorFor(node: JsonValue): string {
  if (node === null) return 'text-fuchsia-500';
  if (typeof node === 'string') return 'text-emerald-600 dark:text-emerald-400';
  if (typeof node === 'number') return 'text-sky-600 dark:text-sky-400';
  if (typeof node === 'boolean') return 'text-amber-600 dark:text-amber-400';
  return 'text-muted';
}

function collectPaths(node: JsonValue, path: string[], out: string[]) {
  out.push(toJsonPointer(path));
  if (Array.isArray(node)) {
    node.forEach((v, i) => collectPaths(v, [...path, String(i)], out));
  } else if (typeof node === 'object' && node !== null) {
    Object.entries(node as Record<string, JsonValue>).forEach(([k, v]) => collectPaths(v, [...path, k], out));
  }
}

function countNodes(node: JsonValue): number {
  if (Array.isArray(node)) return 1 + node.reduce<number>((sum, v) => sum + countNodes(v), 0);
  if (typeof node === 'object' && node !== null) {
    return 1 + Object.values(node as Record<string, JsonValue>).reduce<number>((sum, v) => sum + countNodes(v), 0);
  }
  return 1;
}

function IconButton({ children, title, onClick, className = '' }: { children: ReactNode; title: string; onClick: () => void; className?: string }) {
  return (
    <button type="button" className={`icon-btn ${className}`} title={title} onClick={onClick}>
      {children}
    </button>
  );
}

async function copyText(t: string) {
  try {
    await navigator.clipboard?.writeText(t);
  } catch {
    /* clipboard unavailable */
  }
}

function IconBase({ d, className = 'h-3.5 w-3.5' }: { d: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const IconCopy = () => <IconBase d="M8 8h12v12H8z M20 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2" />;
const IconPointer = () => <IconBase d="M3 3l7.5 17 2.5-6.5L20 11z" />;
const IconBracket = () => <IconBase d="M8 4H6a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h2 M16 4h2a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-2" />;
const IconPath = () => <IconBase d="M4 20V10m0 0L8 6l4 4M4 10h10M14 10v10m0-10 4-4 4 4M14 20h4M18 16v4" />;
const IconEdit = () => <IconBase d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />;
const IconAdd = () => <IconBase d="M12 5v14M5 12h14" />;
const IconDuplicate = () => <IconBase d="M9 9h11v11H9z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />;
const IconTrash = () => <IconBase d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />;
const IconExpandAll = () => <IconBase d="M8 3H3v5M21 8V3h-5M3 16v5h5M16 21h5v-5 M12 8v8M8 12h8" />;
const IconCollapseAll = () => <IconBase d="M8 3H3v5M21 8V3h-5M3 16v5h5M16 21h5v-5 M8 12h8" />;
