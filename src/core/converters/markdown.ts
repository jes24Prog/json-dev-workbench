import type { JsonValue } from '../../types/json';
import { tokenizeJson } from '../json/highlight';
import type { ConvertResult } from './yaml';

function escapeCell(value: JsonValue): string {
  if (value === null) return 'null';
  if (typeof value === 'object') return escapeCell(JSON.stringify(value));
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

export function jsonToMarkdown(value: JsonValue): ConvertResult {
  try {
    if (Array.isArray(value)) {
      if (value.length === 0) return { ok: true, output: '_Empty array._' };
      if (value.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item))) {
        const columns = new Set<string>();
        for (const item of value) {
          Object.keys(item as Record<string, JsonValue>).forEach((k) => columns.add(k));
        }
        const cols = [...columns];
        const rows = value.map((item) =>
          cols.map((col) => escapeCell((item as Record<string, JsonValue>)[col])).join(' | '),
        );
        return {
          ok: true,
          output: [
            `| ${cols.join(' | ')} |`,
            `| ${cols.map(() => '---').join(' | ')} |`,
            ...rows.map((r) => `| ${r} |`),
          ].join('\n'),
        };
      }
      const items = value.map((item) => `- \`${String(JSON.stringify(item)).replace(/`/g, '\\`')}\``);
      return { ok: true, output: items.join('\n') };
    }
    if (typeof value === 'object' && value !== null) {
      const lines: string[] = [];
      const visit = (node: JsonValue, key: string, depth: number): void => {
        const indent = '  '.repeat(depth);
        if (typeof node === 'object' && node !== null) {
          lines.push(`${indent}- **${key}**`);
          if (Array.isArray(node)) {
            node.forEach((item, i) => visit(item, `[${i}]`, depth + 1));
          } else {
            Object.entries(node as Record<string, JsonValue>).forEach(([k, v]) => visit(v, k, depth + 1));
          }
        } else {
          lines.push(`${indent}- **${key}**: \`${escapeCell(node)}\``);
        }
      };
      Object.entries(value as Record<string, JsonValue>).forEach(([k, v]) => visit(v, k, 0));
      return { ok: true, output: lines.join('\n') };
    }
    return { ok: true, output: '```json\n' + JSON.stringify(value, null, 2) + '\n```' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to convert to Markdown.' };
  }
}

export function jsonToHtml(value: JsonValue, title = 'JSON Document'): ConvertResult {
  try {
    const pretty = JSON.stringify(value, null, 2);
    return {
      ok: true,
      output: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title.replace(/[<>&]/g, '')}</title>
<style>
  body { background: #0f172a; color: #e2e8f0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; margin: 0; padding: 2rem; }
  pre { white-space: pre-wrap; word-break: break-word; }
  .k { color: #93c5fd; } .s { color: #86efac; } .n { color: #fbbf24; }
  .b { color: #f472b6; } .u { color: #94a3b8; } .p { color: #cbd5e1; }
</style>
</head>
<body>
<pre>${highlightHtml(pretty)}</pre>
</body>
</html>`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to convert to HTML.' };
  }
}

function highlightHtml(json: string): string {
  const classes: Record<string, string> = {
    key: 'k',
    string: 's',
    number: 'n',
    boolean: 'b',
    null: 'u',
    punctuation: 'p',
  };
  const { tokenizeJson: tokenize } = { tokenizeJson };
  return tokenize(json)
    .map((t) => {
      const escaped = t.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<span class="${classes[t.type] ?? 'p'}">${escaped}</span>`;
    })
    .join('');
}
