import { useState } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { OptionsBar, Segmented, Field, TextInput } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { convertTimestamp, nowTimestamp, type TimestampInput, type TimestampResult } from '../../core/timestamp';

type InputKind = 'seconds' | 'milliseconds' | 'iso' | 'local';

const KIND_LABELS: { value: InputKind; label: string; placeholder: string }[] = [
  { value: 'seconds', label: 'Unix seconds', placeholder: '1754668800' },
  { value: 'milliseconds', label: 'Unix ms', placeholder: '1754668800000' },
  { value: 'iso', label: 'ISO 8601', placeholder: '2025-08-08T12:00:00.000Z' },
  { value: 'local', label: 'Local datetime', placeholder: '2025-08-08 12:00' },
];

export function TimestampPage() {
  const { value, setValue } = useDraft('timestamp');
  const [kind, setKind] = useState<InputKind>('seconds');
  const [result, setResult] = useState<TimestampResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const input: TimestampInput = { kind, value };
    const r = convertTimestamp(input);
    if (!r.ok) {
      setError(r.error);
      setResult(null);
      return;
    }
    setError(null);
    setResult(r.result);
  };

  const useNow = () => {
    const now = nowTimestamp();
    setKind('seconds');
    setValue(now.seconds);
    setError(null);
    setResult(now);
  };

  return (
    <ToolPage
      title="Timestamp"
      description="Convert between Unix time and readable dates"
      icon={Clock}
      actions={
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={run} type="button">
          <RefreshCw className="h-3 w-3" aria-hidden />
          Convert
        </button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <OptionsBar>
          <Segmented
            label="Input type"
            value={kind}
            onChange={setKind}
            options={KIND_LABELS.map((k) => ({ value: k.value, label: k.label }))}
          />
          <Field label="Value">
            <TextInput value={value} onChange={setValue} placeholder={KIND_LABELS.find((k) => k.value === kind)?.placeholder} className="w-64 font-mono" />
          </Field>
          <button className="btn !px-2 !py-1 !text-xs" onClick={useNow} type="button">
            Now
          </button>
        </OptionsBar>
        <div className="min-h-0 flex-1 p-4">
          {error && (
            <div className="mb-3 rounded-md border border-error/30 bg-error/5 px-3 py-2 font-mono text-xs text-error">{error}</div>
          )}
          {!result && !error && (
            <div className="flex h-full items-center justify-center text-xs text-muted">
              Enter a timestamp and press Convert to see all representations.
            </div>
          )}
          {result && (
            <div className="max-w-3xl overflow-hidden rounded-lg border border-edge">
              {(
                [
                  ['Unix seconds', result.seconds],
                  ['Unix milliseconds', result.milliseconds],
                  ['ISO 8601', result.iso],
                  ['Local', result.local],
                  ['UTC', result.utc],
                  ['Human readable', result.human],
                ] as const
              ).map(([label, valueText]) => (
                <div key={label} className="flex items-center justify-between gap-4 border-b border-edge px-4 py-2 last:border-b-0 hover:bg-surface-2">
                  <span className="w-36 shrink-0 text-xs text-muted">{label}</span>
                  <code className="min-w-0 flex-1 truncate text-right font-mono text-xs text-ink" title={valueText}>
                    {valueText}
                  </code>
                  <button className="toolbar-btn" onClick={() => void navigator.clipboard.writeText(valueText)} type="button">
                    Copy
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ToolPage>
  );
}
