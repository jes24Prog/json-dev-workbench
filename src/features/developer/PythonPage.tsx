import { useState } from 'react';
import { Code2 } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { ToolRunner } from '../../components/common/ToolRunner';
import { OptionsBar, TextInput, Toggle, Field, Segmented } from '../../components/common/controls';
import { generatePython, type PythonGenOptions } from '../../core/generators/python';
import { runGenerator } from './runGenerator';

export function PythonPage() {
  const [opts, setOpts] = useState<PythonGenOptions>({ className: 'Root', style: 'dataclass', typeImports: true });
  const patch = (p: Partial<PythonGenOptions>) => setOpts((o) => ({ ...o, ...p }));

  return (
    <ToolPage title="JSON → Python" description="Generate dataclasses and TypedDicts" icon={Code2}>
      <ToolRunner
        toolId="python"
        toolLabel="Python Generator"
        compute={(input) => runGenerator(input, (v) => generatePython(v, opts))}
        runOnChange
        runKey={opts}
        outputLanguage="text"
        recordSettings={() => JSON.stringify(opts)}
        options={
          <OptionsBar>
            <Field label="Class">
              <TextInput value={opts.className} onChange={(v) => patch({ className: v })} className="w-28 font-mono" />
            </Field>
            <Segmented
              label="Style"
              value={opts.style}
              onChange={(v) => patch({ style: v })}
              options={[
                { value: 'dataclass', label: 'dataclass' },
                { value: 'typeddict', label: 'TypedDict' },
              ]}
            />
            <Toggle checked={opts.typeImports} onChange={(v) => patch({ typeImports: v })} label="imports" />
          </OptionsBar>
        }
      />
    </ToolPage>
  );
}
