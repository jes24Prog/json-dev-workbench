import { useRef, useState } from 'react';
import {
  FileJson,
  Braces,
  Minimize2,
  CheckCircle2,
  Wrench,
  ArrowDownAZ,
  Copy,
  Download,
  Eraser,
  Loader2,
} from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { CodeEditor } from '../../components/common/CodeEditor';
import { CodeOutput } from '../../components/common/CodeOutput';
import { ErrorBox, SuccessBadge } from '../../components/common/ErrorBox';
import { useDraft } from '../../stores/draftsStore';
import { useRunShortcut, useOpenFileShortcut } from '../../hooks/useGlobalShortcuts';
import { useCopy } from '../../hooks/useClipboard';
import { useFileImport, useFileDownload } from '../../hooks/useFile';
import { useUiStore } from '../../stores/uiStore';
import { useHistoryStore } from '../../stores/historyStore';
import { formatJsonText, minifyJsonText, byteSize } from '../../core/json/format';
import { parseJson, type JsonParseError } from '../../core/json/parse';
import { repairJson } from '../../core/json/repair';
import { sortObjectKeys } from '../../core/json/sort';

type ActionId = 'format' | 'minify' | 'validate' | 'repair' | 'sort';

export function EditorPage() {
  const { value, setValue } = useDraft('editor');
  const { copy } = useCopy();
  const { readFile } = useFileImport();
  const download = useFileDownload();
  const toast = useUiStore((s) => s.toast);
  const addHistory = useHistoryStore((s) => s.add);
  const historyEnabled = useHistoryStore((s) => s.enabled);

  const [output, setOutput] = useState('');
  const [error, setError] = useState<JsonParseError | null>(null);
  const [running, setRunning] = useState(false);
  const [lastAction, setLastAction] = useState<ActionId | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsed = parseJson(value);

  const runAction = (action: ActionId) => {
    setLastAction(action);
    if (value.trim() === '') {
      setError({
        message: 'Editor is empty. Paste some JSON to work with.',
        line: 0,
        column: 0,
        offset: 0,
        category: 'EMPTY_INPUT',
      });
      setOutput('');
      return;
    }
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      let resultText = '';
      switch (action) {
        case 'format': {
          const r = formatJsonText(value);
          if (!r.ok) {
            setError(r.error ?? null);
            setOutput('');
            return;
          }
          resultText = r.output ?? '';
          break;
        }
        case 'minify': {
          const r = minifyJsonText(value);
          if (!r.ok) {
            setError(r.error ?? null);
            setOutput('');
            return;
          }
          resultText = r.output ?? '';
          break;
        }
        case 'validate': {
          const p = parseJson(value);
          if (!p.ok) {
            setError(p.error);
            setOutput('');
            return;
          }
          resultText = `Valid JSON ✓\nRoot type: ${Array.isArray(p.value) ? 'array' : typeof p.value}`;
          break;
        }
        case 'repair': {
          const r = repairJson(value);
          if (!r.ok) {
            setError({
              message: r.error ?? 'Could not repair input.',
              line: 0,
              column: 0,
              offset: 0,
              category: 'UNEXPECTED_TOKEN',
            });
            setOutput('');
            return;
          }
          resultText = r.repaired ?? '';
          break;
        }
        case 'sort': {
          const p = parseJson(value);
          if (!p.ok) {
            setError(p.error);
            setOutput('');
            return;
          }
          resultText = JSON.stringify(sortObjectKeys(p.value), null, 2);
          break;
        }
      }
      setError(null);
      setOutput(resultText);
      if (historyEnabled && resultText) {
        void addHistory({
          tool: 'editor',
          toolLabel: 'JSON Editor',
          input: value,
          output: resultText,
          settings: JSON.stringify({ action }),
        });
      }
    }, 0);
  };

  useRunShortcut(() => runAction('format'));

  useOpenFileShortcut(() => fileInputRef.current?.click());

  return (
    <ToolPage
      title="JSON Editor"
      description="Full-featured code editor with actions"
      icon={FileJson}
      actions={
        <>
          <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={() => runAction('format')} disabled={running} type="button">
            {running ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <Braces className="h-3 w-3" aria-hidden />}
            Format
          </button>
          <button className="btn !px-3 !py-1 !text-xs" onClick={() => runAction('minify')} type="button">
            <Minimize2 className="h-3 w-3" aria-hidden />
            Minify
          </button>
          <button className="btn !px-3 !py-1 !text-xs" onClick={() => runAction('validate')} type="button">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            Validate
          </button>
          <button className="btn !px-3 !py-1 !text-xs" onClick={() => runAction('repair')} type="button">
            <Wrench className="h-3 w-3" aria-hidden />
            Repair
          </button>
          <button className="btn !px-3 !py-1 !text-xs" onClick={() => runAction('sort')} type="button">
            <ArrowDownAZ className="h-3 w-3" aria-hidden />
            Sort keys
          </button>
          <button className="btn !px-3 !py-1 !text-xs" onClick={() => copy(value, 'Editor content copied')} type="button">
            <Copy className="h-3 w-3" aria-hidden />
            Copy
          </button>
          <button className="btn !px-3 !py-1 !text-xs" onClick={() => download(value, 'document.json')} type="button">
            <Download className="h-3 w-3" aria-hidden />
            Download
          </button>
          <button className="btn !px-3 !py-1 !text-xs" onClick={() => setValue('')} type="button">
            <Eraser className="h-3 w-3" aria-hidden />
            Clear
          </button>
        </>
      }
    >
      <div className="grid h-full min-h-0 grid-cols-2">
        <div className="flex min-h-0 flex-col border-r border-edge">
          <div className="flex items-center gap-2 border-b border-edge px-3 py-1">
            {parsed.ok ? (
              <SuccessBadge>Valid JSON</SuccessBadge>
            ) : value.trim() !== '' ? (
              <span className="rounded-full border border-red-600/40 bg-red-600/10 px-2 py-0.5 text-xs font-medium text-red-500">
                Invalid
              </span>
            ) : (
              <span className="text-[11px] text-muted">Paste JSON to start</span>
            )}
            <span className="ml-auto text-[10px] text-muted">
              {byteSize(value).toLocaleString()} bytes · {value.split('\n').length} lines
            </span>
          </div>
          <div className="min-h-0 flex-1">
            <CodeEditor value={value} onChange={setValue} language="json" ariaLabel="JSON editor" />
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="flex items-center gap-2 border-b border-edge px-3 py-1">
            <span className="text-[10px] uppercase tracking-wide text-muted">
              {lastAction ? `Result — ${lastAction}` : 'Output'}
            </span>
          </div>
          {error ? (
            <div className="border-b border-edge px-4 py-3">
              <ErrorBox error={error} />
            </div>
          ) : null}
          <div className="min-h-0 flex-1">
            <CodeOutput value={output} language="json" filename="result.json" emptyText="Run an action to see the result here." />
          </div>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.txt,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          void readFile(file)
            .then((imported) => {
              setValue(imported.content);
              toast(`Imported ${imported.name}`, 'success');
            })
            .catch(() => toast('Could not read the selected file.', 'error'));
          e.target.value = '';
        }}
      />
    </ToolPage>
  );
}
