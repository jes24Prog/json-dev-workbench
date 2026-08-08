import { useState } from 'react';
import { Minimize2 } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { ToolRunner } from '../../components/common/ToolRunner';
import { OptionsBar, Toggle } from '../../components/common/controls';
import { minifyJsonText, computeMinifyStats } from '../../core/json/format';

export function MinifierPage() {
  const [escapeUnicode, setEscapeUnicode] = useState(false);

  return (
    <ToolPage title="Minifier" description="Compact JSON and size statistics" icon={Minimize2}>
      <ToolRunner
        toolId="minifier"
        toolLabel="Minifier"
        compute={(input) => {
          const result = minifyJsonText(input, { escapeUnicode });
          if (!result.ok) return { ok: false, error: result.error ?? 'Invalid JSON.' };
          return { ok: true, output: result.output ?? '' };
        }}
        worker={{
          type: 'minify',
          toPayload: (input) => ({ text: input, escapeUnicode }),
          fromData: (d) => ({ ok: true, output: (d as { output: string }).output }),
        }}
        runOnChange
        runKey={escapeUnicode}
        recordSettings={() => JSON.stringify({ escapeUnicode })}
        resultMeta={(output, input) => {
          const stats = computeMinifyStats(input, output);
          return `Original ${formatBytes(stats.originalBytes)} → Minified ${formatBytes(stats.minifiedBytes)} (${stats.percentReduction.toFixed(1)}% smaller)`;
        }}
        options={
          <OptionsBar>
            <Toggle checked={escapeUnicode} onChange={setEscapeUnicode} label="Escape Unicode" />
          </OptionsBar>
        }
      />
    </ToolPage>
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
