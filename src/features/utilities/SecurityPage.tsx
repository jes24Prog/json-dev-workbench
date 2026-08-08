import { useState } from 'react';
import { ShieldCheck, Play } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { OptionsBar } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';
import { parseJson } from '../../core/json/parse';
import { analyzeSecurity, type SecurityFinding, type Severity } from '../../core/security';

const SEVERITY_STYLES: Record<Severity, string> = {
  CRITICAL: 'bg-error/15 text-error',
  WARNING: 'bg-amber-500/15 text-amber-400',
  INFO: 'bg-surface-3 text-muted',
};

export function SecurityPage() {
  const { value, setValue } = useDraft('security');
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [score, setScore] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const parsed = parseJson(value);
    if (!parsed.ok) {
      setError(parsed.error.message);
      setFindings([]);
      return;
    }
    setError(null);
    const analysis = analyzeSecurity(parsed.value, value.length);
    setFindings(analysis.findings);
    setScore(analysis.score);
  };

  useRunShortcut(run);

  return (
    <ToolPage
      title="Security Analysis"
      description="Assess the security posture of a JSON document"
      icon={ShieldCheck}
      actions={
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={run} type="button">
          <Play className="h-3 w-3" aria-hidden />
          Analyze
        </button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <OptionsBar>
          <span className="text-[11px] text-muted">
            {findings.length === 0 && !error ? 'Analyze for secrets, prototype pollution, depth and payload risks.' : `${findings.length} finding${findings.length === 1 ? '' : 's'}`}
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
                {!error && findings.length === 0 && (
                  <div className="flex h-full items-center justify-center text-xs text-muted">
                    Run an analysis to see the security posture.
                  </div>
                )}
                {!error && findings.length > 0 && (
                  <>
                    <div className="mb-3 flex items-center gap-3 rounded-md border border-edge bg-surface px-3 py-2">
                      <span className="text-xs text-muted">Security score</span>
                      <div className="h-2 w-40 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className={`h-full rounded-full ${score >= 80 ? 'bg-success' : score >= 50 ? 'bg-amber-400' : 'bg-error'}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold ${score >= 80 ? 'text-success' : score >= 50 ? 'text-amber-400' : 'text-error'}`}>{score}/100</span>
                    </div>
                    {findings.map((f, i) => (
                      <div key={i} className="mb-2 rounded-md border border-edge bg-surface px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SEVERITY_STYLES[f.severity]}`}>{f.severity}</span>
                          <span className="text-[11px] font-medium text-ink">{f.category}</span>
                        </div>
                        <div className="mt-1 text-xs text-ink">{f.message}</div>
                        {f.path && (
                          <div className="mt-1 font-mono text-[11px] text-muted">
                            {f.path}
                            {f.pointer ? `  (${f.pointer})` : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
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
