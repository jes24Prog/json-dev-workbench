import { useState } from 'react';
import { GitFork, Search } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { ErrorBox } from '../../components/common/ErrorBox';
import { TreeViewer } from '../../components/common/TreeViewer';
import { TextInput } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { parseJson } from '../../core/json/parse';
import { stringifyJson } from '../../core/json/format';
import type { JsonValue } from '../../types/json';

export function TreePage() {
  const { value, setValue } = useDraft('tree');
  const [query, setQuery] = useState('');
  const parsed = parseJson(value);

  const handleChange = (next: JsonValue) => {
    setValue(stringifyJson(next, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false }));
  };

  const left = (
    <JsonInputPanel
      value={value}
      onChange={setValue}
      label="Input"
      placeholder='Paste JSON, e.g. {"hello": "world"}'
    />
  );

  const right = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-edge px-3 py-1.5">
        <Search className="h-3.5 w-3.5 text-muted" aria-hidden />
        <TextInput value={query} onChange={setQuery} placeholder="Search nodes…" className="flex-1" />
      </div>
      {parsed.ok ? (
        <div className="min-h-0 flex-1">
          <TreeViewer value={parsed.value} searchQuery={query.trim()} onChange={handleChange} />
        </div>
      ) : (
        <div className="p-4">
          <ErrorBox error={parsed.error} />
        </div>
      )}
    </div>
  );

  return (
    <ToolPage title="Tree Viewer" description="Interactive JSON tree explorer" icon={GitFork}>
      <SplitPane left={left} right={right} leftLabel="Input" rightLabel="Tree" initialRatio={0.42} />
    </ToolPage>
  );
}
