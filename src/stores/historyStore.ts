import { create } from 'zustand';
import { db, type HistoryRecord } from '../services/storage/db';

export interface OperationEntry {
  id: string;
  tool: string;
  toolLabel: string;
  timestamp: number;
  inputPreview: string;
  outputPreview: string;
  settings: string;
  favorite: boolean;
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36);
}

function preview(text: string, max = 300): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

interface HistoryState {
  entries: OperationEntry[];
  loaded: boolean;
  enabled: boolean;
  load: () => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
  add: (entry: {
    tool: string;
    toolLabel: string;
    input: string;
    output: string;
    settings: string;
  }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],
  loaded: false,
  enabled: true,
  load: async () => {
    const entries = await db.history.orderBy('timestamp').reverse().limit(500).toArray();
    set({ entries: entries as OperationEntry[], loaded: true });
  },
  setEnabled: async (enabled) => {
    set({ enabled });
    if (!enabled) {
      await db.history.clear();
      set({ entries: [] });
    }
  },
  add: async (entry) => {
    if (!get().enabled) return;
    const record: HistoryRecord = {
      id: makeId(),
      tool: entry.tool,
      toolLabel: entry.toolLabel,
      timestamp: Date.now(),
      inputPreview: preview(entry.input),
      outputPreview: preview(entry.output),
      settings: entry.settings,
      favorite: false,
    };
    await db.history.add(record);
    const entries = await db.history.orderBy('timestamp').reverse().limit(500).toArray();
    set({ entries: entries as OperationEntry[] });
  },
  remove: async (id) => {
    await db.history.delete(id);
    set({ entries: get().entries.filter((e) => e.id !== id) });
  },
  toggleFavorite: async (id) => {
    const entry = get().entries.find((e) => e.id === id);
    if (!entry) return;
    await db.history.update(id, { favorite: !entry.favorite });
    set({ entries: get().entries.map((e) => (e.id === id ? { ...e, favorite: !e.favorite } : e)) });
  },
  clear: async () => {
    await db.history.clear();
    set({ entries: [] });
  },
}));
