import { useState } from 'react';
import { Sparkles, Copy, Download } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { CodeOutput } from '../../components/common/CodeOutput';
import { OptionsBar, Segmented, NumberInput, Field } from '../../components/common/controls';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';
import { useCopy } from '../../hooks/useClipboard';
import { useFileDownload } from '../../hooks/useFile';
import { useHistoryStore } from '../../stores/historyStore';

type UuidFormat = 'v4' | 'v1' | 'nil';

function uuidV4(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function uuidV1(): string {
  const now = Date.now();
  const timeHex = Math.floor(now / 1000).toString(16).padStart(8, '0');
  const rand = uuidV4().slice(9);
  return `${timeHex}-${rand.slice(0, 4)}-1${rand.slice(5, 8)}-${rand.slice(8, 12)}-${rand.slice(12, 24)}`;
}

export function UuidPage() {
  const [format, setFormat] = useState<UuidFormat>('v4');
  const [count, setCount] = useState(5);
  const { copy } = useCopy();
  const download = useFileDownload();
  const addHistory = useHistoryStore((s) => s.add);
  const historyEnabled = useHistoryStore((s) => s.enabled);
  const [output, setOutput] = useState('');

  const generate = () => {
    const items: string[] = [];
    for (let i = 0; i < count; i += 1) {
      items.push(format === 'nil' ? '00000000-0000-0000-0000-000000000000' : format === 'v4' ? uuidV4() : uuidV1());
    }
    const text = count === 1 ? items[0] : items.join('\n');
    setOutput(text);
    if (historyEnabled) {
      void addHistory({
        tool: 'uuid',
        toolLabel: 'UUID Generator',
        input: '',
        output: text,
        settings: JSON.stringify({ format, count }),
      });
    }
  };

  useRunShortcut(generate);

  return (
    <ToolPage
      title="UUID Generator"
      description="Generate UUIDs in batch"
      icon={Sparkles}
      actions={
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={generate} type="button">
          <Sparkles className="h-3 w-3" aria-hidden />
          Generate
        </button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <OptionsBar>
          <Segmented<UuidFormat>
            value={format}
            onChange={setFormat}
            options={[
              { value: 'v4', label: 'UUID v4' },
              { value: 'v1', label: 'UUID v1' },
              { value: 'nil', label: 'Nil' },
            ]}
          />
          <Field label="Count">
            <NumberInput value={count} onChange={setCount} min={1} max={5000} />
          </Field>
          <button className="btn !px-3 !py-1 !text-xs" onClick={() => copy(output, 'UUIDs copied')} type="button">
            <Copy className="h-3 w-3" aria-hidden />
            Copy
          </button>
          <button className="btn !px-3 !py-1 !text-xs" onClick={() => download(output, 'uuids.txt')} type="button">
            <Download className="h-3 w-3" aria-hidden />
            Download
          </button>
        </OptionsBar>
        <div className="min-h-0 flex-1 p-0">
          <CodeOutput value={output} language="text" emptyText="Press Generate (Ctrl+Enter) to create UUIDs." />
        </div>
      </div>
    </ToolPage>
  );
}
