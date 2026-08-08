import { useState } from 'react';
import { CornerDownLeft, Copy } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { ErrorBox } from '../../components/common/ErrorBox';
import { TextInput } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { useCopy } from '../../hooks/useClipboard';
import { parseJson } from '../../core/json/parse';
import { stringifyJson } from '../../core/json/format';
import { resolvePointer, fromJsonPointer } from '../../core/json/path';
import type { JsonValue } from '../../types/json';

export function PointerPage() {
  const { value, setValue } = useDraft('pointer');
  const { copy } = useCopy();
  const [pointer, setPointer] = useState('/users/0/name');

  const parsed = parseJson(value);
  let resolved: { ok: true; value: JsonValue } | { ok: false; reason: string } | null = null;
  if (parsed.ok) {
    const valueAt = resolvePointer(parsed.value, pointer);
    if (valueAt !== undefined) resolved = { ok: true, value: valueAt };
    else resolved = { ok: false, reason: `No value found at "${pointer}".` };
  }

  const segments = pointer.trim() === '' ? [] : fromJsonPointer(pointer);

  const right = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-edge px-3 py-2">
        <div className="flex items-center gap-2">
          <CornerDownLeft className="h-3.5 w-3.5 text-accent" aria-hidden />
          <TextInput value={pointer} onChange={setPointer} placeholder="/users/0/name" className="flex-1 font-mono" />
          <button className="toolbar-btn" type="button" onClick={() => copy(pointer, 'Pointer copied')}>
            <Copy className="h-3 w-3" aria-hidden />
          </button>
        </div>
        {segments.length > 0 && (
          <p className="mt-1 font-mono text-[11px] text-muted">
            Segments: [{segments.map((s) => `'${s}'`).join(', ')}]
          </p>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {!parsed.ok ? (
          value.trim() ? (
            <ErrorBox error={parsed.error} />
          ) : (
            <p className="text-xs text-muted">Paste JSON to resolve a JSON Pointer (RFC 6901).</p>
          )
        ) : resolved?.ok ? (
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-muted">Resolved value</p>
            <pre className="rounded-md bg-surface-2 p-3 font-mono text-[12px] text-ink">
              {stringifyJson(resolved.value, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false })}
            </pre>
          </div>
        ) : (
          <div>
            <ErrorBox error={{ message: resolved?.reason ?? 'Could not resolve pointer.', line: 0, column: 0, offset: 0, category: 'UNEXPECTED_TOKEN' }} />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ToolPage title="JSON Pointer" description="RFC 6901 pointer resolution" icon={CornerDownLeft}>
      <SplitPane
        left={<JsonInputPanel value={value} onChange={setValue} label="Input" placeholder='{"users": [{"name": "Ada"}]}' />}
        right={right}
        leftLabel="Input"
        rightLabel="Resolution"
        initialRatio={0.45}
      />
    </ToolPage>
  );
}
