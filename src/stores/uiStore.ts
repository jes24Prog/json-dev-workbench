import { create } from 'zustand';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface UiState {
  commandPaletteOpen: boolean;
  settingsOpen: boolean;
  shortcutsOpen: boolean;
  aboutOpen: boolean;
  globalSearchOpen: boolean;
  saveSnippetOpen: boolean;
  toasts: Toast[];
  setCommandPalette: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
  setGlobalSearchOpen: (open: boolean) => void;
  setSaveSnippetOpen: (open: boolean) => void;
  toast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: number) => void;
}

let toastId = 1;

export const useUiStore = create<UiState>((set) => ({
  commandPaletteOpen: false,
  settingsOpen: false,
  shortcutsOpen: false,
  aboutOpen: false,
  globalSearchOpen: false,
  saveSnippetOpen: false,
  toasts: [],
  setCommandPalette: (open) => set({ commandPaletteOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
  setAboutOpen: (open) => set({ aboutOpen: open }),
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
  setSaveSnippetOpen: (open) => set({ saveSnippetOpen: open }),
  toast: (message, type = 'success') => {
    const id = toastId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
