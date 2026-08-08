import { useState } from 'react';
import { CornerDownLeft, Play } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { ErrorBox } from '../../components/common/ErrorBox';
import { OptionsBar, Select, Toggle, NumberInput, Field } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';
import { useHistoryStore } from '../../stores/historyStore';
import { parseJson } from '../../core/json/parse';
import { stringifyJson } from '../../core/json/format';
import type { JsonValue } from '../../types/json';

const STATUSES: { code: number; phrase: string }[] = [
  { code: 200, phrase: 'OK' },
  { code: 201, phrase: 'Created' },
  { code: 204, phrase: 'No Content' },
  { code: 400, phrase: 'Bad Request' },
  { code: 401, phrase: 'Unauthorized' },
  { code: 403, phrase: 'Forbidden' },
  { code: 404, phrase: 'Not Found' },
  { code: 409, phrase: 'Conflict' },
  { code: 422, phrase: 'Unprocessable Entity' },
  { code: 500, phrase: 'Internal Server Error' },
  { code: 503, phrase: 'Service Unavailable' },
];

export function ApiResponsePage() {
  const { value, setValue } = useDraft('api-response');
  const addHistory = useHistoryStore((s) => s.add);
  const historyEnabled = useHistoryStore((s) => s.enabled);

  const [status, setStatus] = useState(200);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [latencyMs, setLatencyMs] = useState(120);
  const [randomLatency, setRandomLatency] = useState(true);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const parsed = parseJson(value);
    if (!parsed.ok) {
      setError(parsed.error.message);
      setOutput('');
      return;
    }
    setError(null);
    const phrase = STATUSES.find((s) => s.code === status)?.phrase ?? 'Unknown';
    const latency = randomLatency ? Math.max(1, Math.round(latencyMs * (0.6 + Math.random() * 0.8))) : latencyMs;
    const headers: Record<string, JsonValue> = {
      'content-type': 'application/json',
      'x-request-id': makeId(),
      'x-processing-time-ms': latency,
    };
    const response: Record<string, JsonValue> = {
      status,
      statusText: phrase,
      body: parsed.value,
    };
    if (includeHeaders) response.headers = headers as unknown as JsonValue;
    const text = stringifyJson(response as JsonValue, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false });
    setOutput(text);
    if (historyEnabled) {
      void addHistory({
        tool: 'api-response',
        toolLabel: 'API Response',
        input: value,
        output: text,
        settings: JSON.stringify({ status, includeHeaders, latency }),
      });
    }
  };

  useRunShortcut(run);

  return (
    <ToolPage
      title="API Response"
      description="Generate API responses with status codes"
      icon={CornerDownLeft}
      actions={
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={run} type="button">
          <Play className="h-3 w-3" aria-hidden />
          Generate response
        </button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <OptionsBar>
          <Select
            label="Status"
            value={String(status)}
            onChange={(v) => setStatus(Number(v))}
            options={STATUSES.map((s) => ({ value: String(s.code), label: `${s.code} ${s.phrase}` }))}
          />
          <Toggle checked={includeHeaders} onChange={setIncludeHeaders} label="Include headers" />
          <Toggle checked={randomLatency} onChange={setRandomLatency} label="Random latency" />
          <Field label="Latency (ms)">
            <NumberInput value={latencyMs} onChange={setLatencyMs} min={0} max={10000} />
          </Field>
        </OptionsBar>
        <div className="min-h-0 flex-1">
          <SplitPane
            left={
              <JsonInputPanel value={value} onChange={setValue} label="Response body" placeholder='{"id": "user_123", "name": "Ada"}' />
            }
            right={
              <div className="flex h-full min-h-0 flex-col">
                {error && (
                  <div className="border-b border-edge px-4 py-3">
                    <ErrorBox error={{ message: error, line: 0, column: 0, offset: 0, category: 'UNEXPECTED_TOKEN' }} />
                  </div>
                )}
                <div className="code-scroll min-h-0 flex-1 overflow-auto p-3">
                  <pre className="font-mono text-[12px] text-ink">{output || 'Configure the response and press Generate (Ctrl+Enter).'}</pre>
                </div>
              </div>
            }
            leftLabel="Body"
            rightLabel="Response"
            initialRatio={0.45}
          />
        </div>
      </div>
    </ToolPage>
  );
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID().slice(0, 8);
  return Math.random().toString(16).slice(2, 10);
}
