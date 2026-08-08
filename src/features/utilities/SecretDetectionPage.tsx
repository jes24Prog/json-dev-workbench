import { useState } from 'react';
import { ShieldAlert, Play, Copy } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { OptionsBar } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';
import { useCopy } from '../../hooks/useClipboard';
import { parseJson } from '../../core/json/parse';
import { detectSecrets } from '../../core/security';
import type { SecretMatch } from '../../core/security';

export function SecretDetectionPage() {
  const { value, setValue } = useDraft('secret-detection');
  const { copy } = useCopy();
  const [results, setResults] = useState<SecretMatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const parsed = parseJson(value);
    if (!parsed.ok) {
      setError(parsed.error.message);
      setResults([]);
      return;
    }
    setError(null);
    setResults(detectSecrets(parsed.value));
  };

  useRunShortcut(run);

  return (
    <ToolPage
      title="Secret Detection"
      description="Find API keys, tokens and passwords in JSON"
      icon={ShieldAlert}
      actions={
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={run} type="button">
          <Play className="h-3 w-3" aria-hidden />
          Scan
        </button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <OptionsBar>
          <span className="text-[11px] text-muted">
            {results.length === 0 && !error
              ? 'Scan your document for credentials, keys and tokens.'
              : `${results.length} potential secret${results.length === 1 ? '' : 's'} found`}
          </span>
        </OptionsBar>
        <div className="min-h-0 flex-1">
          <SplitPane
            left={<JsonInputPanel value={value} onChange={setValue} label="Input JSON" />}
            right={
              <div className="code-scroll min-h-0 flex-1 overflow-y-auto p-3">
                {error && (
                  <div className="mb-3 rounded-md border border-error/30 bg-error/5 px-3 py-2 font-mono text-xs text-error">{error}</div>
                )}
                {!error && results.length === 0 && (
                  <div className="flex h-full items-center justify-center text-xs text-muted">
                    No secrets detected. Run a scan to verify.
                  </div>
                )}
                {results.map((r, i) => (
                  <div key={i} className="mb-2 rounded-md border border-edge bg-surface px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-error/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-error">{r.type}</span>
                      <button className="toolbar-btn" onClick={() => copy(r.match, 'Secret copied')} type="button">
                        <Copy className="h-3 w-3" aria-hidden />
                        Copy
                      </button>
                    </div>
                    <div className="mt-1.5 font-mono text-xs text-ink">{r.match}</div>
                    <div className="mt-1 font-mono text-[11px] text-muted">
                      path: {r.path}
                      <br />
                      pointer: {r.pointer}
                    </div>
                  </div>
                ))}
              </div>
            }
            leftLabel="Input"
            rightLabel="Findings"
            initialRatio={0.45}
          />
        </div>
      </div>
    </ToolPage>
  );
}
