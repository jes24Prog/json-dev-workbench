import type { LucideIcon } from 'lucide-react';
import {
  Braces,
  FileJson,
  Wand2,
  CheckCircle2,
  Minimize2,
  GitFork,
  Search,
  GitCompare,
  GitMerge,
  ArrowDownUp,
  Filter,
  ListChecks,
  Split,
  PenTool,
  Database,
  ShieldCheck,
  FileCode2,
  Clock,
  Save,
  History,
  Star,
  LayoutGrid,
  Settings,
  Keyboard,
  Info,
  Palette,
  ClipboardType,
  Table2,
  FileText,
  FileCode,
  Braces as BracesIcon,
  Code2,
  Sparkles,
  Lock,
  Eraser,
  CornerDownLeft,
} from 'lucide-react';

export interface CommandDefinition {
  id: string;
  label: string;
  keywords: string[];
  icon: LucideIcon;
  category: string;
  action: 'navigate' | 'toggle-theme' | 'open-settings' | 'open-shortcuts' | 'open-about' | 'save' | 'clear-editor';
  target?: string;
  shortcut?: string;
}

export interface ToolDefinition {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
}

export const TOOL_CATEGORIES: { id: string; label: string; tools: ToolDefinition[] }[] = [
  {
    id: 'json',
    label: 'JSON',
    tools: [
      { id: 'editor', label: 'JSON Editor', description: 'Full-featured code editor with actions', icon: FileJson, keywords: ['edit', 'editor', 'code', 'json'] },
      { id: 'formatter', label: 'Formatter', description: 'Pretty-print JSON with full control', icon: Braces, keywords: ['format', 'pretty', 'print', 'indent'] },
      { id: 'validator', label: 'Validator', description: 'Syntax and structure validation', icon: CheckCircle2, keywords: ['validate', 'syntax', 'error', 'check'] },
      { id: 'minifier', label: 'Minifier', description: 'Compact JSON and size statistics', icon: Minimize2, keywords: ['minify', 'compact', 'size', 'compress'] },
      { id: 'tree', label: 'Tree Viewer', description: 'Interactive JSON tree explorer', icon: GitFork, keywords: ['tree', 'navigate', 'browse', 'view'] },
      { id: 'explorer', label: 'JSON Explorer', description: 'Statistics and structure overview', icon: Search, keywords: ['stats', 'analyze', 'structure', 'overview', 'metrics'] },
    ],
  },
  {
    id: 'transform',
    label: 'Transform',
    tools: [
      { id: 'transform', label: 'Transform', description: 'Visual transformation pipeline', icon: Wand2, keywords: ['transform', 'pipeline', 'rename', 'move', 'operations'] },
      { id: 'merge', label: 'Merge', description: 'Combine multiple JSON documents', icon: GitMerge, keywords: ['merge', 'combine', 'conflict', 'join'] },
      { id: 'flatten', label: 'Flatten', description: 'Flatten and unflatten nested objects', icon: ArrowDownUp, keywords: ['flatten', 'unflatten', 'dot notation', 'nested'] },
      { id: 'sort', label: 'Sort', description: 'Sort keys and arrays', icon: ArrowDownUp, keywords: ['sort', 'order', 'alphabetical', 'keys'] },
      { id: 'pick', label: 'Pick / Omit', description: 'Select or remove properties', icon: ListChecks, keywords: ['pick', 'omit', 'select', 'filter fields', 'remove'] },
      { id: 'arrays', label: 'Array Utilities', description: 'Filter, group, dedupe, chunk and more', icon: Split, keywords: ['array', 'filter', 'group', 'dedupe', 'chunk', 'unique', 'flatten array'] },
    ],
  },
  {
    id: 'query',
    label: 'Query',
    tools: [
      { id: 'jsonpath', label: 'JSONPath', description: 'Query JSON with JSONPath expressions', icon: CornerDownLeft, keywords: ['jsonpath', 'query', 'select', '$'] },
      { id: 'search', label: 'Search', description: 'Find keys and values anywhere', icon: Search, keywords: ['search', 'find', 'key', 'value', 'regex'] },
      { id: 'query-builder', label: 'Query Builder', description: 'Build JSONPath queries visually', icon: PenTool, keywords: ['query builder', 'condition', 'filter builder'] },
    ],
  },
  {
    id: 'compare',
    label: 'Compare',
    tools: [
      { id: 'diff', label: 'JSON Diff', description: 'Side-by-side document comparison', icon: GitCompare, keywords: ['diff', 'compare', 'changes', 'difference'] },
      { id: 'patch', label: 'JSON Patch', description: 'RFC 6902 patch and merge patch', icon: ClipboardType, keywords: ['patch', 'rfc6902', 'merge patch', 'operations'] },
      { id: 'pointer', label: 'JSON Pointer', description: 'RFC 6901 pointer resolution', icon: CornerDownLeft, keywords: ['pointer', 'rfc6901', 'path', 'resolve'] },
    ],
  },
  {
    id: 'schema',
    label: 'Schema',
    tools: [
      { id: 'schema-generator', label: 'Schema Generator', description: 'Generate JSON Schema from samples', icon: FileCode2, keywords: ['schema', 'generate', 'draft', 'json schema'] },
      { id: 'schema-validator', label: 'Schema Validator', description: 'Validate JSON against a schema', icon: CheckCircle2, keywords: ['schema', 'validate', 'ajv', 'draft'] },
      { id: 'schema-explorer', label: 'Schema Explorer', description: 'Browse and explain a schema', icon: Search, keywords: ['schema', 'explore', 'explain', 'tree'] },
    ],
  },
  {
    id: 'convert',
    label: 'Convert',
    tools: [
      { id: 'yaml', label: 'JSON ↔ YAML', description: 'Convert between JSON and YAML', icon: FileCode, keywords: ['yaml', 'yml', 'convert'] },
      { id: 'xml', label: 'JSON ↔ XML', description: 'Convert between JSON and XML', icon: FileCode, keywords: ['xml', 'convert'] },
      { id: 'csv', label: 'JSON ↔ CSV', description: 'Convert between JSON and CSV', icon: Table2, keywords: ['csv', 'table', 'spreadsheet', 'convert'] },
      { id: 'markdown', label: 'JSON → Markdown', description: 'Render JSON as Markdown tables', icon: FileText, keywords: ['markdown', 'md', 'table', 'document'] },
      { id: 'html', label: 'JSON → HTML', description: 'Export JSON as highlighted HTML', icon: FileCode, keywords: ['html', 'page', 'export'] },
      { id: 'sql', label: 'JSON → SQL', description: 'Generate INSERT statements', icon: Database, keywords: ['sql', 'insert', 'postgres', 'mysql', 'database'] },
    ],
  },
  {
    id: 'generate',
    label: 'Generate',
    tools: [
      { id: 'mock', label: 'Mock JSON', description: 'Generate realistic mock records', icon: Sparkles, keywords: ['mock', 'fake', 'generate', 'seed', 'records'] },
      { id: 'schema-mock', label: 'JSON from Schema', description: 'Generate sample data from a schema', icon: Wand2, keywords: ['schema', 'sample', 'generate', 'fake data'] },
      { id: 'samples', label: 'Sample Data', description: 'Load ready-to-use sample datasets', icon: Database, keywords: ['sample', 'example', 'dataset', 'demo'] },
      { id: 'uuid', label: 'UUID Generator', description: 'Generate UUIDs in batch', icon: Sparkles, keywords: ['uuid', 'guid', 'random', 'generate'] },
      { id: 'api-response', label: 'API Response', description: 'Generate API responses with status codes', icon: CornerDownLeft, keywords: ['api', 'response', 'status', 'http', 'mock api'] },
    ],
  },
  {
    id: 'developer',
    label: 'Developer',
    tools: [
      { id: 'typescript', label: 'JSON → TypeScript', description: 'Generate interfaces and types', icon: Code2, keywords: ['typescript', 'interface', 'type', 'dto', 'ts'] },
      { id: 'java', label: 'JSON → Java', description: 'Generate POJOs and records', icon: Code2, keywords: ['java', 'pojo', 'record', 'dto', 'spring'] },
      { id: 'csharp', label: 'JSON → C#', description: 'Generate C# classes and records', icon: Code2, keywords: ['csharp', 'c#', '.net', 'class', 'record'] },
      { id: 'kotlin', label: 'JSON → Kotlin', description: 'Generate Kotlin data classes', icon: Code2, keywords: ['kotlin', 'data class'] },
      { id: 'go', label: 'JSON → Go', description: 'Generate Go structs', icon: Code2, keywords: ['go', 'golang', 'struct'] },
      { id: 'python', label: 'JSON → Python', description: 'Generate Python dataclasses', icon: Code2, keywords: ['python', 'dataclass', 'typeddict'] },
      { id: 'openapi', label: 'JSON → OpenAPI', description: 'Generate OpenAPI schema objects', icon: FileCode2, keywords: ['openapi', 'swagger', 'schema', 'api spec'] },
    ],
  },
  {
    id: 'utilities',
    label: 'Utilities',
    tools: [
      { id: 'encoding', label: 'Encoding', description: 'Base64, URL, Unicode, escaping', icon: Lock, keywords: ['base64', 'url', 'encode', 'decode', 'unicode', 'escape', 'hex'] },
      { id: 'timestamp', label: 'Timestamp', description: 'Convert Unix time and ISO dates', icon: Clock, keywords: ['timestamp', 'unix', 'epoch', 'iso', 'date'] },
      { id: 'masking', label: 'Data Masking', description: 'Mask sensitive values in JSON', icon: ShieldCheck, keywords: ['mask', 'privacy', 'redact', 'sensitive', 'hide'] },
      { id: 'secret-detection', label: 'Secret Detection', description: 'Find API keys, tokens and passwords', icon: ShieldCheck, keywords: ['secret', 'token', 'apikey', 'detect', 'security'] },
      { id: 'security', label: 'Security Analysis', description: 'Assess document security posture', icon: ShieldCheck, keywords: ['security', 'analysis', 'audit', 'risk', 'severity'] },
      { id: 'regex', label: 'Regex Tester', description: 'Test regular expressions against text', icon: Filter, keywords: ['regex', 'regular expression', 'test', 'match'] },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    tools: [
      { id: 'workspace', label: 'Projects', description: 'Organize documents and schemas', icon: LayoutGrid, keywords: ['project', 'workspace', 'collection', 'organize'] },
      { id: 'snippets', label: 'Snippets', description: 'Reusable JSON snippets with tags', icon: Save, keywords: ['snippet', 'save', 'reusable', 'tags', 'template'] },
      { id: 'history', label: 'History', description: 'Local operation history', icon: History, keywords: ['history', 'recent', 'operations', 'restore'] },
      { id: 'favorites', label: 'Favorites', description: 'Starred snippets and history', icon: Star, keywords: ['favorite', 'star', 'saved', 'bookmark'] },
    ],
  },
];

export const ALL_TOOLS: ToolDefinition[] = TOOL_CATEGORIES.flatMap((c) => c.tools);

export function findTool(id: string): ToolDefinition | undefined {
  return ALL_TOOLS.find((t) => t.id === id);
}

export const COMMANDS: CommandDefinition[] = [
  { id: 'cmd-toggle-theme', label: 'Toggle Theme', keywords: ['theme', 'dark', 'light', 'mode'], icon: Palette, category: 'Application', action: 'toggle-theme', shortcut: 'Ctrl+Shift+L' },
  { id: 'cmd-settings', label: 'Open Settings', keywords: ['settings', 'preferences', 'config'], icon: Settings, category: 'Application', action: 'open-settings', shortcut: 'Ctrl+,' },
  { id: 'cmd-shortcuts', label: 'Keyboard Shortcuts', keywords: ['shortcuts', 'keys', 'hotkeys'], icon: Keyboard, category: 'Application', action: 'open-shortcuts' },
  { id: 'cmd-about', label: 'About', keywords: ['about', 'info', 'help'], icon: Info, category: 'Application', action: 'open-about' },
  { id: 'cmd-save', label: 'Save to Snippets', keywords: ['save', 'snippet', 'store'], icon: Save, category: 'Workspace', action: 'save', shortcut: 'Ctrl+S' },
  { id: 'cmd-clear', label: 'Clear Editor', keywords: ['clear', 'reset', 'empty'], icon: Eraser, category: 'Editor', action: 'clear-editor', shortcut: 'Ctrl+K' },
  ...TOOL_CATEGORIES.flatMap((cat) =>
    cat.tools.map((tool) => ({
      id: `tool-${tool.id}`,
      label: `Open ${tool.label}`,
      keywords: [tool.label, ...tool.keywords, 'open', 'go'],
      icon: tool.icon,
      category: cat.label,
      action: 'navigate' as const,
      target: tool.id,
    })),
  ),
  ...ALL_TOOLS.map((tool) => ({
    id: `run-${tool.id}`,
    label: `Run: ${tool.label}`,
    keywords: [tool.label, ...tool.keywords, 'run', 'execute'],
    icon: BracesIcon,
    category: 'Commands',
    action: 'navigate' as const,
    target: tool.id,
  })),
];
