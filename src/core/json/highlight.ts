import type { JsonValue } from '../../types/json';
import { jsonTypeName } from '../../types/json';

/** Lightweight JSON tokenizer + syntax highlighter (no eval, no unsafe HTML). */

export type JsonTokenType =
  | 'key'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'punctuation';

export interface JsonToken {
  type: JsonTokenType;
  value: string;
}

export function tokenizeJson(text: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  let i = 0;
  const n = text.length;
  const isPunct = (ch: string | undefined) =>
    ch !== undefined && '{}[]:,'.includes(ch);

  while (i < n) {
    const ch = text[i];
    if (ch === '"') {
      // Consume a full JSON string (handling escapes) — used to detect keys.
      let j = i + 1;
      let closed = false;
      while (j < n) {
        if (text[j] === '\\') {
          j += 2;
          continue;
        }
        if (text[j] === '"') {
          closed = true;
          break;
        }
        j += 1;
      }
      const end = closed ? j + 1 : j;
      // Determine if the next non-whitespace char is ':' to classify as key.
      let k = end;
      while (k < n && /\s/.test(text[k])) k += 1;
      const isKey = text[k] === ':';
      tokens.push({
        type: isKey ? 'key' : 'string',
        value: text.slice(i, end),
      });
      i = end;
      continue;
    }
    if (isPunct(ch)) {
      tokens.push({ type: 'punctuation', value: ch });
      i += 1;
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(text[i + 1] ?? ''))) {
      let j = i;
      while (j < n && /[0-9.eE+-]/.test(text[j])) j += 1;
      tokens.push({ type: 'number', value: text.slice(i, j) });
      i = j;
      continue;
    }
    if (text.startsWith('true', i) || text.startsWith('false', i)) {
      const isTrue = text.startsWith('true', i);
      tokens.push({ type: 'boolean', value: isTrue ? 'true' : 'false' });
      i += isTrue ? 4 : 5;
      continue;
    }
    if (text.startsWith('null', i)) {
      tokens.push({ type: 'null', value: 'null' });
      i += 4;
      continue;
    }
    tokens.push({ type: 'punctuation', value: ch });
    i += 1;
  }
  return tokens;
}

const CSS_CLASSES: Record<JsonTokenType, string> = {
  key: 'tok-key',
  string: 'tok-string',
  number: 'tok-number',
  boolean: 'tok-boolean',
  null: 'tok-null',
  punctuation: 'tok-punct',
};

export function tokenizeForDisplay(text: string): string {
  const tokens = tokenizeJson(text);
  let out = '';
  for (const token of tokens) {
    const escaped = token.value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    out += `<span class="${CSS_CLASSES[token.type]}">${escaped}</span>`;
  }
  return out;
}

export function jsonTypeOf(value: JsonValue): string {
  return jsonTypeName(value);
}
