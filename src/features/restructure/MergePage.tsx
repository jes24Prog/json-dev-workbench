import { useState } from 'react';
import { GitMerge, Play } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { CodeOutput } from '../../components/common/CodeOutput';
import { OptionsBar, Segmented, Field, Toggle } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';
import { useHistoryStore } from '../../stores/historyStore';
import { parseJson } from '../../core/json/parse';
import { deepMerge, shallowMerge, type ArrayMergeStrategy, type ConflictStrategy } from '../../core/merge';
import { stringifyJson } from '../../core/json/format';
import type { JsonValue } from '../../types/json';

export function MergePage() {
  const { value: left, setValue: setLeft } = useDraft('merge-left');
  const { value: right, setValue: setRight } = useDraft('merge-right');
  const addHistory = useHistoryStore((s) => s.add);
  const historyEnabled = useHistoryStore((s) => s.enabled);

  const [arrays, setArrays] = useState<ArrayMergeStrategy>('append');
  const [conflict, setConflict] = useState<ConflictStrategy>('last-wins');
  const [shallow, setShallow] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const run = () => {
    const a = parseJson(left);
    const b = parseJson(right);
    if (!a.ok) {
      setError(`Left input: ${a.error.message}`);
      setOutput('');
      return;
    }
    if (!b.ok) {
      setError(`Right input: ${b.error.message}`);
      setOutput('');
      return;
    }
    setError(null);
    const result = shallow
      ? shallowMerge(a.value, b.value)
      : deepMerge(a.value, b.value, { arrays, conflict });
    if (!result.ok) {
      setOutput('');
      setError(result.error ?? 'Merge failed.');
    } else {
      const text = stringifyJson(result.result as JsonValue, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false });
      setOutput(text);
    }
    setConflicts(result.conflicts.map((c) => `${c.path}: left=${JSON.stringify(c.left)} right=${JSON.stringify(c.right)}`));
    if (historyEnabled) {
      void addHistory({
        tool: 'merge',
        toolLabel: 'Merge',
        input: `LEFT:\n${left}\n\nRIGHT:\n${right}`,
        output,
        settings: JSON.stringify({ arrays, conflict, shallow }),
      });
    }
  };

  useRunShortcut(run);

  return (
    <ToolPage
      title="Merge"
      description="Combine two JSON documents with conflict handling"
      icon={GitMerge}
      actions={
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={run} type="button">
          <Play className="h-3 w-3" aria-hidden />
          Merge
        </button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <OptionsBar>
          <Segmented
            label="Arrays"
            value={arrays}
            onChange={setArrays}
            options={[
              { value: 'append', label: 'Append' },
              { value: 'overwrite', label: 'Overwrite' },
              { value: 'unique', label: 'Unique' },
            ]}
          />
          <Segmented
            label="Conflicts"
            value={conflict}
            onChange={setConflict}
            options={[
              { value: 'last-wins', label: 'Right wins' },
              { value: 'first-wins', label: 'Left wins' },
              { value: 'error', label: 'Fail on conflict' },
            ]}
          />
          <Toggle checked={shallow} onChange={setShallow} label="Shallow merge" />
          <Field label="Mode">
            <span className="text-[11px] text-muted">{shallow ? 'Top-level keys only' : `Deep merge (max depth) — ${conflict === 'error' ? 'conflicts abort' : 'conflicts resolved'}`}</span>
          </Field>
        </OptionsBar>
        <div className="min-h-0 flex-1">
          <SplitPane
            left={
              <div className="flex h-full min-h-0 flex-col">
                <SplitPane
                  left={<Editor value={left} onChange={setLeft} label="Document A" placeholder='{"name": "Ada", "skills": ["json"]}' />}
                  right={<Editor value={right} onChange={setRight} label="Document B" placeholder='{"name": "Grace", "skills": ["compiler"]}' />}
                  initialRatio={0.5}
                  orientation="vertical"
                />
              </div>
            }
            right={
              <div className="flex h-full min-h-0 flex-col">
                {error && (
                  <div className="border-b border-edge px-4 py-3">
                    <div className="rounded-md border border-error/30 bg-error/5 px-3 py-2 font-mono text-xs text-error">{error}</div>
                  </div>
                )}
                {conflicts.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border-b border-edge px-4 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted">Conflicts ({conflicts.length})</div>
                    {conflicts.map((c, i) => (
                      <div key={i} className="truncate font-mono text-[11px] text-amber-400" title={c}>
                        {c}
                      </div>
                    ))}
                  </div>
                )}
                <CodeOutput value={output} language="json" filename="merged.json" emptyText="Merge the documents to combine them here." />
              </div>
            }
            leftLabel="Inputs"
            rightLabel="Merged result"
            initialRatio={0.55}
          />
        </div>
      </div>
    </ToolPage>
  );
}

function Editor({ value, onChange, label, placeholder }: { value: string; onChange: (v: string) => void; label: string; placeholder: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-edge px-2 py-1">
        <span className="text-[10px] uppercase tracking-wide text-muted">{label}</span>
      </div>
      <textarea
        className="code-scroll min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-[12.5px] leading-relaxed text-ink outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
}
