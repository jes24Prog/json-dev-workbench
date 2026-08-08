import { useState } from 'react';
import { ShieldCheck, Play } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { CodeOutput } from '../../components/common/CodeOutput';
import { OptionsBar, Segmented, TextInput, Field } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';
import { useHistoryStore } from '../../stores/historyStore';
import { parseJson } from '../../core/json/parse';
import { maskJson, type MaskMode } from '../../core/masking';
import { stringifyJson } from '../../core/json/format';
import type { JsonValue } from '../../types/json';

export function MaskingPage() {
  const { value, setValue } = useDraft('masking');
  const addHistory = useHistoryStore((s) => s.add);
  const historyEnabled = useHistoryStore((s) => s.enabled);

  const [mode, setMode] = useState<MaskMode>('partial');
  const [keys, setKeys] = useState('password, token, secret, apikey, authorization');
  const [regex, setRegex] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const run = () => {
    const parsed = parseJson(value);
    if (!parsed.ok) {
      setError(parsed.error.message);
      setOutput('');
      return;
    }
    setError(null);
    const result = maskJson(parsed.value, {
      mode,
      keys: keys.split(',').map((k) => k.trim()).filter(Boolean),
      regex: regex.trim() || undefined,
    });
    if (!result.ok) {
      setOutput('');
      setError(result.error ?? 'Masking failed.');
      return;
    }
    setCount(result.maskedCount);
    const text = stringifyJson(result.value as JsonValue, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false });
    setOutput(text);
    if (historyEnabled) {
      void addHistory({
        tool: 'masking',
        toolLabel: 'Data Masking',
        input: value,
        output: text,
        settings: JSON.stringify({ mode, keys, regex }),
      });
    }
  };

  useRunShortcut(run);

  return (
    <ToolPage
      title="Data Masking"
      description="Mask sensitive values in your JSON"
      icon={ShieldCheck}
      actions={
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={run} type="button">
          <Play className="h-3 w-3" aria-hidden />
          Mask
        </button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <OptionsBar>
          <Segmented
            label="Mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'partial', label: 'Partial' },
              { value: 'stars', label: 'Stars' },
              { value: 'hash', label: 'Hash' },
            ]}
          />
          <Field label="Sensitive keys">
            <TextInput value={keys} onChange={setKeys} className="w-80 font-mono" />
          </Field>
          <Field label="Regex" hint="optional">
            <TextInput value={regex} onChange={setRegex} placeholder="\d{16}" className="w-40 font-mono" />
          </Field>
        </OptionsBar>
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
                {!error && count > 0 && (
                  <div className="flex items-center gap-2 border-b border-edge px-4 py-2 text-[11px] text-success">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                    {count} value{count === 1 ? '' : 's'} masked
                  </div>
                )}
                <CodeOutput value={output} language="json" filename="masked.json" emptyText="Mask the input to replace sensitive values." />
              </div>
            }
            leftLabel="Input"
            rightLabel="Masked output"
            initialRatio={0.45}
          />
        </div>
      </div>
    </ToolPage>
  );
}
