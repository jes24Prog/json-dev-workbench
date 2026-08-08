import { useState } from 'react';
import { ArrowDownUp } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { ToolRunner, type RunResult } from '../../components/common/ToolRunner';
import { OptionsBar, Segmented } from '../../components/common/controls';
import { flattenObject, unflattenObject } from '../../core/transform';
import { parseJson } from '../../core/json/parse';
import type { JsonValue } from '../../types/json';
import { stringifyJson } from '../../core/json/format';

export function FlattenPage() {
  const [mode, setMode] = useState<'flatten' | 'unflatten'>('flatten');

  const compute = (input: string): RunResult => {
    const parsed = parseJson(input);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    if (mode === 'flatten') {
      if (typeof parsed.value !== 'object' || parsed.value === null || Array.isArray(parsed.value)) {
        return { ok: false, error: 'Flatten requires a JSON object root.' };
      }
      return {
        ok: true,
        output: stringifyJson(flattenObject(parsed.value as JsonValue) as JsonValue, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false }),
      };
    }
    if (typeof parsed.value !== 'object' || parsed.value === null || Array.isArray(parsed.value)) {
      return { ok: false, error: 'Unflatten requires a flat object root.' };
    }
    return {
      ok: true,
      output: stringifyJson(unflattenObject(parsed.value as JsonValue) as JsonValue, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false }),
    };
  };

  return (
    <ToolPage title="Flatten / Unflatten" description="Convert nested objects to dot notation and back" icon={ArrowDownUp}>
      <ToolRunner
        toolId="flatten"
        toolLabel="Flatten"
        compute={compute}
        runOnChange
        runKey={mode}
        recordSettings={() => JSON.stringify({ mode })}
        options={
          <OptionsBar>
            <Segmented
              label="Mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'flatten', label: 'Flatten' },
                { value: 'unflatten', label: 'Unflatten' },
              ]}
            />
          </OptionsBar>
        }
      />
    </ToolPage>
  );
}
