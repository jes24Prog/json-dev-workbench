import { FileCode } from 'lucide-react';
import { ConvertTool } from '../../components/common/ConvertTool';
import { jsonToHtml } from '../../core/converters/markdown';
import { parseJson } from '../../core/json/parse';

export function HtmlPage() {
  return (
    <ConvertTool
      toolId="html"
      toolLabel="JSON → HTML"
      description="Render JSON as a syntax-highlighted HTML document"
      icon={FileCode}
      toJson={() => ({ ok: false, error: 'HTML → JSON conversion is not available.' })}
      fromJson={(input) => {
        const parsed = parseJson(input);
        if (!parsed.ok) return { ok: false, error: parsed.error.message };
        return jsonToHtml(parsed.value);
      }}
      inputPlaceholder={'{"title": "Demo", "items": [1, 2, 3]}'}
      defaultDirection="fromJson"
      outputLanguage="text"
    />
  );
}
