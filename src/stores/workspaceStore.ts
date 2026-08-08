import { create } from 'zustand';
import { db, type SnippetRecord, type ProjectRecord, type ProjectItemRecord } from '../services/storage/db';

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

interface WorkspaceState {
  snippets: SnippetRecord[];
  projects: ProjectRecord[];
  projectItems: ProjectItemRecord[];
  loaded: boolean;
  load: () => Promise<void>;
  saveSnippet: (data: Omit<SnippetRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
  toggleSnippetFavorite: (id: string) => Promise<void>;
  toggleSnippetFavoriteByRef: (record: SnippetRecord) => Promise<void>;
  createProject: (name: string, description: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  saveProjectItem: (
    data: Omit<ProjectItemRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ) => Promise<void>;
  deleteProjectItem: (id: string) => Promise<void>;
  clearProjects: () => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  snippets: [],
  projects: [],
  projectItems: [],
  loaded: false,
  load: async () => {
    const [snippets, projects, projectItems] = await Promise.all([
      db.snippets.orderBy('updatedAt').reverse().toArray(),
      db.projects.orderBy('updatedAt').reverse().toArray(),
      db.projectItems.toArray(),
    ]);
    set({ snippets, projects, projectItems, loaded: true });
  },
  saveSnippet: async (data) => {
    const now = Date.now();
    const record: SnippetRecord = {
      id: data.id ?? makeId(),
      name: data.name,
      content: data.content,
      tags: data.tags,
      favorite: data.favorite,
      createdAt: data.id ? get().snippets.find((s) => s.id === data.id)?.createdAt ?? now : now,
      updatedAt: now,
    };
    await db.snippets.put(record);
    const snippets = await db.snippets.orderBy('updatedAt').reverse().toArray();
    set({ snippets });
  },
  deleteSnippet: async (id) => {
    await db.snippets.delete(id);
    set({ snippets: get().snippets.filter((s) => s.id !== id) });
  },
  toggleSnippetFavorite: async (id) => {
    const snippet = get().snippets.find((s) => s.id === id);
    if (!snippet) return;
    await db.snippets.update(id, { favorite: !snippet.favorite, updatedAt: Date.now() });
    set({
      snippets: get().snippets.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s)),
    });
  },
  toggleSnippetFavoriteByRef: async (record) => {
    await get().toggleSnippetFavorite(record.id);
  },
  createProject: async (name, description) => {
    const now = Date.now();
    const project: ProjectRecord = { id: makeId(), name, description, createdAt: now, updatedAt: now };
    await db.projects.put(project);
    set({ projects: [project, ...get().projects] });
  },
  deleteProject: async (id) => {
    await db.projects.delete(id);
    await db.projectItems.where('projectId').equals(id).delete();
    set({
      projects: get().projects.filter((p) => p.id !== id),
      projectItems: get().projectItems.filter((i) => i.projectId !== id),
    });
  },
  saveProjectItem: async (data) => {
    const now = Date.now();
    const record: ProjectItemRecord = {
      id: data.id ?? makeId(),
      projectId: data.projectId,
      kind: data.kind,
      name: data.name,
      content: data.content,
      createdAt: data.id ? get().projectItems.find((i) => i.id === data.id)?.createdAt ?? now : now,
      updatedAt: now,
    };
    await db.projectItems.put(record);
    await db.projects.update(data.projectId, { updatedAt: now });
    const [projectItems, projects] = await Promise.all([
      db.projectItems.toArray(),
      db.projects.orderBy('updatedAt').reverse().toArray(),
    ]);
    set({ projectItems, projects });
  },
  deleteProjectItem: async (id) => {
    await db.projectItems.delete(id);
    set({ projectItems: get().projectItems.filter((i) => i.id !== id) });
  },
  clearProjects: async () => {
    await db.projects.clear();
    await db.projectItems.clear();
    set({ projects: [], projectItems: [] });
  },
}));
