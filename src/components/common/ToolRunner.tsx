import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Play, RotateCcw, Loader2 } from 'lucide-react';
import { SplitPane } from './SplitPane';
import { JsonInputPanel } from './JsonInputPanel';
import { CodeOutput } from './CodeOutput';
import { ErrorBox } from './ErrorBox';
import { useDraft } from '../../stores/draftsStore';
import { useUiStore } from '../../stores/uiStore';
import { useRunShortcut, useOpenFileShortcut } from '../../hooks/useGlobalShortcuts';
import { useHistoryStore } from '../../stores/historyStore';
import { useHeavyTask } from '../../hooks/useHeavyTask';
import { useFileImport } from '../../hooks/useFile';
import { byteSize } from '../../core/json/format';
import type { WorkerTaskType } from '../../services/worker';
import type { EditorLanguage } from './CodeEditor';
import type { JsonParseError } from '../../core/json/parse';

export interface RunFailure {
  ok: false;
  error: JsonParseError | string;
}
export interface RunSuccess {
  ok: true;
  output: string;
}
export type RunResult = RunSuccess | RunFailure;

export interface ToolRunnerProps {
  toolId: string;
  toolLabel: string;
  compute: (input: string) => RunResult;
  language?: EditorLanguage;
  outputLanguage?: 'json' | 'text';
  placeholder?: string;
  accept?: string;
  runOnChange?: boolean;
  runKey?: unknown;
  autoRun?: boolean;
  options?: ReactNode;
  filename?: string;
  emptyText?: string;
  inputToolbar?: ReactNode;
  resultMeta?: (output: string, input: string) => ReactNode;
  onFileLoaded?: (name: string, content: string) => void;
  recordSettings?: () => string;
  worker?: { type: WorkerTaskType; toPayload: (input: string) => unknown; fromData: (data: unknown) => RunResult };
}

const WORKER_THRESHOLD_BYTES = 512 * 1024;

export function ToolRunner({
  toolId,
  toolLabel,
  compute,
  language = 'json',
  outputLanguage = 'json',
  placeholder,
  accept,
  runOnChange = false,
  runKey,
  autoRun = false,
  options,
  filename,
  emptyText,
  inputToolbar,
  resultMeta,
  onFileLoaded,
  recordSettings,
  worker,
}: ToolRunnerProps) {
  const { value, setValue } = useDraft(toolId);
  const toast = useUiStore((s) => s.toast);
  const { readFile } = useFileImport();
  const historyEnabled = useHistoryStore((s) => s.enabled);
  const addHistory = useHistoryStore((s) => s.add);

  const [error, setError] = useState<JsonParseError | string | null>(null);
  const [output, setOutput] = useState('');
  const [workerPending, setWorkerPending] = useState(false);

  const computeRef = useRef(compute);
  computeRef.current = compute;
  const recordSettingsRef = useRef(recordSettings);
  recordSettingsRef.current = recordSettings;

  const heavy = useHeavyTask<RunSuccess, string>((input) => {
    const r = computeRef.current(input);
    if (!r.ok) return { ok: false, error: typeof r.error === 'string' ? r.error : r.error.message };
    return { ok: true, output: r.output };
  });

  const applyResult = (result: RunResult) => {
    if (!result.ok) {
      setError(result.error);
      setOutput('');
      return;
    }
    setError(null);
    setOutput(result.output);
    if (historyEnabled && result.output) {
      void addHistory({
        tool: toolId,
        toolLabel,
        input: value,
        output: result.output,
        settings: recordSettingsRef.current?.() ?? '{}',
      });
    }
  };

  const run = async (input = value) => {
    if (!input.trim()) {
      setError('Input is empty. Provide some content first.');
      setOutput('');
      return;
    }
    if (worker && byteSize(input) > WORKER_THRESHOLD_BYTES) {
      setWorkerPending(true);
      setError(null);
      heavy.run(input, byteSize(input), { type: worker.type, toWorkerPayload: worker.toPayload });
      return;
    }
    applyResult(computeRef.current(input));
  };

  useEffect(() => {
    if (!worker) return;
    if (workerPending && heavy.result) {
      setWorkerPending(false);
      applyResult({ ok: true, output: heavy.result.output });
    } else if (workerPending && heavy.error) {
      setWorkerPending(false);
      setError(heavy.error);
      setOutput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerPending, heavy.result, heavy.error]);

  useRunShortcut(() => void run());

  const fileInputRef = useRef<HTMLInputElement>(null);
  useOpenFileShortcut(() => {
    fileInputRef.current?.click();
  });

  useEffect(() => {
    if (!runOnChange && !autoRun) return;
    if (!value.trim()) {
      setError(null);
      setOutput('');
      return;
    }
    void run(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, runKey]);

  const inputPanel = (
    <JsonInputPanel
      value={value}
      onChange={setValue}
      language={language}
      placeholder={placeholder}
      accept={accept}
      extraToolbar={inputToolbar}
      onFileLoaded={(name, content) => onFileLoaded?.(name, content)}
    />
  );

  const outputPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-edge px-3 py-1.5">
        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary !px-3 !py-1 !text-xs"
            onClick={() => void run()}
            type="button"
            disabled={heavy.running}
          >
            {heavy.running ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <Play className="h-3 w-3" aria-hidden />}
            {heavy.running ? 'Processing…' : 'Run'}
          </button>
          <button className="btn !px-3 !py-1 !text-xs" onClick={() => setValue('')} type="button" title="Clear input">
            <RotateCcw className="h-3 w-3" aria-hidden />
            Clear
          </button>
          <span className="text-[10px] text-muted">Ctrl+Enter to run</span>
        </div>
        {resultMeta && output && <div className="text-[11px] text-muted">{resultMeta(output, value)}</div>}
      </div>
      {error && (
        <div className="border-b border-edge px-4 py-3">
          <ErrorBox error={normalizeError(error)} />
        </div>
      )}
      <div className="min-h-0 flex-1">
        <CodeOutput value={output} language={outputLanguage} filename={filename} emptyText={emptyText} />
      </div>
    </div>
  );

  const body = useMemo(
    () => (
      <div className="flex h-full min-h-0 flex-col">
        {options}
        <div className="min-h-0 flex-1">
          <SplitPane left={inputPanel} right={outputPanel} leftLabel="Input" rightLabel="Output" />
        </div>
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, output, error, options, runKey, heavy.running],
  );

  return (
    <>
      {body}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const imported = await readFile(file);
            setValue(imported.content);
            onFileLoaded?.(imported.name, imported.content);
            toast(`Imported ${imported.name}`, 'info');
          } catch {
            toast('Could not read the selected file.', 'error');
          } finally {
            e.target.value = '';
          }
        }}
      />
    </>
  );
}

function normalizeError(err: JsonParseError | string): JsonParseError {
  if (typeof err === 'string') {
    return { message: err, line: 0, column: 0, offset: 0, category: 'UNEXPECTED_TOKEN' };
  }
  return err;
}
