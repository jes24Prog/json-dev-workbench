import { useState } from 'react';
import { Split, Play } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { CodeOutput } from '../../components/common/CodeOutput';
import { OptionsBar, Segmented, TextInput, Field } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';
import { useHistoryStore } from '../../stores/historyStore';
import { parseJson } from '../../core/json/parse';
import { applyTransformPipeline, type TransformOperation } from '../../core/transform';
import { stringifyJson } from '../../core/json/format';
import type { JsonValue } from '../../types/json';

type ArrayOp = 'filter' | 'group' | 'dedupe' | 'chunk' | 'sort' | 'unique';

const OP_LABELS: Record<ArrayOp, string> = {
  filter: 'Filter by value',
  group: 'Group by key',
  dedupe: 'Remove duplicates',
  chunk: 'Split into chunks',
  sort: 'Sort by key',
  unique: 'Keep first of each',
};

export function ArraysPage() {
  const { value, setValue } = useDraft('arrays');
  const addHistory = useHistoryStore((s) => s.add);
  const historyEnabled = useHistoryStore((s) => s.enabled);

  const [op, setOp] = useState<ArrayOp>('filter');
  const [key, setKey] = useState('');
  const [arg, setArg] = useState('');
  const [chunkSize, setChunkSize] = useState(2);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const parsed = parseJson(value);
    if (!parsed.ok) {
      setError(parsed.error.message);
      setOutput('');
      return;
    }
    if (!Array.isArray(parsed.value)) {
      setError('This tool requires the input to be a JSON array.');
      setOutput('');
      return;
    }
    setError(null);
    const result = applyArrayOp(parsed.value, op, key, arg, chunkSize);
    if (!result.ok) {
      setOutput('');
      setError(result.error ?? 'Operation failed.');
      return;
    }
    const text = stringifyJson(result.output as JsonValue, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false });
    setOutput(text);
    if (historyEnabled) {
      void addHistory({
        tool: 'arrays',
        toolLabel: 'Array Utilities',
        input: value,
        output: text,
        settings: JSON.stringify({ op, key, arg, chunkSize }),
      });
    }
  };

  useRunShortcut(run);

  return (
    <ToolPage
      title="Array Utilities"
      description="Filter, group, dedupe, chunk, sort and unique array items"
      icon={Split}
      actions={
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={run} type="button">
          <Play className="h-3 w-3" aria-hidden />
          Run
        </button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <OptionsBar>
          <Segmented
            label="Operation"
            value={op}
            onChange={setOp}
            options={(Object.keys(OP_LABELS) as ArrayOp[]).map((k) => ({ value: k, label: OP_LABELS[k] }))}
          />
          {op !== 'unique' && (
            <Field label="Key">
              <TextInput value={key} onChange={setKey} placeholder="property (optional)" className="w-40 font-mono" />
            </Field>
          )}
          {op === 'filter' && (
            <Field label="Value">
              <TextInput value={arg} onChange={setArg} placeholder="e.g. active or 42" className="w-40 font-mono" />
            </Field>
          )}
          {op === 'chunk' && (
            <Field label="Chunk size">
              <input
                type="number"
                className="input w-20 py-1 text-xs"
                value={chunkSize}
                min={1}
                onChange={(e) => setChunkSize(Math.max(1, Number(e.target.value) || 1))}
              />
            </Field>
          )}
        </OptionsBar>
        <div className="min-h-0 flex-1">
          <SplitPane
            left={<JsonInputPanel value={value} onChange={setValue} label="Input array" />}
            right={
              <div className="flex h-full min-h-0 flex-col">
                {error && (
                  <div className="border-b border-edge px-4 py-3">
                    <div className="rounded-md border border-error/30 bg-error/5 px-3 py-2 font-mono text-xs text-error">{error}</div>
                  </div>
                )}
                <CodeOutput value={output} language="json" filename="array-result.json" emptyText="Run an operation to see the result here." />
              </div>
            }
            leftLabel="Input"
            rightLabel="Result"
            initialRatio={0.45}
          />
        </div>
      </div>
    </ToolPage>
  );
}

function applyArrayOp(
  items: JsonValue[],
  op: ArrayOp,
  key: string,
  arg: string,
  chunkSize: number,
): { ok: boolean; output?: JsonValue; error?: string } {
  switch (op) {
    case 'filter': {
      const target = arg;
      const filtered = items.filter((item) => {
        const actual = key ? extract(item, key) : item;
        const actualStr = typeof actual === 'string' ? actual : JSON.stringify(actual);
        return actualStr.includes(target);
      });
      return { ok: true, output: filtered };
    }
    case 'group': {
      const groups: Record<string, JsonValue[]> = {};
      for (const item of items) {
        const actual = key ? extract(item, key) : item;
        const g = actual === undefined ? '__missing__' : typeof actual === 'string' ? actual : JSON.stringify(actual);
        if (!groups[g]) groups[g] = [];
        groups[g].push(item);
      }
      return { ok: true, output: groups as JsonValue };
    }
    case 'dedupe': {
      const seen = new Set<string>();
      const out: JsonValue[] = [];
      for (const item of items) {
        const k = key ? JSON.stringify(extract(item, key)) : JSON.stringify(item);
        if (!seen.has(k)) {
          seen.add(k);
          out.push(item);
        }
      }
      return { ok: true, output: out };
    }
    case 'unique': {
      const seen = new Set<string>();
      const out: JsonValue[] = [];
      for (const item of items) {
        const k = JSON.stringify(item);
        if (!seen.has(k)) {
          seen.add(k);
          out.push(item);
        }
      }
      return { ok: true, output: out };
    }
    case 'chunk': {
      const size = Math.max(1, chunkSize);
      const out: JsonValue[] = [];
      for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
      return { ok: true, output: out };
    }
    case 'sort': {
      const op: TransformOperation = {
        id: 'sort-1',
        type: 'sort',
        path: '',
        key: key || undefined,
        direction: 'asc',
      };
      const result = applyTransformPipeline(items, [op]);
      return { ok: result.ok, output: result.output, error: result.error };
    }
    default:
      return { ok: false, error: 'Unknown operation.' };
  }
}

function extract(item: JsonValue, key: string): JsonValue | undefined {
  if (typeof item !== 'object' || item === null) return undefined;
  if (Array.isArray(item)) {
    const idx = Number(key);
    return item[idx];
  }
  return (item as Record<string, JsonValue>)[key];
}
