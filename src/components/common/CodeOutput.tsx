import { memo, useMemo } from 'react';
import { Copy, Download } from 'lucide-react';
import { useCopy } from '../../hooks/useClipboard';
import { useFileDownload } from '../../hooks/useFile';
import { tokenizeForDisplay } from '../../core/json/highlight';

export interface CodeOutputProps {
  value: string;
  language?: 'json' | 'text';
  filename?: string;
  copyMessage?: string;
  emptyText?: string;
  label?: string;
}

export const CodeOutput = memo(function CodeOutput({
  value,
  language = 'text',
  filename,
  copyMessage = 'Output copied to clipboard',
  emptyText = 'No output yet. Run the operation to see results here.',
  label,
}: CodeOutputProps) {
  const { copy } = useCopy();
  const download = useFileDownload();

  const highlighted = useMemo(
    () => (language === 'json' && value ? tokenizeForDisplay(value) : null),
    [value, language],
  );

  if (!value) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-xs text-muted">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-edge px-2 py-1">
        <span className="text-[10px] uppercase tracking-wide text-muted">
          {label ?? (language === 'json' ? 'JSON' : 'Text') + ' output'}
        </span>
        <div className="flex items-center gap-1">
          <button className="toolbar-btn" onClick={() => copy(value, copyMessage)} type="button">
            <Copy className="h-3 w-3" aria-hidden />
            Copy
          </button>
          {filename && (
            <button className="toolbar-btn" onClick={() => download(value, filename)} type="button">
              <Download className="h-3 w-3" aria-hidden />
              Download
            </button>
          )}
        </div>
      </div>
      <div className="code-scroll min-h-0 flex-1 p-3 font-mono text-[12.5px] leading-relaxed">
        {highlighted ? (
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        ) : (
          <code>{value}</code>
        )}
      </div>
    </div>
  );
});
