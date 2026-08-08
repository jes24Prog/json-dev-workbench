import { Wand2 } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { ToolRunner } from '../../components/common/ToolRunner';
import { OptionsBar, NumberInput, Field } from '../../components/common/controls';
import { useState } from 'react';
import { parseJson } from '../../core/json/parse';
import { generateSampleFromSchema } from '../../core/schema/sample';
import { stringifyJson } from '../../core/json/format';

export function SchemaMockPage() {
  const [maxItems, setMaxItems] = useState(5);

  return (
    <ToolPage title="JSON from Schema" description="Generate sample data from a schema" icon={Wand2}>
      <ToolRunner
        toolId="schema-mock"
        toolLabel="JSON from Schema"
        compute={(input) => {
          const parsed = parseJson(input);
          if (!parsed.ok) return { ok: false, error: parsed.error };
          const result = generateSampleFromSchema(parsed.value, { maxArrayItems: maxItems, seed: 7 });
          if (!result.ok) return { ok: false, error: result.error };
          return {
            ok: true,
            output: stringifyJson(result.value, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false }),
          };
        }}
        runKey={maxItems}
        runOnChange
        recordSettings={() => JSON.stringify({ maxArrayItems: maxItems })}
        options={
          <OptionsBar>
            <Field label="Max array items">
              <NumberInput value={maxItems} onChange={setMaxItems} min={1} max={50} />
            </Field>
          </OptionsBar>
        }
      />
    </ToolPage>
  );
}
