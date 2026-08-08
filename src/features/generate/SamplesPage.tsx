import { useState } from 'react';
import { Database, ClipboardPaste, Download } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { CodeOutput } from '../../components/common/CodeOutput';
import { useDraft } from '../../stores/draftsStore';
import { useCopy } from '../../hooks/useClipboard';
import { useFileDownload } from '../../hooks/useFile';
import { SAMPLE_DATA } from '../../constants/samples';
import { useUiStore } from '../../stores/uiStore';
import { useHistoryStore } from '../../stores/historyStore';

export function SamplesPage() {
  const { setValue } = useDraft('editor');
  const { copy } = useCopy();
  const download = useFileDownload();
  const toast = useUiStore((s) => s.toast);
  const addHistory = useHistoryStore((s) => s.add);
  const historyEnabled = useHistoryStore((s) => s.enabled);
  const [selected, setSelected] = useState(SAMPLE_DATA[0]?.id ?? '');
  const [preview, setPreview] = useState(SAMPLE_DATA[0]?.content ?? '');

  const current = SAMPLE_DATA.find((s) => s.id === selected);

  const select = (id: string) => {
    const sample = SAMPLE_DATA.find((s) => s.id === id);
    if (!sample) return;
    setSelected(id);
    setPreview(sample.content);
  };

  const useInEditor = () => {
    if (!current) return;
    setValue(current.content);
    toast(`"${current.name}" loaded into the editor`, 'success');
    if (historyEnabled) {
      void addHistory({
        tool: 'samples',
        toolLabel: 'Sample Data',
        input: '',
        output: current.content,
        settings: JSON.stringify({ sample: current.name }),
      });
    }
  };

  return (
    <ToolPage
      title="Sample Data"
      description="Load ready-to-use sample datasets"
      icon={Database}
      actions={
        <>
          <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={useInEditor} type="button" disabled={!current}>
            <ClipboardPaste className="h-3 w-3" aria-hidden />
            Use in editor
          </button>
          <button className="btn !px-3 !py-1 !text-xs" onClick={() => current && copy(current.content, 'Sample copied')} type="button" disabled={!current}>
            <ClipboardPaste className="h-3 w-3" aria-hidden />
            Copy
          </button>
          <button className="btn !px-3 !py-1 !text-xs" onClick={() => current && download(current.content, `${current.id}.json`)} type="button" disabled={!current}>
            <Download className="h-3 w-3" aria-hidden />
            Download
          </button>
        </>
      }
    >
      <div className="grid h-full min-h-0 grid-cols-[260px_1fr]">
        <div className="min-h-0 overflow-y-auto border-r border-edge p-2">
          <ul className="space-y-1">
            {SAMPLE_DATA.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => select(s.id)}
                  className={`w-full rounded px-2 py-1.5 text-left text-xs ${selected === s.id ? 'bg-accent/10 font-medium text-accent' : 'text-muted hover:bg-surface-3 hover:text-ink'}`}
                >
                  <span className="block truncate">{s.name}</span>
                  <span className="block truncate text-[10px] text-muted">{s.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between border-b border-edge px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-wide text-muted">
              {current?.name ?? 'Sample'} · {preview.split('\n').length} lines
            </span>
          </div>
          <div className="min-h-0 flex-1">
            <CodeOutput value={preview} language="json" filename={`${current?.id ?? 'sample'}.json`} />
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
