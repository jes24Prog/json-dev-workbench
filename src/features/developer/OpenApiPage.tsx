import { useState } from 'react';
import { FileJson2 } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { ToolRunner } from '../../components/common/ToolRunner';
import { OptionsBar, TextInput, Field } from '../../components/common/controls';
import { generateOpenApiSchemas, type OpenApiGenOptions } from '../../core/generators/openapi';
import { runGenerator } from './runGenerator';

export function OpenApiPage() {
  const [opts, setOpts] = useState<OpenApiGenOptions>({ title: 'Generated API', version: '1.0.0', modelName: 'Model' });
  const patch = (p: Partial<OpenApiGenOptions>) => setOpts((o) => ({ ...o, ...p }));

  return (
    <ToolPage title="JSON → OpenAPI" description="Generate OpenAPI schema objects" icon={FileJson2}>
      <ToolRunner
        toolId="openapi"
        toolLabel="OpenAPI Generator"
        compute={(input) => runGenerator(input, (v) => generateOpenApiSchemas(v, opts))}
        runOnChange
        runKey={opts}
        outputLanguage="text"
        recordSettings={() => JSON.stringify(opts)}
        options={
          <OptionsBar>
            <Field label="Title">
              <TextInput value={opts.title} onChange={(v) => patch({ title: v })} className="w-40" />
            </Field>
            <Field label="Version">
              <TextInput value={opts.version} onChange={(v) => patch({ version: v })} className="w-24 font-mono" />
            </Field>
            <Field label="Model name">
              <TextInput value={opts.modelName} onChange={(v) => patch({ modelName: v })} className="w-28 font-mono" />
            </Field>
          </OptionsBar>
        }
      />
    </ToolPage>
  );
}
