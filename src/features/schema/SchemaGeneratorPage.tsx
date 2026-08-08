import { useState } from 'react';
import { FileCode2 } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { ToolRunner } from '../../components/common/ToolRunner';
import { OptionsBar, Select, Toggle } from '../../components/common/controls';
import { generateSchema, DEFAULT_SCHEMA_GEN_OPTIONS, type SchemaGenOptions, type SchemaDraft } from '../../core/schema/generate';
import { parseJson } from '../../core/json/parse';
import { stringifyJson } from '../../core/json/format';
import type { JsonValue } from '../../types/json';

export function SchemaGeneratorPage() {
  const [opts, setOpts] = useState<SchemaGenOptions>(DEFAULT_SCHEMA_GEN_OPTIONS);
  const patch = (p: Partial<SchemaGenOptions>) => setOpts((o) => ({ ...o, ...p }));

  return (
    <ToolPage title="Schema Generator" description="Generate JSON Schema from samples" icon={FileCode2}>
      <ToolRunner
        toolId="schema-generator"
        toolLabel="Schema Generator"
        compute={(input) => {
          const parsed = parseJson(input);
          if (!parsed.ok) return { ok: false, error: parsed.error };
          const schema = generateSchema(parsed.value, opts);
          return {
            ok: true,
            output: stringifyJson(schema as unknown as JsonValue, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false }),
          };
        }}
        runOnChange
        runKey={opts}
        recordSettings={() => JSON.stringify(opts)}
        options={
          <OptionsBar>
            <Select<SchemaDraft>
              label="Draft"
              value={opts.draft}
              onChange={(draft) => patch({ draft })}
              options={[
                { value: 'draft-07', label: 'Draft 7' },
                { value: '2020-12', label: '2020-12' },
              ]}
            />
            <Toggle checked={opts.additionalProperties} onChange={(v) => patch({ additionalProperties: v })} label="additionalProperties" />
            <Toggle checked={opts.mergeArrayItems} onChange={(v) => patch({ mergeArrayItems: v })} label="Merge array items" />
            <Toggle checked={opts.detectFormats} onChange={(v) => patch({ detectFormats: v })} label="Detect formats" />
          </OptionsBar>
        }
      />
    </ToolPage>
  );
}
