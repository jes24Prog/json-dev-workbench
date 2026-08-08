import { useState } from 'react';
import { Code2 } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { ToolRunner } from '../../components/common/ToolRunner';
import { OptionsBar, TextInput, Toggle, Field } from '../../components/common/controls';
import { generateKotlin, type KotlinGenOptions } from '../../core/generators/kotlin';
import { runGenerator } from './runGenerator';

export function KotlinPage() {
  const [opts, setOpts] = useState<KotlinGenOptions>({ className: 'Root', packageName: '', addSerialName: true });
  const patch = (p: Partial<KotlinGenOptions>) => setOpts((o) => ({ ...o, ...p }));

  return (
    <ToolPage title="JSON → Kotlin" description="Generate Kotlin data classes" icon={Code2}>
      <ToolRunner
        toolId="kotlin"
        toolLabel="Kotlin Generator"
        compute={(input) => runGenerator(input, (v) => generateKotlin(v, opts))}
        runOnChange
        runKey={opts}
        outputLanguage="text"
        recordSettings={() => JSON.stringify(opts)}
        options={
          <OptionsBar>
            <Field label="Class">
              <TextInput value={opts.className} onChange={(v) => patch({ className: v })} className="w-28 font-mono" />
            </Field>
            <Field label="Package">
              <TextInput value={opts.packageName} onChange={(v) => patch({ packageName: v })} className="w-40 font-mono" />
            </Field>
            <Toggle checked={opts.addSerialName} onChange={(v) => patch({ addSerialName: v })} label="@SerialName" />
          </OptionsBar>
        }
      />
    </ToolPage>
  );
}
