import { FileText } from 'lucide-react';
import { ConvertTool } from '../../components/common/ConvertTool';
import { jsonToMarkdown } from '../../core/converters/markdown';
import { parseJson } from '../../core/json/parse';
import type { ConvertResult } from '../../core/converters/yaml';

export function MarkdownPage() {
  return (
    <ConvertTool
      toolId="markdown"
      toolLabel="JSON → Markdown"
      description="Render JSON as a Markdown table or list"
      icon={FileText}
      toJson={() => ({ ok: false, error: 'Markdown → JSON conversion is not available.' }) as ConvertResult}
      fromJson={(input) => {
        const parsed = parseJson(input);
        if (!parsed.ok) return { ok: false, error: parsed.error.message };
        return jsonToMarkdown(parsed.value);
      }}
      inputPlaceholder={'[{"name": "Ada", "role": "Engineer"}, {"name": "Linus", "role": "Maintainer"}]'}
      defaultDirection="fromJson"
    />
  );
}
