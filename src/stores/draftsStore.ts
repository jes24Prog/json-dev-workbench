import { create } from 'zustand';
import { db } from '../services/storage/db';

interface DraftsState {
  drafts: Record<string, string>;
  loaded: boolean;
  hasRestorableSession: boolean;
  load: () => Promise<void>;
  setDraft: (tool: string, value: string) => void;
  clearDraft: (tool: string) => Promise<void>;
  discardAll: () => Promise<void>;
}

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useDraftsStore = create<DraftsState>((set, get) => ({
  drafts: {},
  loaded: false,
  hasRestorableSession: false,
  load: async () => {
    const rows = await db.drafts.toArray();
    const drafts: Record<string, string> = {};
    for (const row of rows) {
      if (row.content) drafts[row.tool] = row.content;
    }
    set({ drafts, loaded: true, hasRestorableSession: Object.keys(drafts).length > 0 });
  },
  setDraft: (tool, value) => {
    set({ drafts: { ...get().drafts, [tool]: value } });
    const timer = saveTimers.get(tool);
    if (timer) clearTimeout(timer);
    saveTimers.set(
      tool,
      setTimeout(() => {
        if (!value) {
          void db.drafts.delete(tool);
        } else {
          void db.drafts.put({ id: tool, tool, content: value, updatedAt: Date.now() });
        }
      }, 600),
    );
  },
  clearDraft: async (tool) => {
    set({ drafts: { ...get().drafts, [tool]: '' } });
    await db.drafts.delete(tool);
  },
  discardAll: async () => {
    await db.drafts.clear();
    set({ drafts: {}, hasRestorableSession: false });
  },
}));

export function useDraft(toolId: string): { value: string; setValue: (v: string) => void } {
  const value = useDraftsStore((s) => s.drafts[toolId] ?? '');
  const setValue = (v: string) => useDraftsStore.getState().setDraft(toolId, v);
  return { value, setValue };
}
