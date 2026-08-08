import { useState } from 'react';
import { Filter, Play } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { OptionsBar, TextInput, Field, Toggle } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';

const MAX_MATCHES = 500;
const MAX_TEXT = 100000;

interface MatchRow {
  index: number;
  text: string;
  groups: string[];
}

export function RegexPage() {
  const { value, setValue } = useDraft('regex-text');
  const { value: pattern, setValue: setPattern } = useDraft('regex-pattern');
  const [flagG, setFlagG] = useState(true);
  const [flagI, setFlagI] = useState(false);
  const [flagM, setFlagM] = useState(false);
  const [flagS, setFlagS] = useState(false);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    if (!pattern) {
      setError('Enter a regular expression pattern.');
      setMatches([]);
      return;
    }
    if (value.length > MAX_TEXT) {
      setError(`Input is too large (max ${MAX_TEXT.toLocaleString()} characters for testing).`);
      setMatches([]);
      return;
    }
    let flags = '';
    if (flagG) flags += 'g';
    if (flagI) flags += 'i';
    if (flagM) flags += 'm';
    if (flagS) flags += 's';
    try {
      const re = new RegExp(pattern, flags);
      const rows: MatchRow[] = [];
      const iterator = value.matchAll(re);
      for (const m of iterator) {
        rows.push({
          index: m.index ?? 0,
          text: m[0],
          groups: m.slice(1).map((g) => g ?? ''),
        });
        if (rows.length >= MAX_MATCHES) break;
      }
      setMatches(rows);
      setError(rows.length === 0 ? 'No matches found.' : null);
    } catch (err) {
      setError(err instanceof Error ? `Invalid pattern: ${err.message}` : 'Invalid regular expression.');
      setMatches([]);
    }
  };

  useRunShortcut(run);

  return (
    <ToolPage
      title="Regex Tester"
      description="Test regular expressions against text"
      icon={Filter}
      actions={
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={run} type="button">
          <Play className="h-3 w-3" aria-hidden />
          Test
        </button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <OptionsBar>
          <Field label="Pattern">
            <TextInput value={pattern} onChange={setPattern} placeholder="\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b" className="w-96 font-mono" />
          </Field>
          <Toggle checked={flagG} onChange={setFlagG} label="g" />
          <Toggle checked={flagI} onChange={setFlagI} label="i" />
          <Toggle checked={flagM} onChange={setFlagM} label="m" />
          <Toggle checked={flagS} onChange={setFlagS} label="s" />
          <span className="text-[11px] text-muted">
            {matches.length === 0 ? 'Run the test to see matches.' : `${matches.length} match${matches.length === 1 ? '' : 'es'}`}
          </span>
        </OptionsBar>
        <div className="min-h-0 flex-1">
          <SplitPane
            left={<JsonInputPanel value={value} onChange={setValue} label="Test text" language="text" placeholder="Paste text to search…" />}
            right={
              <div className="code-scroll min-h-0 flex-1 overflow-y-auto p-3">
                {error && (
                  <div className={`mb-3 rounded-md border px-3 py-2 font-mono text-xs ${matches.length === 0 ? 'border-error/30 bg-error/5 text-error' : 'border-edge bg-surface text-muted'}`}>{error}</div>
                )}
                {matches.length === 0 && !error && (
                  <div className="flex h-full items-center justify-center text-xs text-muted">Matches will appear here.</div>
                )}
                {matches.map((m, i) => (
                  <div key={i} className="mb-2 rounded-md border border-edge bg-surface px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-muted">match #{i + 1} · index {m.index}</span>
                    </div>
                    <div className="mt-1 break-all font-mono text-xs text-ink">{m.text}</div>
                    {m.groups.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {m.groups.map((g, gi) => (
                          <div key={gi} className="font-mono text-[11px] text-muted">
                            group {gi + 1}: {g === '' ? '(empty)' : g}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            }
            leftLabel="Text"
            rightLabel="Matches"
            initialRatio={0.45}
          />
        </div>
      </div>
    </ToolPage>
  );
}
