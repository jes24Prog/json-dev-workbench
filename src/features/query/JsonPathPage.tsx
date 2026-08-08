import { useState } from 'react';
import { CornerDownLeft, Copy } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { ErrorBox } from '../../components/common/ErrorBox';
import { TextInput } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { useCopy } from '../../hooks/useClipboard';
import { useHistoryStore } from '../../stores/historyStore';
import { parseJson } from '../../core/json/parse';
import { stringifyJson } from '../../core/json/format';
import { queryJsonPath, EXAMPLE_QUERIES } from '../../core/jsonpath';

export function JsonPathPage() {
  const { value, setValue } = useDraft('jsonpath');
  const { copy } = useCopy();
  const addHistory = useHistoryStore((s) => s.add);
  const historyEnabled = useHistoryStore((s) => s.enabled);
  const [expr, setExpr] = useState('$.users[*].name');

  const parsed = parseJson(value);
  const result = parsed.ok ? queryJsonPath(parsed.value, expr) : null;

  const record = () => {
    if (result?.ok && historyEnabled) {
      void addHistory({
        tool: 'jsonpath',
        toolLabel: 'JSONPath',
        input: value,
        output: `${result.count} match${result.count === 1 ? '' : 'es'}`,
        settings: JSON.stringify({ expression: expr }),
      });
    }
  };

  const right = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-edge px-3 py-2">
        <div className="flex items-center gap-2">
          <CornerDownLeft className="h-3.5 w-3.5 text-accent" aria-hidden />
          <TextInput value={expr} onChange={setExpr} placeholder="$.users[*].name" className="flex-1 font-mono" />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLE_QUERIES.map((q) => (
            <button key={q.query} className="chip" type="button" onClick={() => setExpr(q.query)} title={q.query}>
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-b border-edge px-3 py-1">
        <span className="text-[11px] text-muted">
          {result?.ok ? `${result.count} match${result.count === 1 ? '' : 'es'}` : 'Expression error'}
        </span>
        <button className="toolbar-btn" onClick={record} type="button" disabled={!result?.ok}>
          Record result
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {result?.ok ? (
          <div className="space-y-1">
            {result.matches && result.matches.map((m, i) => (
              <div key={i} className="group flex items-start gap-2 rounded bg-surface px-2 py-1.5">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] text-accent">{m.pointer}</p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-muted">{m.path}</p>
                  <pre className="mt-1 max-h-40 overflow-auto font-mono text-[11px] text-ink">
                    {stringifyJson(m.value, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false })}
                  </pre>
                </div>
                <button className="icon-btn opacity-0 group-hover:opacity-100" type="button" title="Copy pointer" onClick={() => copy(m.pointer, 'Path copied')}>
                  <Copy className="h-3 w-3" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        ) : result ? (
          <ErrorBox error={{ message: result.error ?? 'Invalid expression.', line: 0, column: 0, offset: 0, category: 'UNEXPECTED_TOKEN' }} />
        ) : (
          <p className="p-2 text-xs text-muted">{value.trim() ? 'Enter a JSONPath expression.' : 'Paste JSON and enter a JSONPath expression.'}</p>
        )}
      </div>
    </div>
  );

  return (
    <ToolPage title="JSONPath" description="Query JSON with JSONPath expressions" icon={CornerDownLeft}>
      <SplitPane
        left={<JsonInputPanel value={value} onChange={setValue} label="Input" placeholder='Paste JSON, e.g. {"users": [{"name": "Ada"}]}' />}
        right={right}
        leftLabel="Input"
        rightLabel="Query"
        initialRatio={0.42}
      />
    </ToolPage>
  );
}
