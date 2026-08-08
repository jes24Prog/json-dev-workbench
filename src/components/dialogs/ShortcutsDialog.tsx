import { Modal } from './Modal';
import { useUiStore } from '../../stores/uiStore';
import { modLabel } from '../../hooks/useGlobalShortcuts';

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: 'Ctrl+Enter', label: 'Execute current operation' },
  { keys: 'Ctrl+Shift+P', label: 'Open command palette' },
  { keys: 'Ctrl+Shift+F', label: 'Go to Formatter' },
  { keys: 'Ctrl+Shift+M', label: 'Go to Minifier' },
  { keys: 'Ctrl+Shift+V', label: 'Go to Validator' },
  { keys: 'Ctrl+Shift+D', label: 'Go to Diff' },
  { keys: 'Ctrl+Shift+L', label: 'Toggle theme' },
  { keys: 'Ctrl+K', label: 'Clear current editor' },
  { keys: 'Ctrl+S', label: 'Save current input as snippet' },
  { keys: 'Ctrl+O', label: 'Open file (current tool)' },
  { keys: 'Ctrl+G', label: 'Global search' },
  { keys: 'Ctrl+,', label: 'Open settings' },
];

export function ShortcutsDialog() {
  const open = useUiStore((s) => s.shortcutsOpen);
  const setOpen = useUiStore((s) => s.setShortcutsOpen);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Keyboard shortcuts" width="max-w-md">
      <ul className="divide-y divide-edge">
        {SHORTCUTS.map((s) => (
          <li key={s.keys} className="flex items-center justify-between py-2">
            <span className="text-xs text-ink">{s.label}</span>
            <kbd className="rounded border border-edge bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted">
              {modLabel(s.keys)}
            </kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
