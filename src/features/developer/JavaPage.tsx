import { useState } from 'react';
import { Code2 } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { ToolRunner } from '../../components/common/ToolRunner';
import { OptionsBar, TextInput, Toggle, Field } from '../../components/common/controls';
import { generateJava, type JavaGenOptions } from '../../core/generators/java';
import { runGenerator } from './runGenerator';

export function JavaPage() {
  const [opts, setOpts] = useState<JavaGenOptions>({ className: 'Root', packageName: '', useRecord: false, useLombok: false, addJackson: false });
  const patch = (p: Partial<JavaGenOptions>) => setOpts((o) => ({ ...o, ...p }));

  return (
    <ToolPage title="JSON → Java" description="Generate POJOs and records" icon={Code2}>
      <ToolRunner
        toolId="java"
        toolLabel="Java Generator"
        compute={(input) => runGenerator(input, (v) => generateJava(v, opts))}
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
            <Toggle checked={opts.useRecord} onChange={(v) => patch({ useRecord: v })} label="records" />
            <Toggle checked={opts.useLombok} onChange={(v) => patch({ useLombok: v })} label="Lombok" />
            <Toggle checked={opts.addJackson} onChange={(v) => patch({ addJackson: v })} label="Jackson" />
          </OptionsBar>
        }
      />
    </ToolPage>
  );
}
