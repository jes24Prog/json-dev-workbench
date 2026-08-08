import { useState } from 'react';
import { Code2 } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { ToolRunner } from '../../components/common/ToolRunner';
import { OptionsBar, TextInput, Toggle, Field } from '../../components/common/controls';
import { generateTypeScript, DEFAULT_TS_OPTIONS, type TsGenOptions } from '../../core/generators/typescript';
import { runGenerator } from './runGenerator';

export function TypeScriptPage() {
  const [opts, setOpts] = useState<TsGenOptions>(DEFAULT_TS_OPTIONS);
  const patch = (p: Partial<TsGenOptions>) => setOpts((o) => ({ ...o, ...p }));

  return (
    <ToolPage title="JSON → TypeScript" description="Generate interfaces and types" icon={Code2}>
      <ToolRunner
        toolId="typescript"
        toolLabel="TypeScript Generator"
        compute={(input) => runGenerator(input, (v) => generateTypeScript(v, opts))}
        runOnChange
        runKey={opts}
        outputLanguage="text"
        recordSettings={() => JSON.stringify(opts)}
        options={
          <OptionsBar>
            <Field label="Root name">
              <TextInput value={opts.rootName} onChange={(v) => patch({ rootName: v })} className="w-32 font-mono" />
            </Field>
            <Toggle checked={opts.exportKeyword} onChange={(v) => patch({ exportKeyword: v })} label="export" />
            <Toggle checked={opts.readonly} onChange={(v) => patch({ readonly: v })} label="readonly" />
            <Toggle checked={opts.optional} onChange={(v) => patch({ optional: v })} label="optional" />
            <Toggle checked={opts.useType} onChange={(v) => patch({ useType: v })} label="type alias" />
            <Toggle checked={opts.quoteKeys} onChange={(v) => patch({ quoteKeys: v })} label="quoted keys" />
          </OptionsBar>
        }
      />
    </ToolPage>
  );
}
