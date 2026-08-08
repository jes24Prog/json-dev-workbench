import Dexie, { type EntityTable } from 'dexie';

export interface SnippetRecord {
  id: string;
  name: string;
  content: string;
  tags: string[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface HistoryRecord {
  id: string;
  tool: string;
  toolLabel: string;
  timestamp: number;
  inputPreview: string;
  outputPreview: string;
  settings: string;
  favorite: boolean;
}

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export type ProjectItemKind =
  | 'document'
  | 'schema'
  | 'query'
  | 'mock'
  | 'transformation'
  | 'response';

export interface ProjectItemRecord {
  id: string;
  projectId: string;
  kind: ProjectItemKind;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface DraftRecord {
  id: string;
  tool: string;
  content: string;
  updatedAt: number;
}

class WorkbenchDatabase extends Dexie {
  snippets!: EntityTable<SnippetRecord, 'id'>;
  history!: EntityTable<HistoryRecord, 'id'>;
  projects!: EntityTable<ProjectRecord, 'id'>;
  projectItems!: EntityTable<ProjectItemRecord, 'id'>;
  drafts!: EntityTable<DraftRecord, 'id'>;

  constructor() {
    super('json-workbench');
    this.version(1).stores({
      snippets: 'id, name, favorite, updatedAt, tags',
      history: 'id, tool, timestamp, favorite',
      projects: 'id, name, updatedAt',
      projectItems: 'id, projectId, kind, name',
      drafts: 'id, tool, updatedAt',
    });
  }
}

export const db = new WorkbenchDatabase();

export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.snippets.clear(),
    db.history.clear(),
    db.projects.clear(),
    db.projectItems.clear(),
    db.drafts.clear(),
  ]);
}
