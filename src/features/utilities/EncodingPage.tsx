import { useState } from 'react';
import { Lock, Play, ArrowLeftRight } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { CodeOutput } from '../../components/common/CodeOutput';
import { OptionsBar, Segmented } from '../../components/common/controls';
import { useDraft } from '../../stores/draftsStore';
import { useRunShortcut } from '../../hooks/useGlobalShortcuts';
import { useHistoryStore } from '../../stores/historyStore';
import {
  encodeBase64,
  decodeBase64,
  decodeUrl,
  encodeUrlComponent,
  encodeUnicode,
  decodeUnicode,
  encodeHtmlEntities,
  decodeHtmlEntities,
  hexEncode,
  hexDecode,
  jsonEscape,
  jsonUnescape,
} from '../../core/encoding';
import type { ConvertResult } from '../../core/converters/yaml';

type Scheme = 'base64' | 'url' | 'unicode' | 'html' | 'hex' | 'json';

const SCHEMES: { value: Scheme; label: string }[] = [
  { value: 'base64', label: 'Base64' },
  { value: 'url', label: 'URL' },
  { value: 'unicode', label: 'Unicode' },
  { value: 'html', label: 'HTML entities' },
  { value: 'hex', label: 'Hex' },
  { value: 'json', label: 'JSON escape' },
];

function convert(scheme: Scheme, direction: 'encode' | 'decode', input: string): ConvertResult {
  if (direction === 'encode') {
    switch (scheme) {
      case 'base64':
        return { ok: true, output: encodeBase64(input) };
      case 'url':
        return { ok: true, output: encodeUrlComponent(input) };
      case 'unicode':
        return { ok: true, output: encodeUnicode(input) };
      case 'html':
        return { ok: true, output: encodeHtmlEntities(input) };
      case 'hex':
        return { ok: true, output: hexEncode(input) };
      case 'json':
        return { ok: true, output: jsonEscape(input) };
      default:
        return { ok: false, error: 'Unknown encoding scheme.' };
    }
  }
  switch (scheme) {
    case 'base64': {
      const r = decodeBase64(input);
      return r.ok ? { ok: true, output: r.value } : { ok: false, error: r.error };
    }
    case 'url': {
      const r = decodeUrl(input);
      return r.ok ? { ok: true, output: r.value } : { ok: false, error: r.error };
    }
    case 'unicode': {
      const r = decodeUnicode(input);
      return r.ok ? { ok: true, output: r.value } : { ok: false, error: r.error };
    }
    case 'html':
      return { ok: true, output: decodeHtmlEntities(input) };
    case 'hex': {
      const r = hexDecode(input);
      return r.ok ? { ok: true, output: r.value } : { ok: false, error: r.error };
    }
    case 'json': {
      const r = jsonUnescape(input);
      return r.ok ? { ok: true, output: r.value } : { ok: false, error: r.error };
    }
    default:
      return { ok: false, error: 'Unknown encoding scheme.' };
  }
}

export function EncodingPage() {
  const { value, setValue } = useDraft('encoding');
  const addHistory = useHistoryStore((s) => s.add);
  const historyEnabled = useHistoryStore((s) => s.enabled);

  const [scheme, setScheme] = useState<Scheme>('base64');
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    const result = convert(scheme, direction, value);
    if (!result.ok) {
      setOutput('');
      setError(result.error ?? 'Conversion failed.');
      return;
    }
    setOutput(result.output ?? '');
    if (historyEnabled && result.output) {
      void addHistory({
        tool: 'encoding',
        toolLabel: 'Encoding',
        input: value,
        output: result.output,
        settings: JSON.stringify({ scheme, direction }),
      });
    }
  };

  useRunShortcut(run);

  return (
    <ToolPage
      title="Encoding"
      description="Encode and decode text between common formats"
      icon={Lock}
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
            label="Scheme"
            value={scheme}
            onChange={setScheme}
            options={SCHEMES.map((s) => ({ value: s.value, label: s.label }))}
          />
          <Segmented
            label="Direction"
            value={direction}
            onChange={setDirection}
            options={[
              { value: 'encode', label: 'Encode' },
              { value: 'decode', label: 'Decode' },
            ]}
          />
          <button
            className="icon-btn"
            onClick={() => setDirection((d) => (d === 'encode' ? 'decode' : 'encode'))}
            type="button"
            aria-label="Swap direction"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </button>
        </OptionsBar>
        <div className="min-h-0 flex-1">
          <SplitPane
            left={<JsonInputPanel value={value} onChange={setValue} label={direction === 'encode' ? 'Plain input' : 'Encoded input'} language="text" placeholder="Paste text here…" />}
            right={
              <div className="flex h-full min-h-0 flex-col">
                {error && (
                  <div className="border-b border-edge px-4 py-3">
                    <div className="rounded-md border border-error/30 bg-error/5 px-3 py-2 font-mono text-xs text-error">{error}</div>
                  </div>
                )}
                <CodeOutput value={output} label="Result" language="text" emptyText={`Convert the input to ${direction} it.`} />
              </div>
            }
            leftLabel={direction === 'encode' ? 'Plain' : 'Encoded'}
            rightLabel="Result"
            initialRatio={0.45}
          />
        </div>
      </div>
    </ToolPage>
  );
}
