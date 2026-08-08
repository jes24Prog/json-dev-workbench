import { Search as SearchIcon, Database, GitBranch, KeyRound, Boxes, Ruler } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { ErrorBox } from '../../components/common/ErrorBox';
import { useDraft } from '../../stores/draftsStore';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';
import { parseJson } from '../../core/json/parse';
import { analyzeJson, findDeepestNodes } from '../../core/json/stats';
import { byteSize } from '../../core/json/format';
import { useState } from 'react';

export function ExplorerPage() {
  const { value, setValue } = useDraft('explorer');
  const [runSignal, setRunSignal] = useState(0);
  useRunShortcut(() => setRunSignal((n) => n + 1));
  const parsed = parseJson(value);
  const stats = parsed.ok ? analyzeJson(parsed.value) : analyzeJson({});
  const deepest = parsed.ok ? findDeepestNodes(parsed.value, 10) : [];

  const right = (
    <div className="h-full overflow-auto p-4">
      {!parsed.ok ? (
        <div>
          {value.trim() ? (
            <ErrorBox error={parsed.error} />
          ) : (
            <p className="text-xs text-muted">Paste JSON to inspect its structure.</p>
          )}
        </div>
      ) : (
        <div className="space-y-5" data-run={runSignal}>
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
              <Ruler className="h-3.5 w-3.5 text-accent" aria-hidden />
              Overview
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Root type" value={stats.rootType} />
              <Stat label="Total nodes" value={stats.totalNodes.toLocaleString()} />
              <Stat label="Max depth" value={String(stats.maxDepth)} />
              <Stat label="Memory estimate" value={formatBytes(stats.memoryEstimate)} />
              <Stat label="Input size" value={formatBytes(byteSize(value))} />
            </div>
          </div>
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
              <Boxes className="h-3.5 w-3.5 text-accent" aria-hidden />
              Node types
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat label="Objects" value={stats.objects.toLocaleString()} />
              <Stat label="Arrays" value={stats.arrays.toLocaleString()} />
              <Stat label="Strings" value={stats.strings.toLocaleString()} />
              <Stat label="Numbers" value={stats.numbers.toLocaleString()} />
              <Stat label="Booleans" value={stats.booleans.toLocaleString()} />
              <Stat label="Nulls" value={stats.nulls.toLocaleString()} />
            </div>
          </div>
          {stats.largestArrays.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
                <GitBranch className="h-3.5 w-3.5 text-accent" aria-hidden />
                Largest arrays
              </h3>
              <ul className="space-y-1">
                {stats.largestArrays.map((a) => (
                  <li key={a.path} className="flex justify-between gap-3 rounded bg-surface-2 px-2 py-1 font-mono text-[11px]">
                    <span className="truncate text-muted">{a.path}</span>
                    <span className="shrink-0 text-ink">{a.length}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {stats.largestObjects.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Database className="h-3.5 w-3.5 text-accent" aria-hidden />
                Largest objects
              </h3>
              <ul className="space-y-1">
                {stats.largestObjects.map((o) => (
                  <li key={o.path} className="flex justify-between gap-3 rounded bg-surface-2 px-2 py-1 font-mono text-[11px]">
                    <span className="truncate text-muted">{o.path}</span>
                    <span className="shrink-0 text-ink">{o.keys} keys</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {stats.duplicateKeys.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
                <KeyRound className="h-3.5 w-3.5 text-accent" aria-hidden />
                Duplicate keys across documents
              </h3>
              <ul className="space-y-1">
                {stats.duplicateKeys.map((d) => (
                  <li key={d.key + d.occurrences} className="rounded bg-surface-2 px-2 py-1 font-mono text-[11px]">
                    <span className="text-ink">"{d.key}"</span>
                    <span className="ml-1 text-muted">× {d.occurrences}</span>
                    {d.paths.length > 0 && (
                      <span className="ml-2 block truncate text-muted">{d.paths.join(' · ')}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {deepest.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
                <SearchIcon className="h-3.5 w-3.5 text-accent" aria-hidden />
                Deepest nodes
              </h3>
              <ul className="space-y-1">
                {deepest.slice(0, 5).map((d) => (
                  <li key={d.path} className="flex justify-between gap-3 rounded bg-surface-2 px-2 py-1 font-mono text-[11px]">
                    <span className="truncate text-muted">{d.path}</span>
                    <span className="shrink-0 text-ink">{d.depth}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <ToolPage title="JSON Explorer" description="Statistics and structure overview" icon={SearchIcon}>
      <SplitPane
        left={
          <JsonInputPanel
            value={value}
            onChange={setValue}
            label="Input"
            placeholder='Paste JSON, e.g. {"hello": "world"}'
          />
        }
        right={right}
        leftLabel="Input"
        rightLabel="Structure"
        initialRatio={0.45}
      />
    </ToolPage>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-edge bg-surface px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
