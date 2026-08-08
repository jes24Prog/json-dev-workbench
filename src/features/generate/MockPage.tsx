import { useState } from 'react';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { CodeOutput } from '../../components/common/CodeOutput';
import { ErrorBox } from '../../components/common/ErrorBox';
import { OptionsBar, Select, NumberInput, Toggle, Field, TextInput } from '../../components/common/controls';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';
import { useHistoryStore } from '../../stores/historyStore';
import { stringifyJson } from '../../core/json/format';
import { generateMock, MOCK_TYPES, type MockConfig, type MockField } from '../../core/mock';
import type { JsonValue } from '../../types/json';

function initialFields(): MockField[] {
  return [
    { key: 'id', type: 'uuid', nullable: 0, min: 0, max: 0, enum: [] },
    { key: 'name', type: 'name', nullable: 0, min: 0, max: 0, enum: [] },
    { key: 'email', type: 'email', nullable: 0, min: 0, max: 0, enum: [] },
    { key: 'age', type: 'integer', nullable: 0, min: 18, max: 80, enum: [] },
    { key: 'active', type: 'boolean', nullable: 0, min: 0, max: 0, enum: [] },
  ];
}

export function MockPage() {
  const [fields, setFields] = useState<MockField[]>(initialFields);
  const [count, setCount] = useState(5);
  const [seed, setSeed] = useState(42);
  const [nullable, setNullable] = useState(0);
  const [wrapInArray, setWrapInArray] = useState(true);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const addHistory = useHistoryStore((s) => s.add);
  const historyEnabled = useHistoryStore((s) => s.enabled);

  const updateField = (index: number, patch: Partial<MockField>) =>
    setFields((fs) => fs.map((f, i) => (i === index ? { ...f, ...patch } : f)));

  const generate = () => {
    const config: MockConfig = { count, seed, nullable, fields, wrapInArray };
    const result = generateMock(config);
    if (!result.ok) {
      setError(result.error ?? 'Could not generate mock data.');
      setOutput('');
      return;
    }
    setError(null);
    const text = stringifyJson(result.value as JsonValue, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false });
    setOutput(text);
    if (historyEnabled) {
      void addHistory({
        tool: 'mock',
        toolLabel: 'Mock JSON',
        input: '',
        output: text,
        settings: JSON.stringify({ count, seed, nullable, wrapInArray, fields: fields.map((f) => ({ key: f.key, type: f.type })) }),
      });
    }
  };

  useRunShortcut(generate);

  return (
    <ToolPage
      title="Mock JSON"
      description="Generate realistic mock records"
      icon={Sparkles}
      actions={
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={generate} type="button">
          <Sparkles className="h-3 w-3" aria-hidden />
          Generate
        </button>
      }
    >
      <div className="grid h-full min-h-0 grid-cols-[340px_1fr]">
        <div className="flex min-h-0 flex-col overflow-auto border-r border-edge">
          <OptionsBar>
            <Field label="Records">
              <NumberInput value={count} onChange={setCount} min={1} max={100000} />
            </Field>
            <Field label="Seed">
              <NumberInput value={seed} onChange={setSeed} />
            </Field>
            <Field label="Null %">
              <NumberInput value={nullable} onChange={setNullable} min={0} max={100} />
            </Field>
            <Toggle checked={wrapInArray} onChange={setWrapInArray} label="Wrap in array" />
          </OptionsBar>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] uppercase tracking-wide text-muted">Fields</span>
            <button className="toolbar-btn" type="button" onClick={() => setFields((fs) => [...fs, { key: `field${fs.length + 1}`, type: 'string', nullable: 0, min: 0, max: 0, enum: [] }])}>
              <Plus className="h-3 w-3" aria-hidden />
              Add field
            </button>
          </div>
          <div className="flex-1 space-y-2 px-3 pb-4">
            {fields.map((f, i) => (
              <div key={`${f.key}:${i}`} className="space-y-1 rounded-md border border-edge bg-surface p-2">
                <div className="flex items-center gap-2">
                  <TextInput value={f.key} onChange={(v) => updateField(i, { key: v })} className="flex-1 font-mono" placeholder="field name" />
                  <Select
                    value={f.type}
                    onChange={(type) => updateField(i, { type })}
                    options={MOCK_TYPES.map((t) => ({ value: t, label: t }))}
                  />
                  <button className="icon-btn text-red-500" type="button" title="Remove field" onClick={() => setFields((fs) => fs.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-3 w-3" aria-hidden />
                  </button>
                </div>
                {(f.type === 'number' || f.type === 'integer' || f.type === 'currency') && (
                  <div className="flex items-center gap-2">
                    <Field label="Min">
                      <NumberInput value={f.min ?? 0} onChange={(v) => updateField(i, { min: v })} />
                    </Field>
                    <Field label="Max">
                      <NumberInput value={f.max ?? 100} onChange={(v) => updateField(i, { max: v })} />
                    </Field>
                  </div>
                )}
                {f.type === 'string' && (
                  <Field label="Enum (comma separated, optional)">
                    <TextInput
                      value={(f.enum ?? []).join(',')}
                      onChange={(v) => updateField(i, { enum: v.split(',').map((s) => s.trim()).filter(Boolean) })}
                      className="w-full"
                    />
                  </Field>
                )}
                {f.type === 'array' && (
                  <div className="flex items-center gap-2">
                    <Select
                      label="Item type"
                      value={f.arrayType ?? 'string'}
                      onChange={(arrayType) => updateField(i, { arrayType })}
                      options={MOCK_TYPES.filter((t) => t !== 'array' && t !== 'object').map((t) => ({ value: t, label: t }))}
                    />
                    <Field label="Size">
                      <NumberInput value={f.arraySize ?? 3} onChange={(v) => updateField(i, { arraySize: v })} min={1} max={100} />
                    </Field>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="flex h-9 items-center gap-2 border-b border-edge px-3">
            <span className="text-[10px] uppercase tracking-wide text-muted">Output</span>
            {error && <span className="text-xs text-red-500">{error}</span>}
            <span className="ml-auto text-[10px] text-muted">Ctrl+Enter to generate</span>
          </div>
          {error ? (
            <div className="border-b border-edge px-4 py-3">
              <ErrorBox error={{ message: error, line: 0, column: 0, offset: 0, category: 'UNEXPECTED_TOKEN' }} />
            </div>
          ) : null}
          <div className="min-h-0 flex-1">
            <CodeOutput value={output} language="json" filename="mock.json" emptyText="Configure fields and press Generate." />
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
