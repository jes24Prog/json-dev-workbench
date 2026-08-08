import { useState } from 'react';
import { CheckCircle2, Copy } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { ErrorBox, SuccessBadge } from '../../components/common/ErrorBox';
import { OptionsBar, Select, Toggle } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { useCopy } from '../../hooks/useClipboard';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';
import { parseJson } from '../../core/json/parse';
import { validateWithSchema } from '../../core/schema/validate';
import type { SchemaValidateOptions } from '../../core/schema/validate';

const DEFAULT_OPTS: SchemaValidateOptions = {
  draft: 'draft-07',
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
};

export function SchemaValidatorPage() {
  const instance = useDraft('schema-validator-instance');
  const schema = useDraft('schema-validator-schema');
  const { copy } = useCopy();
  const [opts, setOpts] = useState<SchemaValidateOptions>(DEFAULT_OPTS);
  const [result, setResult] = useState<ReturnType<typeof validateWithSchema> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    const i = parseJson(instance.value);
    const s = parseJson(schema.value);
    if (!i.ok) return setError(`Instance: ${i.error.message}`);
    if (!s.ok) return setError(`Schema: ${s.error.message}`);
    setResult(validateWithSchema(i.value, s.value, opts));
  };

  useRunShortcut(run);

  const left = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 border-b border-edge">
        <JsonInputPanel value={instance.value} onChange={instance.setValue} label="JSON instance" placeholder='{"name": "Ada", "age": 37}' />
      </div>
      <div className="min-h-0 flex-1">
        <JsonInputPanel
          value={schema.value}
          onChange={schema.setValue}
          label="JSON Schema"
          placeholder='{"type": "object", "properties": {"name": {"type": "string"}}}'
        />
      </div>
    </div>
  );

  const right = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 items-center gap-2 border-b border-edge px-3">
        {result &&
          (result.valid ? (
            <SuccessBadge>Valid against schema</SuccessBadge>
          ) : (
            <span className="rounded-full border border-red-600/40 bg-red-600/10 px-2 py-0.5 text-xs font-medium text-red-500">
              {result.issues.length} issue{result.issues.length === 1 ? '' : 's'}
            </span>
          ))}
        {error && <span className="text-xs text-red-500">{error}</span>}
        <span className="ml-auto text-[10px] text-muted">Ctrl+Enter to validate</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {result && !result.valid && result.issues.length > 0 && (
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-surface-2 text-[10px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-1.5">Path</th>
                <th className="px-3 py-1.5">Keyword</th>
                <th className="px-3 py-1.5">Message</th>
              </tr>
            </thead>
            <tbody>
              {result.issues.map((iss, i) => (
                <tr key={i} className="border-t border-edge align-top hover:bg-surface">
                  <td className="px-3 py-1 font-mono text-[11px] text-accent">{iss.path}</td>
                  <td className="px-3 py-1 font-mono text-[11px] text-ink">{iss.keyword}</td>
                  <td className="max-w-[280px] px-3 py-1 text-[11px] text-muted">{iss.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {result && result.errorText && (
          <div className="p-4">
            <ErrorBox error={{ message: result.errorText, line: 0, column: 0, offset: 0, category: 'UNEXPECTED_TOKEN' }} />
          </div>
        )}
        {result && result.valid && (
          <div className="p-4 text-xs text-muted">The instance satisfies every constraint in the schema.</div>
        )}
        {!result && !error && <div className="p-4 text-xs text-muted">Paste an instance and a schema, then press Validate.</div>}
      </div>
      {result && result.issues.length > 0 && (
        <div className="border-t border-edge px-3 py-2">
          <button
            className="toolbar-btn"
            type="button"
            onClick={() => copy(result.issues.map((i) => `${i.path}: ${i.message}`).join('\n'), 'Issues copied')}
          >
            <Copy className="h-3 w-3" aria-hidden />
            Copy issues
          </button>
        </div>
      )}
    </div>
  );

  return (
    <ToolPage title="Schema Validator" description="Validate JSON against a schema" icon={CheckCircle2}>
      <OptionsBar>
        <Select
          label="Draft"
          value={opts.draft}
          onChange={(draft) => setOpts((o) => ({ ...o, draft }))}
          options={[
            { value: 'draft-07', label: 'Draft 7' },
            { value: '2020-12', label: '2020-12' },
          ]}
        />
        <Toggle checked={opts.coerceTypes} onChange={(coerceTypes) => setOpts((o) => ({ ...o, coerceTypes }))} label="Coerce types" />
        <Toggle checked={opts.useDefaults} onChange={(useDefaults) => setOpts((o) => ({ ...o, useDefaults }))} label="Apply defaults" />
        <Toggle checked={opts.removeAdditional} onChange={(removeAdditional) => setOpts((o) => ({ ...o, removeAdditional }))} label="Remove additional" />
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={run} type="button">
          Validate
        </button>
      </OptionsBar>
      <div className="min-h-0 flex-1">
        <SplitPane left={left} right={right} leftLabel="Input" rightLabel="Result" initialRatio={0.5} />
      </div>
    </ToolPage>
  );
}
