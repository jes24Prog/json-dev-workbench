import { useState } from 'react';
import { Wand2, Play, ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { CodeOutput } from '../../components/common/CodeOutput';
import { OptionsBar, Select, TextInput } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';
import { useHistoryStore } from '../../stores/historyStore';
import { parseJson } from '../../core/json/parse';
import {
  applyTransformPipeline,
  transformLabel,
  TRANSFORM_OPERATION_TYPES,
  type TransformOperation,
  type TransformOperationType,
  type CompareOp,
} from '../../core/transform';
import { stringifyJson } from '../../core/json/format';

let opCounter = 0;
function newOpId(): string {
  opCounter += 1;
  return `op-${Date.now().toString(36)}-${opCounter}`;
}

const COMPARE_OPS: { value: CompareOp; label: string }[] = [
  { value: 'eq', label: 'equals' },
  { value: 'ne', label: 'not equals' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'contains', label: 'contains' },
  { value: 'notContains', label: 'not contains' },
  { value: 'exists', label: 'exists' },
];

export function TransformPage() {
  const { value, setValue } = useDraft('transform');
  const addHistory = useHistoryStore((s) => s.add);
  const historyEnabled = useHistoryStore((s) => s.enabled);

  const [ops, setOps] = useState<TransformOperation[]>([]);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  const patchOp = (id: string, patch: Partial<TransformOperation>) => {
    setOps((list) => list.map((op) => (op.id === id ? ({ ...op, ...patch } as TransformOperation) : op)));
  };

  const addOp = (type: TransformOperationType = 'rename') => {
    const base: TransformOperation = { id: newOpId(), type: 'rename', key: '', to: '' };
    setOps((list) => [...list, { ...base, type } as TransformOperation]);
  };

  const removeOp = (id: string) => setOps((list) => list.filter((op) => op.id !== id));
  const moveOp = (index: number, delta: number) => {
    setOps((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const run = () => {
    const parsed = parseJson(value);
    if (!parsed.ok) {
      setError(parsed.error.message);
      setOutput('');
      return;
    }
    setError(null);
    const result = applyTransformPipeline(parsed.value, ops);
    if (!result.ok) {
      setOutput('');
      setError(result.error ?? 'Transformation failed.');
      return;
    }
    const text = stringifyJson(result.output as never, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false });
    setOutput(text);
    setChanged(Boolean(result.changed));
    if (historyEnabled) {
      void addHistory({
        tool: 'transform',
        toolLabel: 'Transform',
        input: value,
        output: text,
        settings: JSON.stringify(ops.map(transformLabel)),
      });
    }
  };

  useRunShortcut(run);

  return (
    <ToolPage
      title="Transform"
      description="Apply a pipeline of operations to your JSON"
      icon={Wand2}
      actions={
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={run} type="button">
          <Play className="h-3 w-3" aria-hidden />
          Apply pipeline
        </button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <OptionsBar>
          <Select
            label="Operation"
            value="rename"
            onChange={(t) => addOp(t as TransformOperationType)}
            options={TRANSFORM_OPERATION_TYPES.map((t) => ({ value: t, label: t }))}
          />
          <button className="btn !px-2 !py-1 !text-xs" onClick={() => addOp()} type="button">
            <Plus className="h-3 w-3" aria-hidden />
            Add
          </button>
          <span className="text-[11px] text-muted">
            {ops.length === 0 ? 'No operations yet. Add one to build your pipeline.' : `${ops.length} operation${ops.length === 1 ? '' : 's'} in pipeline`}
          </span>
        </OptionsBar>

        {ops.length > 0 && (
          <div className="max-h-52 min-h-0 overflow-y-auto border-b border-edge px-3 py-2">
            <div className="flex flex-col gap-2">
              {ops.map((op, index) => (
                <div key={op.id} className="flex items-center gap-2 rounded-md border border-edge bg-surface px-2 py-1.5">
                  <div className="flex flex-col">
                    <button className="icon-btn h-4 w-4 !p-0" onClick={() => moveOp(index, -1)} disabled={index === 0} type="button" aria-label="Move up">
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button className="icon-btn h-4 w-4 !p-0" onClick={() => moveOp(index, 1)} disabled={index === ops.length - 1} type="button" aria-label="Move down">
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="w-28 shrink-0 text-[11px] font-medium text-ink">{transformLabel(op)}</span>
                  <div className="min-w-0 flex-1">
                    <OperationEditor op={op} onChange={(p) => patchOp(op.id, p)} />
                  </div>
                  <button className="icon-btn" onClick={() => removeOp(op.id)} type="button" aria-label="Remove operation">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1">
          <SplitPane
            left={<JsonInputPanel value={value} onChange={setValue} label="Input JSON" />}
            right={
              <div className="flex h-full min-h-0 flex-col">
                {error && (
                  <div className="border-b border-edge px-4 py-3">
                    <div className="rounded-md border border-error/30 bg-error/5 px-3 py-2 font-mono text-xs text-error">{error}</div>
                  </div>
                )}
                {changed && !error && (
                  <div className="flex items-center gap-2 border-b border-edge px-4 py-2 text-[11px] text-success">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                    Pipeline applied — output differs from input
                  </div>
                )}
                <CodeOutput value={output} language="json" filename="transformed.json" emptyText="Apply the pipeline to see the transformed JSON." />
              </div>
            }
            leftLabel="Input"
            rightLabel="Output"
            initialRatio={0.45}
          />
        </div>
      </div>
    </ToolPage>
  );
}

function OperationEditor({
  op,
  onChange,
}: {
  op: TransformOperation;
  onChange: (patch: Partial<TransformOperation>) => void;
}) {
  switch (op.type) {
    case 'rename':
      return (
        <div className="flex items-center gap-2">
          <TextInput value={op.key} onChange={(v) => onChange({ key: v })} placeholder="from" className="!py-0.5 !text-xs" />
          <span className="text-muted">→</span>
          <TextInput value={op.to} onChange={(v) => onChange({ to: v })} placeholder="to" className="!py-0.5 !text-xs" />
        </div>
      );
    case 'delete':
      return (
        <TextInput value={op.key} onChange={(v) => onChange({ key: v })} placeholder="key to delete (any depth)" className="!py-0.5 !text-xs" />
      );
    case 'pick':
    case 'omit':
      return (
        <TextInput
          value={op.keys.join(', ')}
          onChange={(v) => onChange({ keys: v.split(',').map((s) => s.trim()).filter(Boolean) })}
          placeholder="comma-separated keys"
          className="!py-0.5 !text-xs"
        />
      );
    case 'add':
    case 'defaults':
      return (
        <div className="flex items-center gap-2">
          <TextInput
            value={op.type === 'add' ? op.path : op.key}
            onChange={(v) => (op.type === 'add' ? onChange({ path: v }) : onChange({ key: v }))}
            placeholder="path (a.b.c)"
            className="!py-0.5 !text-xs"
          />
          <TextInput value={op.json} onChange={(v) => onChange({ json: v })} placeholder='value JSON, e.g. 42' className="!py-0.5 !text-xs" />
        </div>
      );
    case 'move':
    case 'copy':
      return (
        <div className="flex items-center gap-2">
          <TextInput value={op.from} onChange={(v) => onChange({ from: v })} placeholder="from path" className="!py-0.5 !text-xs" />
          <span className="text-muted">→</span>
          <TextInput value={op.to} onChange={(v) => onChange({ to: v })} placeholder="to path" className="!py-0.5 !text-xs" />
        </div>
      );
    case 'flatten':
    case 'unflatten':
    case 'unique':
      return <span className="text-[11px] text-muted">No configuration needed.</span>;
    case 'filter':
      return (
        <div className="flex items-center gap-2">
          <TextInput value={op.key} onChange={(v) => onChange({ key: v })} placeholder="field (or 'self')" className="!py-0.5 !text-xs" />
          <Select
            label=""
            value={op.op}
            onChange={(v) => onChange({ op: v as CompareOp })}
            options={COMPARE_OPS.map((o) => ({ value: o.value, label: o.label }))}
            compact
          />
          <TextInput value={op.value} onChange={(v) => onChange({ value: v })} placeholder="value" className="!py-0.5 !text-xs" />
          <TextInput value={op.path} onChange={(v) => onChange({ path: v })} placeholder="path (optional)" className="!py-0.5 !text-xs" />
        </div>
      );
    case 'sort':
      return (
        <div className="flex items-center gap-2">
          <TextInput value={op.key ?? ''} onChange={(v) => onChange({ key: v })} placeholder="sort key (optional)" className="!py-0.5 !text-xs" />
          <SegmentedMini value={op.direction} onChange={(v) => onChange({ direction: v as 'asc' | 'desc' })} />
        </div>
      );
    case 'groupBy':
    case 'dedupe':
      return (
        <div className="flex items-center gap-2">
          <TextInput value={op.key ?? ''} onChange={(v) => onChange({ key: v })} placeholder="key" className="!py-0.5 !text-xs" />
          <TextInput value={op.path} onChange={(v) => onChange({ path: v })} placeholder="path (optional)" className="!py-0.5 !text-xs" />
        </div>
      );
    case 'convert':
      return (
        <div className="flex items-center gap-2">
          <Select
            label=""
            value={op.to}
            onChange={(v) => onChange({ to: v as 'string' | 'number' | 'boolean' | 'null' })}
            options={['string', 'number', 'boolean', 'null'].map((t) => ({ value: t, label: t }))}
            compact
          />
          <TextInput value={op.path} onChange={(v) => onChange({ path: v })} placeholder="path (optional)" className="!py-0.5 !text-xs" />
        </div>
      );
    case 'case':
      return (
        <div className="flex items-center gap-2">
          <SegmentedMini
            value={op.mode}
            onChange={(v) => onChange({ mode: v as 'upper' | 'lower' | 'title' })}
            options={[
              { value: 'upper', label: 'upper' },
              { value: 'lower', label: 'lower' },
              { value: 'title', label: 'Title' },
            ]}
          />
          <TextInput value={op.path} onChange={(v) => onChange({ path: v })} placeholder="path (optional)" className="!py-0.5 !text-xs" />
        </div>
      );
    default:
      return null;
  }
}

function SegmentedMini({
  value,
  onChange,
  options = [
    { value: 'asc', label: 'asc' },
    { value: 'desc', label: 'desc' },
  ],
}: {
  value: string;
  onChange: (v: string) => void;
  options?: { value: string; label: string }[];
}) {
  return (
    <div className="flex overflow-hidden rounded-md border border-edge text-[11px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`px-2 py-0.5 ${value === o.value ? 'bg-primary/15 text-primary' : 'text-muted hover:text-ink'}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
