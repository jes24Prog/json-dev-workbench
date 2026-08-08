import { useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Play } from 'lucide-react';
import { ToolPage } from './ToolPage';
import { SplitPane } from './SplitPane';
import { JsonInputPanel } from './JsonInputPanel';
import { CodeOutput } from './CodeOutput';
import { OptionsBar, Segmented } from './controls';
import { useDraft } from '../../stores/draftsStore';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';
import { useHistoryStore } from '../../stores/historyStore';
import type { ConvertResult } from '../../core/converters/yaml';

export type ConvertDirection = 'toJson' | 'fromJson';

interface ConvertToolProps {
  toolId: string;
  toolLabel: string;
  description: string;
  icon: LucideIcon;
  inputPlaceholder?: string;
  outputLanguage?: 'text' | 'json';
  defaultDirection?: ConvertDirection;
  toJson: (input: string) => ConvertResult;
  fromJson: (input: string) => ConvertResult;
  options?: ReactNode;
  recordSettings?: () => string;
}

export function ConvertTool({
  toolId,
  toolLabel,
  description,
  icon,
  inputPlaceholder = 'Paste data here…',
  outputLanguage = 'text',
  defaultDirection = 'fromJson',
  toJson,
  fromJson,
  options,
  recordSettings,
}: ConvertToolProps) {
  const { value, setValue } = useDraft(toolId);
  const addHistory = useHistoryStore((s) => s.add);
  const historyEnabled = useHistoryStore((s) => s.enabled);

  const [direction, setDirection] = useState<ConvertDirection>(defaultDirection);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    const result = direction === 'toJson' ? toJson(value) : fromJson(value);
    if (!result.ok) {
      setOutput('');
      setError(result.error ?? 'Conversion failed.');
      return;
    }
    setOutput(result.output ?? '');
    if (historyEnabled && result.output) {
      void addHistory({
        tool: toolId,
        toolLabel,
        input: value,
        output: result.output,
        settings: JSON.stringify({ direction, settings: recordSettings?.() }),
      });
    }
  };

  useRunShortcut(run);

  const inputLabel = useMemo(
    () => (direction === 'toJson' ? 'Input' : 'JSON input'),
    [direction],
  );
  const outputLabel = useMemo(
    () => (direction === 'fromJson' ? 'Output' : 'JSON output'),
    [direction],
  );

  return (
    <ToolPage
      title={toolLabel}
      description={description}
      icon={icon}
      actions={
        <button className="btn btn-primary !px-3 !py-1 !text-xs" onClick={run} type="button">
          <Play className="h-3 w-3" aria-hidden />
          Convert
        </button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <OptionsBar>
          <Segmented
            label="Direction"
            value={direction}
            onChange={setDirection}
            options={[
              { value: 'toJson', label: '→ JSON' },
              { value: 'fromJson', label: 'JSON →' },
            ]}
          />
          {options}
        </OptionsBar>
        <div className="min-h-0 flex-1">
          <SplitPane
            left={
              <div className="flex h-full min-h-0 flex-col">
                <JsonInputPanel value={value} onChange={setValue} label={inputLabel} language="text" placeholder={inputPlaceholder} />
              </div>
            }
            right={
              <div className="flex h-full min-h-0 flex-col">
                {error && (
                  <div className="border-b border-edge px-4 py-3">
                    <div className="rounded-md border border-error/30 bg-error/5 px-3 py-2 font-mono text-xs text-error">{error}</div>
                  </div>
                )}
                <CodeOutput
                  value={output}
                  label={outputLabel}
                  language={outputLanguage}
                  emptyText="Convert the input to see the result here."
                />
              </div>
            }
            leftLabel={inputLabel}
            rightLabel={outputLabel}
            initialRatio={0.45}
          />
        </div>
      </div>
    </ToolPage>
  );
}
