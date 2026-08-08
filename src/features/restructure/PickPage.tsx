import { useState } from 'react';
import { ListChecks } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { ToolRunner, type RunResult } from '../../components/common/ToolRunner';
import { OptionsBar, Segmented, TextInput, Field } from '../../components/common/controls';
import { parseJson } from '../../core/json/parse';
import { applyTransformPipeline, type TransformOperation } from '../../core/transform';
import { stringifyJson } from '../../core/json/format';
import type { JsonValue } from '../../types/json';

export function PickPage() {
  const [mode, setMode] = useState<'pick' | 'omit'>('pick');
  const [keysText, setKeysText] = useState('');

  const compute = (input: string): RunResult => {
    const parsed = parseJson(input);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    const keys = keysText.split(',').map((k) => k.trim()).filter(Boolean);
    if (keys.length === 0) return { ok: false, error: 'Enter at least one property name.' };
    const op: TransformOperation = { id: 'pick-1', type: mode, keys };
    const result = applyTransformPipeline(parsed.value, [op]);
    if (!result.ok) return { ok: false, error: result.error ?? 'Operation failed.' };
    return {
      ok: true,
      output: stringifyJson(result.output as JsonValue, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false }),
    };
  };

  return (
    <ToolPage title="Pick / Omit" description="Select or remove properties from objects" icon={ListChecks}>
      <ToolRunner
        toolId="pick"
        toolLabel="Pick / Omit"
        compute={compute}
        runOnChange={false}
        runKey={{ mode, keysText }}
        recordSettings={() => JSON.stringify({ mode, keysText })}
        options={
          <OptionsBar>
            <Segmented
              label="Mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'pick', label: 'Pick' },
                { value: 'omit', label: 'Omit' },
              ]}
            />
            <Field label={mode === 'pick' ? 'Pick keys' : 'Omit keys'}>
              <TextInput value={keysText} onChange={setKeysText} placeholder="name, id, email" className="w-64 font-mono" />
            </Field>
          </OptionsBar>
        }
      />
    </ToolPage>
  );
}
