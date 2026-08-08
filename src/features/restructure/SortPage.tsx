import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { ToolRunner, type RunResult } from '../../components/common/ToolRunner';
import { OptionsBar, Segmented, TextInput, Field } from '../../components/common/controls';
import { parseJson } from '../../core/json/parse';
import { sortObjectKeys, sortArraysRecursive } from '../../core/json/sort';
import type { SortDirection, SortCaseMode } from '../../core/json/sort';
import type { JsonValue } from '../../types/json';
import { stringifyJson } from '../../core/json/format';

type SortTarget = 'keys' | 'arrays' | 'both';

export function SortPage() {
  const [target, setTarget] = useState<SortTarget>('keys');
  const [direction, setDirection] = useState<SortDirection>('asc');
  const [caseMode, setCaseMode] = useState<SortCaseMode>('insensitive');
  const [arrayKey, setArrayKey] = useState('');

  const compute = (input: string): RunResult => {
    const parsed = parseJson(input);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    let value = parsed.value;
    const opts = { direction, caseMode, arrayKey: arrayKey || undefined };
    if (target === 'keys' || target === 'both') value = sortObjectKeys(value, opts);
    if (target === 'arrays' || target === 'both') value = sortArraysRecursive(value, opts);
    return {
      ok: true,
      output: stringifyJson(value as JsonValue, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false }),
    };
  };

  return (
    <ToolPage title="Sort" description="Sort object keys and array items" icon={ArrowUpDown}>
      <ToolRunner
        toolId="sort"
        toolLabel="Sort"
        compute={compute}
        runOnChange
        runKey={{ target, direction, caseMode, arrayKey }}
        recordSettings={() => JSON.stringify({ target, direction, caseMode, arrayKey })}
        options={
          <OptionsBar>
            <Segmented
              label="Sort"
              value={target}
              onChange={setTarget}
              options={[
                { value: 'keys', label: 'Keys' },
                { value: 'arrays', label: 'Arrays' },
                { value: 'both', label: 'Both' },
              ]}
            />
            <Segmented
              label="Direction"
              value={direction}
              onChange={setDirection}
              options={[
                { value: 'asc', label: 'A→Z' },
                { value: 'desc', label: 'Z→A' },
              ]}
            />
            <Segmented
              label="Case"
              value={caseMode}
              onChange={setCaseMode}
              options={[
                { value: 'insensitive', label: 'Ignore case' },
                { value: 'sensitive', label: 'Case-sensitive' },
              ]}
            />
            <Field label="Array key">
              <TextInput value={arrayKey} onChange={setArrayKey} placeholder="optional property" className="w-40 font-mono" />
            </Field>
          </OptionsBar>
        }
      />
    </ToolPage>
  );
}
