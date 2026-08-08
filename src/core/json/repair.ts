import type { JsonValue } from '../../types/json';
import { stringifyJson } from './format';

/**
 * Lenient JSON parser that repairs common problems:
 *  - BOM
 *  - Line/block comments (// and /* style)
 *  - Single-quoted strings
 *  - Unquoted property names
 *  - Trailing commas
 *  - undefined / NaN / Infinity literals (mapped to null)
 *  - Hex numbers (0x...)
 *  - Missing commas between values (best-effort)
 */

interface LenientResult {
  ok: boolean;
  value?: JsonValue;
  error?: string;
  errorOffset?: number;
}

class LenientScanner {
  readonly text: string;
  pos = 0;

  constructor(text: string) {
    this.text = text;
  }

  get length(): number {
    return this.text.length;
  }

  peek(offset = 0): string | undefined {
    return this.text[this.pos + offset];
  }

  next(): string | undefined {
    return this.text[this.pos++];
  }

  eof(): boolean {
    return this.pos >= this.text.length;
  }

  skipWhitespace(): void {
    for (;;) {
      const ch = this.peek();
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
        this.next();
        continue;
      }
      if (ch === '/' && this.peek(1) === '/') {
        while (!this.eof() && this.peek() !== '\n') this.next();
        continue;
      }
      if (ch === '/' && this.peek(1) === '*') {
        this.next();
        this.next();
        while (!this.eof() && !(this.peek() === '*' && this.peek(1) === '/')) this.next();
        if (!this.eof()) {
          this.next();
          this.next();
        }
        continue;
      }
      break;
    }
  }
}

const HEX_CHARS = '0123456789abcdefABCDEF';

export function parseLenientJson(text: string): LenientResult {
  if (typeof text !== 'string') return { ok: false, error: 'No input provided.' };
  const cleaned = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const s = new LenientScanner(cleaned);
  s.skipWhitespace();
  const value = parseValue(s);
  if (value === undefined) return { ok: false, error: 'Unexpected end of input.', errorOffset: s.pos };
  if (value instanceof ReparseError) {
    return { ok: false, error: value.message, errorOffset: s.pos };
  }
  s.skipWhitespace();
  if (!s.eof()) {
    // Try inserting a comma and reparsing the remaining content.
    const rest = cleaned.slice(s.pos);
    const joined = cleaned.slice(0, s.pos).trimEnd().replace(/[,\]}\]]$/, '') + ',' + rest;
    const retry = parseLenientJson(joined);
    if (retry.ok) return retry;
    return { ok: false, error: `Unexpected content after the JSON value near offset ${s.pos}.`, errorOffset: s.pos };
  }
  return { ok: true, value: value as JsonValue };
}

class ReparseError extends Error {}

function parseValue(s: LenientScanner): JsonValue | ReparseError | undefined {
  s.skipWhitespace();
  if (s.eof()) return undefined;
  const ch = s.peek();
  switch (ch) {
    case '{':
      return parseObject(s);
    case '[':
      return parseArray(s);
    case '"':
    case "'":
      return parseString(s);
    case '-':
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
      return parseNumber(s);
    case 't':
      return consumeWord(s, 'true') ? true : new ReparseError('Expected "true".');
    case 'f':
      return consumeWord(s, 'false') ? false : new ReparseError('Expected "false".');
    case 'n':
      return consumeWord(s, 'null') ? null : new ReparseError('Expected "null".');
    case 'u':
      if (consumeWord(s, 'undefined')) return null;
      return new ReparseError('Unexpected token.');
    case 'N':
      if (consumeWord(s, 'NaN')) return null;
      return new ReparseError('Unexpected token.');
    case 'I':
      if (consumeWord(s, 'Infinity') || consumeWord(s, '-Infinity')) return null;
      return new ReparseError('Unexpected token.');
    default:
      if (ch !== undefined && /[A-Za-z_$]/.test(ch)) {
        // Unquoted identifier as a value: treat as string.
        let word = '';
        while (!s.eof() && /[A-Za-z0-9_$\- ]/.test(s.peek() as string)) {
          if (s.peek() === ' ') break;
          word += s.next();
        }
        return word;
      }
      return new ReparseError(`Unexpected token "${ch}".`);
  }
}

function consumeWord(s: LenientScanner, word: string): boolean {
  for (const c of word) {
    if (s.peek() !== c) return false;
    s.next();
  }
  return true;
}

function parseObject(s: LenientScanner): JsonValue | ReparseError {
  s.next(); // '{'
  const result: Record<string, JsonValue> = {};
  s.skipWhitespace();
  if (s.peek() === '}') {
    s.next();
    return result;
  }
  for (;;) {
    s.skipWhitespace();
    if (s.eof()) return new ReparseError('Unterminated object.');
    const ch = s.peek();
    let key: string;
    if (ch === '"' || ch === "'") {
      const parsed = parseString(s);
      if (parsed instanceof ReparseError) return parsed;
      key = parsed;
    } else if (ch !== undefined && /[A-Za-z_$]/.test(ch)) {
      key = '';
      while (!s.eof() && /[A-Za-z0-9_$-]/.test(s.peek() as string)) {
        key += s.next();
      }
    } else {
      return new ReparseError('Expected a property name.');
    }
    s.skipWhitespace();
    if (s.peek() === ':') {
      s.next();
    } else if (s.peek() === '=' && s.peek(1) === '>') {
      s.next();
      s.next();
    } else {
      // Missing colon — accept if next token parses as a value (JS object shorthand).
      const value = parseValue(s);
      if (value instanceof ReparseError || value === undefined) {
        return new ReparseError(`Expected ":" after property "${key}".`);
      }
      result[key] = value;
    }
    s.skipWhitespace();
    const next = s.peek();
    if (next === ',') {
      s.next();
      continue;
    }
    if (next === '}') {
      s.next();
      return result;
    }
    if (s.eof()) return new ReparseError('Unterminated object.');
    // Missing comma — attempt to continue.
    const value = parseValue(s);
    if (value instanceof ReparseError || value === undefined) {
      return new ReparseError(`Expected "," or "}" after property "${key}".`);
    }
    result[key] = value;
  }
}

function parseArray(s: LenientScanner): JsonValue | ReparseError {
  s.next(); // '['
  const result: JsonValue[] = [];
  s.skipWhitespace();
  if (s.peek() === ']') {
    s.next();
    return result;
  }
  for (;;) {
    const value = parseValue(s);
    if (value instanceof ReparseError || value === undefined) {
      return new ReparseError('Invalid array item.');
    }
    result.push(value);
    s.skipWhitespace();
    const next = s.peek();
    if (next === ',') {
      s.next();
      continue;
    }
    if (next === ']') {
      s.next();
      return result;
    }
    if (s.eof()) return new ReparseError('Unterminated array.');
    return new ReparseError(`Expected "," or "]" after array item ${result.length - 1}.`);
  }
}

function parseString(s: LenientScanner): string | ReparseError {
  const quote = s.next();
  let out = '';
  for (;;) {
    if (s.eof()) return new ReparseError('Unterminated string.');
    const ch = s.next() as string;
    if (ch === quote) return out;
    if (ch === '\\') {
      const esc = s.next();
      if (esc === undefined) return new ReparseError('Unterminated string escape.');
      switch (esc) {
        case 'b':
          out += '\b';
          break;
        case 'f':
          out += '\f';
          break;
        case 'n':
          out += '\n';
          break;
        case 'r':
          out += '\r';
          break;
        case 't':
          out += '\t';
          break;
        case 'v':
          out += '\v';
          break;
        case '0':
          out += '\0';
          break;
        case 'x': {
          let hex = '';
          for (let i = 0; i < 2; i += 1) {
            const h = s.next();
            if (h === undefined || !HEX_CHARS.includes(h)) return new ReparseError('Invalid hex escape.');
            hex += h;
          }
          out += String.fromCharCode(parseInt(hex, 16));
          break;
        }
        case 'u': {
          let hex = '';
          for (let i = 0; i < 4; i += 1) {
            const h = s.next();
            if (h === undefined || !HEX_CHARS.includes(h)) return new ReparseError('Invalid unicode escape.');
            hex += h;
          }
          out += String.fromCharCode(parseInt(hex, 16));
          break;
        }
        default:
          out += esc;
      }
    } else {
      out += ch;
    }
  }
}

function parseNumber(s: LenientScanner): JsonValue | ReparseError {
  let token = '';
  if (s.peek() === '-') {
    token += s.next();
  }
  if (s.peek() === '0' && (s.peek(1) === 'x' || s.peek(1) === 'X')) {
    token += s.next();
    token += s.next();
    while (!s.eof() && HEX_CHARS.includes(s.peek() as string)) token += s.next();
    const value = parseInt(token, 16);
    return Number.isFinite(value) ? value : new ReparseError('Invalid number.');
  }
  while (!s.eof() && /[0-9]/.test(s.peek() as string)) token += s.next();
  if (s.peek() === '.') {
    token += s.next();
    while (!s.eof() && /[0-9]/.test(s.peek() as string)) token += s.next();
  }
  if (s.peek() === 'e' || s.peek() === 'E') {
    token += s.next();
    if (s.peek() === '+' || s.peek() === '-') token += s.next();
    while (!s.eof() && /[0-9]/.test(s.peek() as string)) token += s.next();
  }
  const value = Number(token);
  if (!Number.isFinite(value)) return new ReparseError('Invalid number.');
  return value;
}

export interface RepairResult {
  ok: boolean;
  repaired?: string;
  original?: string;
  error?: string;
  changed: boolean;
}

export function repairJson(text: string): RepairResult {
  const parsed = parseLenientJson(text);
  if (!parsed.ok || parsed.value === undefined) {
    return {
      ok: false,
      original: text,
      error: parsed.error ?? 'Could not repair this input.',
      changed: false,
    };
  }
  const repaired = stringifyJson(parsed.value, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false });
  return {
    ok: true,
    repaired,
    original: text,
    changed: repaired !== text,
  };
}
