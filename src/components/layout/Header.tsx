import { Braces, Keyboard, Moon, Search, Settings, ShieldCheck, Sun, Info } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { modLabel } from '../../hooks/useGlobalShortcuts';

export function Header() {
  const settings = useSettingsStore((s) => s.settings);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const setCommandPalette = useUiStore((s) => s.setCommandPalette);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);
  const setAboutOpen = useUiStore((s) => s.setAboutOpen);

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-edge bg-surface-2 px-3">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-[var(--accent-contrast)]">
          <Braces className="h-3.5 w-3.5" aria-hidden />
        </div>
        <div className="hidden leading-tight sm:block">
          <span className="block text-xs font-bold text-ink">JSON Developer Workbench</span>
          <span className="block text-[9px] uppercase tracking-widest text-muted">
            privacy-first · runs in your browser
          </span>
        </div>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => setCommandPalette(true)}
        className="hidden items-center gap-2 rounded-md border border-edge bg-surface px-2.5 py-1 text-xs text-muted hover:text-ink md:flex"
        aria-label="Open command palette"
      >
        <Search className="h-3.5 w-3.5" aria-hidden />
        <span className="text-muted/80">Search tools & commands…</span>
        <kbd className="rounded border border-edge bg-surface-2 px-1 text-[10px] text-muted">
          {modLabel('Ctrl+Shift+P')}
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setCommandPalette(true)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-3 hover:text-ink md:hidden"
        aria-label="Open command palette"
      >
        <Search className="h-4 w-4" aria-hidden />
      </button>

      <span className="hidden items-center gap-1 rounded-full border border-emerald-600/40 bg-emerald-600/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 lg:flex">
        <ShieldCheck className="h-3 w-3" aria-hidden />
        Local Processing
      </span>

      <button
        type="button"
        onClick={toggleTheme}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-3 hover:text-ink"
        aria-label="Toggle theme"
        title={`Theme: ${settings.theme} — ${modLabel('Ctrl+Shift+L')}`}
      >
        {settings.theme === 'dark' ? (
          <Sun className="h-4 w-4" aria-hidden />
        ) : (
          <Moon className="h-4 w-4" aria-hidden />
        )}
      </button>
      <button
        type="button"
        onClick={() => setShortcutsOpen(true)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-3 hover:text-ink"
        aria-label="Keyboard shortcuts"
      >
        <Keyboard className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-3 hover:text-ink"
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => setAboutOpen(true)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-3 hover:text-ink"
        aria-label="About"
      >
        <Info className="h-4 w-4" aria-hidden />
      </button>
    </header>
  );
}
