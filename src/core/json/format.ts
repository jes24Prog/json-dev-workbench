import type { JsonValue } from '../../types/json';
import { jsonTypeName } from '../../types/json';
import type { JsonParseError } from './parse';
import { parseJson } from './parse';

export type Indentation = 2 | 4 | 'tab' | 'none';

export interface FormatOptions {
  indentation: Indentation;
  sortKeys: boolean;
  sortArrays: boolean;
  escapeUnicode: boolean;
}

export interface FormatResult {
  ok: boolean;
  output?: string;
  error?: JsonParseError;
}

export const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
  indentation: 2,
  sortKeys: false,
  sortArrays: false,
  escapeUnicode: false,
};

function indentFor(indentation: Indentation): string {
  switch (indentation) {
    case 2:
      return '  ';
    case 4:
      return '    ';
    case 'tab':
      return '\t';
    case 'none':
      return '';
  }
}

function escapeUnicodeString(input: string): string {
  let out = '';
  let i = 0;
  while (i < input.length) {
    const code = input.codePointAt(i) as number;
    if (code > 0x7e || code < 0x20 || code === 0x22 || code === 0x5c) {
      if (code > 0xffff) {
        // Emit surrogate pair escape for code points outside BMP.
        const hi = 0xd800 + Math.floor((code - 0x10000) / 0x400);
        const lo = 0xdc00 + ((code - 0x10000) % 0x400);
        out += '\\u' + hi.toString(16).padStart(4, '0') + '\\u' + lo.toString(16).padStart(4, '0');
      } else {
        out += '\\u' + code.toString(16).padStart(4, '0');
      }
      i += code > 0xffff ? 2 : 1;
      continue;
    }
    out += String.fromCodePoint(code);
    i += code > 0xffff ? 2 : 1;
  }
  return out;
}

function quoteString(value: string, escapeUnicode: boolean): string {
  let body = value.replace(/[\\"]/g, (m) => (m === '\\' ? '\\\\' : '\\"'));
  const controlPattern = new RegExp('[' + String.fromCharCode(0) + '-' + String.fromCharCode(0x1f) + ']', 'g');
  body = body.replace(controlPattern, (m) => {
    const charCode = m.charCodeAt(0);
    switch (charCode) {
      case 0x08:
        return '\\b';
      case 0x09:
        return '\\t';
      case 0x0a:
        return '\\n';
      case 0x0c:
        return '\\f';
      case 0x0d:
        return '\\r';
      default:
        return '\\u' + charCode.toString(16).padStart(4, '0');
    }
  });
  if (escapeUnicode) {
    body = escapeUnicodeString(body);
  }
  return '"' + body + '"';
}

function sortValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (typeof value === 'object' && value !== null) {
    const result: Record<string, JsonValue> = {};
    for (const key of Object.keys(value).sort()) {
      result[key] = sortValue(value[key]);
    }
    return result;
  }
  return value;
}

function sortArraysRecursive(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    const sorted = [...value].sort((a, b) => {
      const aStr = JSON.stringify(a);
      const bStr = JSON.stringify(b);
      if (aStr === bStr) return 0;
      return aStr < bStr ? -1 : 1;
    });
    return sorted.map(sortArraysRecursive);
  }
  if (typeof value === 'object' && value !== null) {
    const result: Record<string, JsonValue> = {};
    for (const key of Object.keys(value)) {
      result[key] = sortArraysRecursive(value[key]);
    }
    return result;
  }
  return value;
}

function prepare(value: JsonValue, opts: FormatOptions): JsonValue {
  let result = value;
  if (opts.sortKeys) result = sortValue(result);
  if (opts.sortArrays) result = sortArraysRecursive(result);
  return result;
}

function serialize(
  value: JsonValue,
  opts: FormatOptions,
  indentStr: string,
  level: number,
  compact: boolean,
  out: string[],
): void {
  const type = jsonTypeName(value);
  switch (type) {
    case 'null':
      out.push('null');
      return;
    case 'string':
      out.push(quoteString(value as string, opts.escapeUnicode));
      return;
    case 'number':
      out.push(String(value));
      return;
    case 'boolean':
      out.push(String(value));
      return;
    case 'array': {
      const arr = value as JsonValue[];
      if (arr.length === 0) {
        out.push('[]');
        return;
      }
      if (compact) {
        out.push('[');
        arr.forEach((item, i) => {
          if (i > 0) out.push(',');
          serialize(item, opts, indentStr, level + 1, true, out);
        });
        out.push(']');
        return;
      }
      out.push('[');
      arr.forEach((item, i) => {
        if (i > 0) out.push(',');
        out.push('\n');
        out.push(indentStr.repeat(level + 1));
        serialize(item, opts, indentStr, level + 1, false, out);
      });
      out.push('\n');
      out.push(indentStr.repeat(level));
      out.push(']');
      return;
    }
    case 'object': {
      const obj = value as Record<string, JsonValue>;
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        out.push('{}');
        return;
      }
      if (compact) {
        out.push('{');
        keys.forEach((key, i) => {
          if (i > 0) out.push(',');
          out.push(quoteString(key, opts.escapeUnicode));
          out.push(':');
          serialize(obj[key], opts, indentStr, level + 1, true, out);
        });
        out.push('}');
        return;
      }
      out.push('{');
      keys.forEach((key, i) => {
        if (i > 0) out.push(',');
        out.push('\n');
        out.push(indentStr.repeat(level + 1));
        out.push(quoteString(key, opts.escapeUnicode));
        out.push(': ');
        serialize(obj[key], opts, indentStr, level + 1, false, out);
      });
      out.push('\n');
      out.push(indentStr.repeat(level));
      out.push('}');
      return;
    }
  }
}

export function stringifyJson(value: JsonValue, opts: FormatOptions = DEFAULT_FORMAT_OPTIONS): string {
  const compact = opts.indentation === 'none';
  const indentStr = indentFor(opts.indentation);
  const prepared = prepare(value, opts);
  const out: string[] = [];
  serialize(prepared, opts, indentStr, 0, compact, out);
  return out.join('');
}

export function formatJsonText(text: string, opts: FormatOptions = DEFAULT_FORMAT_OPTIONS): FormatResult {
  const parsed = parseJson(text);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const optsWithIndent = opts.indentation === 'none' ? { ...opts, indentation: 2 as const } : opts;
  return { ok: true, output: stringifyJson(parsed.value, optsWithIndent) };
}

export function minifyJsonText(text: string, opts: Pick<FormatOptions, 'escapeUnicode'> = { escapeUnicode: false }): FormatResult {
  const parsed = parseJson(text);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return { ok: true, output: stringifyJson(parsed.value, { ...DEFAULT_FORMAT_OPTIONS, indentation: 'none', escapeUnicode: opts.escapeUnicode }) };
}

export function byteSize(text: string): number {
  return new TextEncoder().encode(text).length;
}

export interface MinifyStats {
  originalBytes: number;
  minifiedBytes: number;
  savedBytes: number;
  percentReduction: number;
}

export function computeMinifyStats(original: string, minified: string): MinifyStats {
  const originalBytes = byteSize(original);
  const minifiedBytes = byteSize(minified);
  const savedBytes = originalBytes - minifiedBytes;
  const percentReduction = originalBytes > 0 ? (savedBytes / originalBytes) * 100 : 0;
  return { originalBytes, minifiedBytes, savedBytes, percentReduction };
}
