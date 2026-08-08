export type ThemeMode = 'dark' | 'light' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  showMinimap: boolean;
  showLineNumbers: boolean;
  indent: '2' | '4' | 'tab';
  sortKeys: boolean;
  escapeUnicode: boolean;
  saveHistory: boolean;
  saveWorkspace: boolean;
  workerProcessing: boolean;
  virtualizedRendering: boolean;
  confirmDestructive: boolean;
  language: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  fontSize: 13,
  fontFamily: 'JetBrains Mono, ui-monospace, Menlo, Consolas, monospace',
  tabSize: 2,
  wordWrap: false,
  showMinimap: false,
  showLineNumbers: true,
  indent: '2',
  sortKeys: false,
  escapeUnicode: false,
  saveHistory: true,
  saveWorkspace: true,
  workerProcessing: true,
  virtualizedRendering: true,
  confirmDestructive: true,
  language: 'en',
};

const STORAGE_KEY = 'json-workbench.settings.v1';

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage may be unavailable (private mode); settings stay in memory.
  }
}

export function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

export function applyTheme(mode: ThemeMode): 'dark' | 'light' {
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.classList.toggle('light', resolved === 'light');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0f172a' : '#f8fafc');
  return resolved;
}
