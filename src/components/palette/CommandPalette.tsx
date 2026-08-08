import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { COMMANDS, type CommandDefinition } from '../../constants/tools';
import { useUiStore } from '../../stores/uiStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useHistoryStore } from '../../stores/historyStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { modLabel } from '../../hooks/useGlobalShortcuts';

interface PaletteItem {
  id: string;
  label: string;
  subtitle?: string;
  category: string;
  icon: LucideIcon;
  shortcut?: string;
  onSelect: () => void;
}

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPalette);
  const navigate = useNavigate();
  const snippets = useWorkspaceStore((s) => s.snippets);
  const history = useHistoryStore((s) => s.entries);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const ui = useUiStore();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const navigateItem = (cmd: CommandDefinition): PaletteItem => ({
      id: cmd.id,
      label: cmd.label,
      category: cmd.category,
      icon: cmd.icon,
      shortcut: cmd.shortcut,
      onSelect: () => {
        setOpen(false);
        navigate(`/tools/${cmd.target}`);
      },
    });
    const actionItem = (cmd: CommandDefinition): PaletteItem => {
      let onSelect = () => setOpen(false);
      switch (cmd.action) {
        case 'toggle-theme':
          onSelect = () => {
            setOpen(false);
            toggleTheme();
          };
          break;
        case 'open-settings':
          onSelect = () => {
            setOpen(false);
            ui.setSettingsOpen(true);
          };
          break;
        case 'open-shortcuts':
          onSelect = () => {
            setOpen(false);
            ui.setShortcutsOpen(true);
          };
          break;
        case 'open-about':
          onSelect = () => {
            setOpen(false);
            ui.setAboutOpen(true);
          };
          break;
        case 'save':
          onSelect = () => {
            setOpen(false);
            ui.setSaveSnippetOpen(true);
          };
          break;
        case 'clear-editor':
          onSelect = () => {
            setOpen(false);
            navigate('/tools/editor');
          };
          break;
      }
      return {
        id: cmd.id,
        label: cmd.label,
        category: cmd.category,
        icon: cmd.icon,
        shortcut: cmd.shortcut,
        onSelect,
      };
    };

    const commandItems = COMMANDS.map((cmd) =>
      cmd.action === 'navigate' ? navigateItem(cmd) : actionItem(cmd),
    );
    const snippetItems: PaletteItem[] = snippets.map((s) => ({
      id: 'snippet-' + s.id,
      label: s.name,
      subtitle: (s.tags.length > 0 ? s.tags.join(', ') : 'Snippet') + ` · ${s.content.length} chars`,
      category: 'Snippets',
      icon: Search,
      onSelect: () => {
        setOpen(false);
        navigate('/workspace/snippets');
      },
    }));
    const historyItems: PaletteItem[] = history.slice(0, 30).map((h) => ({
      id: 'history-' + h.id,
      label: h.toolLabel,
      subtitle: new Date(h.timestamp).toLocaleString(),
      category: 'History',
      icon: Search,
      onSelect: () => {
        setOpen(false);
        navigate('/workspace/history');
      },
    }));

    return [...commandItems, ...snippetItems, ...historyItems];
  }, [navigate, snippets, history, toggleTheme, ui, setOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 40);
    const terms = q.split(/\s+/);
    return items
      .filter((item) => {
        const haystack = `${item.label} ${item.subtitle ?? ''} ${item.category}`.toLowerCase();
        return terms.every((t) => haystack.includes(t));
      })
      .slice(0, 40);
  }, [items, query]);

  useEffect(() => {
    setIndex(0);
  }, [filtered]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 pt-[12vh] p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-lg border border-edge bg-surface-2 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2 border-b border-edge px-3 py-2">
          <Search className="h-4 w-4 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                filtered[index]?.onSelect();
              } else if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
            placeholder="Search tools, commands, snippets, history…"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
            aria-label="Search commands and tools"
          />
          <kbd className="rounded border border-edge px-1 text-[10px] text-muted">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-muted">No results for “{query}”</li>
          )}
          {filtered.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseEnter={() => setIndex(i)}
                onClick={() => item.onSelect()}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs ${
                  i === index ? 'bg-accent/10 text-ink' : 'text-muted hover:bg-surface-3'
                }`}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.subtitle && (
                  <span className="max-w-[45%] truncate text-[10px] text-muted/70">{item.subtitle}</span>
                )}
                {item.shortcut && (
                  <kbd className="shrink-0 rounded border border-edge px-1 text-[10px] text-muted">
                    {modLabel(item.shortcut)}
                  </kbd>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-edge px-3 py-1.5 text-[10px] text-muted">
          ↑↓ navigate · Enter run · Esc close
        </div>
      </div>
    </div>
  );
}
