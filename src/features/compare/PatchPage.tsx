import { useState } from 'react';
import { ClipboardType } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { ErrorBox } from '../../components/common/ErrorBox';
import { OptionsBar, Segmented } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';
import { parseJson } from '../../core/json/parse';
import { stringifyJson } from '../../core/json/format';
import { validatePatch, applyPatch, generatePatch, applyMergePatch } from '../../core/jsonpatch';
import type { PatchOp } from '../../core/jsonpatch';
import type { JsonValue } from '../../types/json';

type Mode = 'apply' | 'generate' | 'mergepatch';

export function PatchPage() {
  const doc = useDraft('patch-doc');
  const patch = useDraft('patch-patch');
  const [mode, setMode] = useState<Mode>('apply');

  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<string>('');

  const run = () => {
    setError(null);
    if (mode === 'generate') {
      const l = parseJson(doc.value);
      const r = parseJson(patch.value);
      if (!l.ok) return setError(`Left input: ${l.error.message}`);
      if (!r.ok) return setError(`Right input: ${r.error.message}`);
      const { patch: ops, equal } = generatePatch(l.value, r.value);
      setOutput(stringifyJson(ops as unknown as JsonValue, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false }));
      setMeta(equal ? 'Documents are identical — no patch generated.' : `${ops.length} patch operation${ops.length === 1 ? '' : 's'}`);
      return;
    }

    if (mode === 'mergepatch') {
      const d = parseJson(doc.value);
      const p = parseJson(patch.value);
      if (!d.ok) return setError(`Document: ${d.error.message}`);
      if (!p.ok) return setError(`Merge patch: ${p.error.message}`);
      const merged = applyMergePatch(d.value, p.value);
      setOutput(stringifyJson(merged, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false }));
      setMeta('RFC 7386 merge patch applied.');
      return;
    }

    // apply mode
    const d = parseJson(doc.value);
    const p = parseJson(patch.value);
    if (!d.ok) return setError(`Document: ${d.error.message}`);
    if (!p.ok) return setError(`Patch: ${p.error.message}`);
    if (!Array.isArray(p.value)) {
      return setError('Patch must be a JSON array of RFC 6902 operations.');
    }
    const ops = p.value as unknown as PatchOp[];
    const valid = validatePatch(ops);
    if (!valid.ok) return setError(valid.error ?? 'Invalid patch.');
    const applied = applyPatch(d.value, ops);
    if (!applied.ok) return setError(applied.error ?? 'Could not apply patch.');
    setOutput(stringifyJson(applied.value ?? null, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false }));
    setMeta('RFC 6902 patch applied successfully.');
  };

  useRunShortcut(run);

  const left = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 border-b border-edge">
        <JsonInputPanel value={doc.value} onChange={doc.setValue} label={mode === 'generate' ? 'Left document' : 'Target document'} placeholder='{"name": "Ada"}' />
      </div>
      <div className="min-h-0 flex-1">
        <JsonInputPanel
          value={patch.value}
          onChange={patch.setValue}
          label={mode === 'generate' ? 'Right document' : mode === 'mergepatch' ? 'Merge patch' : 'RFC 6902 patch'}
          placeholder={mode === 'generate' ? '{"name": "Grace"}' : '[{"op": "replace", "path": "/name", "value": "Grace"}]'}
        />
      </div>
    </div>
  );

  const right = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 items-center justify-between gap-2 border-b border-edge px-3">
        <span className="text-[10px] uppercase tracking-wide text-muted">Result</span>
        {meta && <span className="truncate text-[11px] text-muted">{meta}</span>}
      </div>
      {error ? (
        <div className="border-b border-edge px-4 py-3">
          <ErrorBox error={{ message: error, line: 0, column: 0, offset: 0, category: 'UNEXPECTED_TOKEN' }} />
        </div>
      ) : null}
      <div className="code-scroll min-h-0 flex-1 overflow-auto p-3">
        <pre className="font-mono text-[12px] text-ink">{output || 'Run the operation to see the result (Ctrl+Enter).'}</pre>
      </div>
    </div>
  );

  return (
    <ToolPage title="JSON Patch" description="RFC 6902 patch and merge patch" icon={ClipboardType}>
      <OptionsBar>
        <Segmented<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'apply', label: 'Apply patch' },
            { value: 'generate', label: 'Generate patch' },
            { value: 'mergepatch', label: 'Merge patch' },
          ]}
        />
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={run} type="button">
          Run
        </button>
      </OptionsBar>
      <div className="min-h-0 flex-1">
        <SplitPane left={left} right={right} leftLabel="Input" rightLabel="Output" initialRatio={0.55} />
      </div>
    </ToolPage>
  );
}
