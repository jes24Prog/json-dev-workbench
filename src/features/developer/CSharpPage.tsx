import { useState } from 'react';
import { Code2 } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { ToolRunner } from '../../components/common/ToolRunner';
import { OptionsBar, TextInput, Toggle, Field } from '../../components/common/controls';
import { generateCSharp, type CSharpGenOptions } from '../../core/generators/csharp';
import { runGenerator } from './runGenerator';

export function CSharpPage() {
  const [opts, setOpts] = useState<CSharpGenOptions>({ className: 'Root', namespace: 'App.Models', useRecord: false, addJsonProperty: true, nullable: false });
  const patch = (p: Partial<CSharpGenOptions>) => setOpts((o) => ({ ...o, ...p }));

  return (
    <ToolPage title="JSON → C#" description="Generate C# classes and records" icon={Code2}>
      <ToolRunner
        toolId="csharp"
        toolLabel="C# Generator"
        compute={(input) => runGenerator(input, (v) => generateCSharp(v, opts))}
        runOnChange
        runKey={opts}
        outputLanguage="text"
        recordSettings={() => JSON.stringify(opts)}
        options={
          <OptionsBar>
            <Field label="Class">
              <TextInput value={opts.className} onChange={(v) => patch({ className: v })} className="w-28 font-mono" />
            </Field>
            <Field label="Namespace">
              <TextInput value={opts.namespace} onChange={(v) => patch({ namespace: v })} className="w-40 font-mono" />
            </Field>
            <Toggle checked={opts.useRecord} onChange={(v) => patch({ useRecord: v })} label="records" />
            <Toggle checked={opts.addJsonProperty} onChange={(v) => patch({ addJsonProperty: v })} label="JsonProperty" />
            <Toggle checked={opts.nullable} onChange={(v) => patch({ nullable: v })} label="nullable" />
          </OptionsBar>
        }
      />
    </ToolPage>
  );
}
