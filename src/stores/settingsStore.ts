import { create } from 'zustand';
import {
  type AppSettings,
  DEFAULT_SETTINGS,
  applyTheme,
  loadSettings,
  saveSettings,
} from '../services/storage/settings';

interface SettingsState {
  settings: AppSettings;
  resolvedTheme: 'dark' | 'light';
  update: (patch: Partial<AppSettings>) => void;
  toggleTheme: () => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadSettings(),
  resolvedTheme: applyTheme(loadSettings().theme),
  update: (patch) => {
    const next = { ...get().settings, ...patch };
    saveSettings(next);
    set({
      settings: next,
      resolvedTheme: applyTheme(next.theme),
    });
  },
  toggleTheme: () => {
    const { settings } = get();
    const nextTheme: AppSettings['theme'] =
      settings.theme === 'dark' ? 'light' : settings.theme === 'light' ? 'dark' : 'dark';
    const next = { ...settings, theme: nextTheme };
    saveSettings(next);
    set({ settings: next, resolvedTheme: applyTheme(nextTheme) });
  },
  reset: () => {
    saveSettings(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS, resolvedTheme: applyTheme(DEFAULT_SETTINGS.theme) });
  },
}));

export function useTheme(): 'dark' | 'light' {
  return useSettingsStore((s) => s.resolvedTheme);
}
