import { useState } from 'react';
import { PenTool, Plus, Trash2 } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { CodeOutput } from '../../components/common/CodeOutput';
import { ErrorBox } from '../../components/common/ErrorBox';
import { OptionsBar, Select, TextInput, Field } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { useCopy } from '../../hooks/useClipboard';
import { parseJson } from '../../core/json/parse';
import { stringifyJson } from '../../core/json/format';
import { queryJsonPath } from '../../core/jsonpath';

interface Condition {
  id: number;
  key: string;
  op: string;
  value: string;
}

const OPS = [
  { value: '==', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: '>', label: 'greater than' },
  { value: '>=', label: 'at least' },
  { value: '<', label: 'less than' },
  { value: '<=', label: 'at most' },
  { value: '=~', label: 'matches regex' },
];

function expressionFor(path: string, conditions: Condition[]): string {
  const parts = conditions
    .filter((c) => c.key.trim() !== '')
    .map((c) => {
      const op = c.op;
      if (op === '=~') return `@.${c.key.trim()} =~ ${c.value || '//'}`;
      if (op === '==') return `@.${c.key.trim()} == ${literal(c.value)}`;
      if (op === '!=') return `@.${c.key.trim()} != ${literal(c.value)}`;
      return `@.${c.key.trim()} ${op} ${c.value || '0'}`;
    });
  const base = path.trim() || '$';
  if (parts.length === 0) return base;
  return `${base}[?(${parts.join(' && ')})]`;
}

function literal(v: string): string {
  const trimmed = v.trim();
  if (trimmed === '') return '""';
  if (/^(true|false|null)$/.test(trimmed)) return trimmed;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return trimmed;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return trimmed;
  return `'${trimmed.replace(/'/g, "\\'")}'`;
}

let condId = 1;

export function QueryBuilderPage() {
  const { value, setValue } = useDraft('query-builder');
  const { copy } = useCopy();
  const [path, setPath] = useState('$');
  const [conditions, setConditions] = useState<Condition[]>([{ id: condId++, key: 'status', op: '==', value: 'active' }]);

  const expr = expressionFor(path, conditions);
  const parsed = parseJson(value);
  const result = parsed.ok ? queryJsonPath(parsed.value, expr) : null;
  const outputJson = result?.ok
    ? stringifyJson(result.matches?.map((m) => m.value) ?? [], { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false })
    : '';

  const update = (id: number, patch: Partial<Condition>) =>
    setConditions((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const left = <JsonInputPanel value={value} onChange={setValue} label="Input" placeholder='Paste an array of objects, e.g. [{"status": "active", "age": 30}]' />;

  const right = (
    <div className="flex h-full min-h-0 flex-col">
      <OptionsBar>
        <Field label="Array path">
          <TextInput value={path} onChange={setPath} className="w-32 font-mono" />
        </Field>
      </OptionsBar>
      <div className="flex-1 overflow-auto border-b border-edge p-3">
        <div className="space-y-2">
          {conditions.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <TextInput value={c.key} onChange={(v) => update(c.id, { key: v })} placeholder="field" className="w-36 font-mono" />
              <Select
                value={c.op}
                onChange={(op) => update(c.id, { op })}
                options={OPS}
              />
              <TextInput value={c.value} onChange={(v) => update(c.id, { value: v })} placeholder="value" className="w-40 font-mono" />
              <button className="icon-btn text-red-500" type="button" title="Remove condition" onClick={() => setConditions((cs) => cs.filter((x) => x.id !== c.id))}>
                <Trash2 className="h-3 w-3" aria-hidden />
              </button>
            </div>
          ))}
          <button className="toolbar-btn" type="button" onClick={() => setConditions((cs) => [...cs, { id: condId++, key: '', op: '==', value: '' }])}>
            <Plus className="h-3 w-3" aria-hidden />
            Add condition
          </button>
        </div>
      </div>
      <div className="border-b border-edge px-3 py-2">
        <p className="text-[10px] uppercase tracking-wide text-muted">Generated JSONPath</p>
        <div className="mt-1 flex items-center gap-2">
          <code className="flex-1 truncate rounded bg-surface-2 px-2 py-1 font-mono text-xs text-accent">{expr}</code>
          <button className="toolbar-btn" type="button" onClick={() => copy(expr, 'Expression copied')}>
            Copy
          </button>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          {result?.ok ? `${result.count} result${result.count === 1 ? '' : 's'}` : 'No results for this expression.'}
        </p>
      </div>
      <div className="min-h-0 flex-1">
        {result?.ok ? (
          <CodeOutput value={outputJson} language="json" filename="query-results.json" />
        ) : (
          <div className="p-4">
            <ErrorBox error={{ message: result?.error ?? 'No input or no matches yet.', line: 0, column: 0, offset: 0, category: 'UNEXPECTED_TOKEN' }} />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ToolPage title="Query Builder" description="Build JSONPath queries visually" icon={PenTool}>
      <SplitPane left={left} right={right} leftLabel="Input" rightLabel="Builder" initialRatio={0.42} />
    </ToolPage>
  );
}
