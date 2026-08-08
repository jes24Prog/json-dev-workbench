import { useState } from 'react';
import { Braces } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { ToolRunner } from '../../components/common/ToolRunner';
import { OptionsBar, Select, Toggle } from '../../components/common/controls';
import {
  DEFAULT_FORMAT_OPTIONS,
  formatJsonText,
  type FormatOptions,
  type Indentation,
} from '../../core/json/format';

export function FormatterPage() {
  const [opts, setOpts] = useState<FormatOptions>(DEFAULT_FORMAT_OPTIONS);

  const patch = (p: Partial<FormatOptions>) => setOpts((o) => ({ ...o, ...p }));

  return (
    <ToolPage title="Formatter" description="Pretty-print JSON with full control" icon={Braces}>
      <ToolRunner
        toolId="formatter"
        toolLabel="Formatter"
        compute={(input) => {
          const result = formatJsonText(input, opts);
          if (!result.ok) return { ok: false, error: result.error ?? 'Invalid JSON.' };
          return { ok: true, output: result.output ?? '' };
        }}
        worker={{
          type: 'format',
          toPayload: (input) => ({ text: input, options: opts }),
          fromData: (d) => ({ ok: true, output: (d as { output: string }).output }),
        }}
        runOnChange
        runKey={opts}
        recordSettings={() => JSON.stringify(opts)}
        options={
          <OptionsBar>
            <Select<Indentation>
              label="Indentation"
              value={opts.indentation}
              onChange={(v) => patch({ indentation: v })}
              options={[
                { value: 2, label: '2 spaces' },
                { value: 4, label: '4 spaces' },
                { value: 'tab', label: 'Tab' },
                { value: 'none', label: 'None (compact)' },
              ]}
            />
            <Toggle checked={opts.sortKeys} onChange={(v) => patch({ sortKeys: v })} label="Sort keys" />
            <Toggle checked={opts.sortArrays} onChange={(v) => patch({ sortArrays: v })} label="Sort arrays" />
            <Toggle checked={opts.escapeUnicode} onChange={(v) => patch({ escapeUnicode: v })} label="Escape Unicode" />
          </OptionsBar>
        }
      />
    </ToolPage>
  );
}
