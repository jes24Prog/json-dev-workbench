import { useState } from 'react';
import { Code2 } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { ToolRunner } from '../../components/common/ToolRunner';
import { OptionsBar, TextInput, Toggle, Field } from '../../components/common/controls';
import { generateGo, type GoGenOptions } from '../../core/generators/go';
import { runGenerator } from './runGenerator';

export function GoPage() {
  const [opts, setOpts] = useState<GoGenOptions>({ typeName: 'Root', packageName: 'main', usePointers: true });
  const patch = (p: Partial<GoGenOptions>) => setOpts((o) => ({ ...o, ...p }));

  return (
    <ToolPage title="JSON → Go" description="Generate Go structs" icon={Code2}>
      <ToolRunner
        toolId="go"
        toolLabel="Go Generator"
        compute={(input) => runGenerator(input, (v) => generateGo(v, opts))}
        runOnChange
        runKey={opts}
        outputLanguage="text"
        recordSettings={() => JSON.stringify(opts)}
        options={
          <OptionsBar>
            <Field label="Type">
              <TextInput value={opts.typeName} onChange={(v) => patch({ typeName: v })} className="w-28 font-mono" />
            </Field>
            <Field label="Package">
              <TextInput value={opts.packageName} onChange={(v) => patch({ packageName: v })} className="w-28 font-mono" />
            </Field>
            <Toggle checked={opts.usePointers} onChange={(v) => patch({ usePointers: v })} label="pointers" />
          </OptionsBar>
        }
      />
    </ToolPage>
  );
}
