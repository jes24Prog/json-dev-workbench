import { useState } from 'react';
import { Search as SearchIcon, Copy } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { OptionsBar, Select, Segmented, Toggle, TextInput } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { useCopy } from '../../hooks/useClipboard';
import { useHistoryStore } from '../../stores/historyStore';
import { parseJson } from '../../core/json/parse';
import { searchJson, type SearchOptions } from '../../core/json/search';

export function SearchPage() {
  const { value, setValue } = useDraft('search');
  const { copy } = useCopy();
  const addHistory = useHistoryStore((s) => s.add);
  const historyEnabled = useHistoryStore((s) => s.enabled);

  const [query, setQuery] = useState('');
  const [opts, setOpts] = useState<SearchOptions>({ mode: 'both', caseSensitive: false, matchType: 'contains' });

  const parsed = parseJson(value);
  const results = parsed.ok && query ? searchJson(parsed.value, query, opts) : null;

  const record = () => {
    if (results && results.total > 0 && historyEnabled) {
      void addHistory({
        tool: 'search',
        toolLabel: 'Search',
        input: value,
        output: `${results.total} match${results.total === 1 ? '' : 'es'}`,
        settings: JSON.stringify({ query, ...opts }),
      });
    }
  };

  const right = (
    <div className="flex h-full min-h-0 flex-col">
      <OptionsBar>
        <TextInput value={query} onChange={setQuery} placeholder="Search term…" className="w-56" />
        <Segmented
          value={opts.mode}
          onChange={(mode) => setOpts((o) => ({ ...o, mode }))}
          options={[
            { value: 'both', label: 'Both' },
            { value: 'key', label: 'Keys' },
            { value: 'value', label: 'Values' },
          ]}
        />
        <Select
          value={opts.matchType}
          onChange={(matchType) => setOpts((o) => ({ ...o, matchType }))}
          options={[
            { value: 'contains', label: 'Contains' },
            { value: 'exact', label: 'Exact' },
            { value: 'starts', label: 'Starts with' },
            { value: 'ends', label: 'Ends with' },
            { value: 'regex', label: 'Regex' },
          ]}
        />
        <Toggle checked={opts.caseSensitive} onChange={(caseSensitive) => setOpts((o) => ({ ...o, caseSensitive }))} label="Case sensitive" />
      </OptionsBar>
      <div className="flex items-center justify-between border-b border-edge px-3 py-1">
        <span className="text-[11px] text-muted">
          {results ? (
            <>
              {results.total.toLocaleString()} match{results.total === 1 ? '' : 'es'}
              {results.truncated ? ' (truncated at 5000)' : ''}
            </>
          ) : query ? (
            'No matches'
          ) : (
            'Type a query to search'
          )}
        </span>
        <button className="toolbar-btn" onClick={record} type="button" disabled={!results || results.total === 0}>
          Record result
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {results && results.matches.length > 0 ? (
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-surface-2 text-[10px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-1.5">Path</th>
                <th className="px-3 py-1.5">Key</th>
                <th className="px-3 py-1.5">Type</th>
                <th className="px-3 py-1.5">Value</th>
                <th className="px-3 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {results.matches.map((m) => (
                <tr key={`${m.pointer}:${m.index}`} className="border-t border-edge hover:bg-surface">
                  <td className="max-w-[220px] truncate px-3 py-1 font-mono text-[11px] text-muted">{m.pointer}</td>
                  <td className="px-3 py-1 font-mono text-[11px] text-ink">"{m.key}"</td>
                  <td className="px-3 py-1 text-[11px] text-muted">{m.type}</td>
                  <td className="max-w-[320px] truncate px-3 py-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                    {m.value}
                  </td>
                  <td className="px-2 py-1">
                    <button
                      className="icon-btn"
                      title="Copy pointer"
                      type="button"
                      onClick={() => copy(m.pointer, 'Path copied')}
                    >
                      <Copy className="h-3 w-3" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4 text-xs text-muted">
            {query ? 'No matches found.' : 'Search will run as you type.'}
          </div>
        )}
      </div>
    </div>
  );

  const left = (
    <JsonInputPanel
      value={value}
      onChange={setValue}
      label="Input"
      placeholder='Paste JSON, e.g. {"users": [{"name": "Ada"}]}'
    />
  );

  return (
    <ToolPage title="Search" description="Find keys and values anywhere" icon={SearchIcon}>
      <SplitPane
        left={left}
        right={right}
        leftLabel="Input"
        rightLabel="Results"
        initialRatio={0.45}
      />
    </ToolPage>
  );
}
