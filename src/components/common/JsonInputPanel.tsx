import { useRef, useState, type ReactNode, type DragEvent } from 'react';
import { Eraser, FolderOpen, ClipboardPaste, Copy } from 'lucide-react';
import { CodeEditor, type EditorLanguage } from './CodeEditor';
import { useFileImport } from '../../hooks/useFile';
import { useCopy } from '../../hooks/useClipboard';
import { byteSize } from '../../core/json/format';
import { useUiStore } from '../../stores/uiStore';

export interface JsonInputPanelProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  language?: EditorLanguage;
  placeholder?: string;
  extraToolbar?: ReactNode;
  accept?: string;
  onFileLoaded?: (name: string, content: string) => void;
  readOnly?: boolean;
}

export function JsonInputPanel({
  value,
  onChange,
  label = 'Input',
  language = 'json',
  placeholder,
  extraToolbar,
  accept,
  onFileLoaded,
  readOnly = false,
}: JsonInputPanelProps) {
  const { openFilePicker, readFile } = useFileImport();
  const { copy } = useCopy();
  const toast = useUiStore((s) => s.toast);
  const [dragOver, setDragOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const lines = value === '' ? 0 : value.split('\n').length;
  const chars = value.length;
  const bytes = byteSize(value);

  const handleFile = async () => {
    const file = await openFilePicker(accept);
    if (file) {
      onChange(file.content);
      onFileLoaded?.(file.name, file.content);
      toast(`Imported ${file.name}`, 'info');
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) {
      toast('Only files can be dropped here.', 'warning');
      return;
    }
    try {
      const imported = await readFile(file);
      onChange(imported.content);
      onFileLoaded?.(imported.name, imported.content);
      toast(`Imported ${imported.name}`, 'success');
    } catch {
      toast('Could not read the dropped file.', 'error');
    }
  };

  return (
    <div
      ref={dropRef}
      className="relative flex h-full min-h-0 flex-col"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed border-accent bg-accent/5">
          <span className="text-sm font-medium text-accent">Drop file to import</span>
        </div>
      )}
      <div className="flex items-center gap-1 border-b border-edge px-2 py-1">
        <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
          {label}
        </span>
        <button className="toolbar-btn" onClick={handleFile} type="button" aria-label="Open file">
          <FolderOpen className="h-3 w-3" aria-hidden />
          Open
        </button>
        <button
          className="toolbar-btn"
          onClick={() => navigator.clipboard?.readText().then((t) => onChange(t))}
          type="button"
          aria-label="Paste from clipboard"
        >
          <ClipboardPaste className="h-3 w-3" aria-hidden />
          Paste
        </button>
        <button
          className="toolbar-btn"
          onClick={() => copy(value, 'Input copied to clipboard')}
          type="button"
          aria-label="Copy input"
        >
          <Copy className="h-3 w-3" aria-hidden />
          Copy
        </button>
        <button
          className="toolbar-btn"
          onClick={() => onChange('')}
          type="button"
          aria-label="Clear input"
        >
          <Eraser className="h-3 w-3" aria-hidden />
          Clear
        </button>
        {extraToolbar}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeEditor
          value={value}
          onChange={onChange}
          language={language}
          placeholder={placeholder}
          readOnly={readOnly}
          ariaLabel={label}
        />
      </div>
      <div className="flex items-center justify-between border-t border-edge px-3 py-0.5 text-[10px] text-muted">
        <span>
          {lines} lines · {chars.toLocaleString()} chars · {formatBytes(bytes)}
        </span>
        <span>Local-only processing</span>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
