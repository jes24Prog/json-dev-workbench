import type { JsonValue } from '../../types/json';

export type JsonErrorCategory =
  | 'UNEXPECTED_TOKEN'
  | 'UNEXPECTED_END'
  | 'UNTERMINATED_STRING'
  | 'INVALID_NUMBER'
  | 'MISSING_COLON'
  | 'MISSING_COMMA'
  | 'MISSING_CLOSE'
  | 'TRAILING_COMMA'
  | 'TRAILING_DATA'
  | 'INVALID_ESCAPE'
  | 'EMPTY_INPUT';

export interface JsonParseError {
  message: string;
  line: number;
  column: number;
  offset: number;
  category: JsonErrorCategory | string;
  suggestion?: string;
  expected?: string[];
}

export class JsonSyntaxError extends Error {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
  readonly category: string;
  readonly suggestion?: string;
  readonly expected?: string[];

  constructor(
    message: string,
    line: number,
    column: number,
    offset: number,
    category: string,
    suggestion?: string,
    expected?: string[],
  ) {
    super(message);
    this.name = 'JsonSyntaxError';
    this.line = line;
    this.column = column;
    this.offset = offset;
    this.category = category;
    this.suggestion = suggestion;
    this.expected = expected;
  }

  toDetail(): JsonParseError {
    return {
      message: this.message,
      line: this.line,
      column: this.column,
      offset: this.offset,
      category: this.category,
      suggestion: this.suggestion,
      expected: this.expected,
    };
  }
}

class Scanner {
  readonly text: string;
  pos = 0;
  line = 1;
  column = 1;

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
    const ch = this.text[this.pos++];
    if (ch === undefined) return undefined;
    if (ch === '\n') {
      this.line += 1;
      this.column = 1;
    } else {
      this.column += 1;
    }
    return ch;
  }

  eof(): boolean {
    return this.pos >= this.text.length;
  }

  skipWhitespace(): void {
    while (!this.eof()) {
      const ch = this.peek();
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
        this.next();
      } else {
        break;
      }
    }
  }

  error(message: string, category: JsonErrorCategory, suggestion?: string, expected?: string[]): JsonSyntaxError {
    return new JsonSyntaxError(message, this.line, this.column, this.pos, category, suggestion, expected);
  }
}

const DIGITS = '0123456789';
const HEX = '0123456789abcdefABCDEF';

export function parseJson(
  text: string,
): { ok: true; value: JsonValue } | { ok: false; error: JsonParseError } {
  if (typeof text !== 'string') {
    return {
      ok: false,
      error: {
        message: 'Input is empty. Provide a JSON value to parse.',
        line: 1,
        column: 1,
        offset: 0,
        category: 'EMPTY_INPUT',
      },
    };
  }
  const cleaned = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  if (cleaned.trim().length === 0) {
    return {
      ok: false,
      error: {
        message: 'Input is empty. Provide a JSON value to parse.',
        line: 1,
        column: 1,
        offset: 0,
        category: 'EMPTY_INPUT',
      },
    };
  }
  try {
    const value = JSON.parse(cleaned) as JsonValue;
    return { ok: true, value };
  } catch {
    return parseDetailed(cleaned);
  }
}

function parseDetailed(text: string): { ok: true; value: JsonValue } | { ok: false; error: JsonParseError } {
  const s = new Scanner(text);
  const value = parseValue(s);
  if (value instanceof JsonSyntaxError) return { ok: false, error: value.toDetail() };
  s.skipWhitespace();
  if (!s.eof()) {
    return {
      ok: false,
      error: s
        .error('Unexpected content after the JSON value.', 'TRAILING_DATA')
        .toDetail(),
    };
  }
  return { ok: true, value };
}

function parseValue(s: Scanner): JsonValue | JsonSyntaxError {
  s.skipWhitespace();
  if (s.eof()) {
    return s.error('Unexpected end of input. Expected a JSON value.', 'UNEXPECTED_END');
  }
  const ch = s.peek();
  switch (ch) {
    case '{':
      return parseObject(s);
    case '[':
      return parseArray(s);
    case '"':
      return parseString(s);
    case "'":
      return s.error(
        'Single-quoted strings are not valid JSON.',
        'UNEXPECTED_TOKEN',
        'Replace single quotes with double quotes.',
      );
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
    case 'f':
    case 'n':
      return parseLiteral(s);
    default:
      if (ch !== undefined && /[A-Za-z]/.test(ch)) {
        return s.error(
          `Unexpected token "${ch}". JSON values must use double-quoted strings.`,
          'UNEXPECTED_TOKEN',
          'Wrap the value in double quotes.',
          ['string', 'number', 'boolean', 'null', 'object', 'array'],
        );
      }
      return s.error(
        `Unexpected token "${ch}".`,
        'UNEXPECTED_TOKEN',
        undefined,
        ['string', 'number', 'boolean', 'null', 'object', 'array'],
      );
  }
}

function parseObject(s: Scanner): JsonValue | JsonSyntaxError {
  s.next(); // consume '{'
  const result: Record<string, JsonValue> = {};
  s.skipWhitespace();
  if (s.peek() === '}') {
    s.next();
    return result;
  }
  for (;;) {
    s.skipWhitespace();
    if (s.eof()) {
      return s.error('Unterminated object. Missing closing "}".', 'MISSING_CLOSE');
    }
    const ch = s.peek();
    let key: string;
    if (ch === '"') {
      const parsed = parseString(s);
      if (parsed instanceof JsonSyntaxError) return parsed;
      key = parsed;
    } else {
      return s.error(
        'Expected a quoted property name.',
        'UNEXPECTED_TOKEN',
        'Property names must be wrapped in double quotes.',
      );
    }
    s.skipWhitespace();
    if (s.peek() !== ':') {
      return s.error('Expected ":" after the property name.', 'MISSING_COLON');
    }
    s.next();
    const value = parseValue(s);
    if (value instanceof JsonSyntaxError) return value;
    result[key] = value;
    s.skipWhitespace();
    const next = s.peek();
    if (next === ',') {
      s.next();
      s.skipWhitespace();
      if (s.peek() === '}') {
        return s.error('Trailing comma in object. Remove the comma before "}".', 'TRAILING_COMMA');
      }
      continue;
    }
    if (next === '}') {
      s.next();
      return result;
    }
    if (s.eof()) {
      return s.error('Unterminated object. Missing closing "}".', 'MISSING_CLOSE');
    }
    return s.error(
      'Expected "," or "}" after a property.',
      'MISSING_COMMA',
      'Add a comma between properties.',
    );
  }
}

function parseArray(s: Scanner): JsonValue | JsonSyntaxError {
  s.next(); // consume '['
  const result: JsonValue[] = [];
  s.skipWhitespace();
  if (s.peek() === ']') {
    s.next();
    return result;
  }
  for (;;) {
    const value = parseValue(s);
    if (value instanceof JsonSyntaxError) return value;
    result.push(value);
    s.skipWhitespace();
    const next = s.peek();
    if (next === ',') {
      s.next();
      s.skipWhitespace();
      if (s.peek() === ']') {
        return s.error('Trailing comma in array. Remove the comma before "]".', 'TRAILING_COMMA');
      }
      continue;
    }
    if (next === ']') {
      s.next();
      return result;
    }
    if (s.eof()) {
      return s.error('Unterminated array. Missing closing "]".', 'MISSING_CLOSE');
    }
    return s.error(
      'Expected "," or "]" after an array item.',
      'MISSING_COMMA',
      'Add a comma between array items.',
    );
  }
}

function parseString(s: Scanner): string | JsonSyntaxError {
  s.next(); // consume '"'
  let out = '';
  for (;;) {
    if (s.eof()) {
      return s.error('Unterminated string. Missing closing quote.', 'UNTERMINATED_STRING');
    }
    const ch = s.next();
    if (ch === '"') return out;
    if (ch === '\\') {
      const esc = s.next();
      if (esc === undefined) {
        return s.error('Unterminated string escape.', 'UNTERMINATED_STRING');
      }
      switch (esc) {
        case '"':
          out += '"';
          break;
        case '\\':
          out += '\\';
          break;
        case '/':
          out += '/';
          break;
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
        case 'u': {
          let hex = '';
          for (let i = 0; i < 4; i += 1) {
            const h = s.next();
            if (h === undefined || !HEX.includes(h)) {
              return s.error('Invalid unicode escape. Expected 4 hex digits.', 'INVALID_ESCAPE');
            }
            hex += h;
          }
          out += String.fromCharCode(parseInt(hex, 16));
          break;
        }
        default:
          return s.error(`Invalid escape sequence "\\${esc}".`, 'INVALID_ESCAPE');
      }
    } else {
      if (ch !== undefined && ch.charCodeAt(0) < 0x20) {
        return s.error('Control characters must be escaped in strings.', 'INVALID_ESCAPE');
      }
      out += ch;
    }
  }
}

function parseNumber(s: Scanner): JsonValue | JsonSyntaxError {
  const startLine = s.line;
  const startCol = s.column;
  const startPos = s.pos;
  let digits = '';
  let isNegative = false;
  let isDecimal = false;
  let isExponent = false;
  if (s.peek() === '-') {
    isNegative = true;
    s.next();
  }
  // integer part
  let ch = s.peek();
  if (ch === '0') {
    s.next();
    digits += '0';
  } else if (ch !== undefined && DIGITS.includes(ch)) {
    while (!s.eof() && DIGITS.includes(s.peek() as string)) {
      digits += s.next();
    }
  } else {
    return s.error('Invalid number.', 'INVALID_NUMBER');
  }
  if (s.peek() === '.') {
    isDecimal = true;
    s.next();
    if (!s.eof() && DIGITS.includes(s.peek() as string)) {
      digits += '.';
      while (!s.eof() && DIGITS.includes(s.peek() as string)) {
        digits += s.next();
      }
    } else {
      return s.error('Invalid number. Expected digits after the decimal point.', 'INVALID_NUMBER');
    }
  }
  ch = s.peek();
  if (ch === 'e' || ch === 'E') {
    isExponent = true;
    s.next();
    let sign = '';
    const signCh = s.peek();
    if (signCh === '+' || signCh === '-') {
      sign = s.next() as string;
    }
    if (!s.eof() && DIGITS.includes(s.peek() as string)) {
      digits += 'e' + sign;
      while (!s.eof() && DIGITS.includes(s.peek() as string)) {
        digits += s.next();
      }
    } else {
      return s.error('Invalid number. Expected digits in the exponent.', 'INVALID_NUMBER');
    }
  }
  if (!isDecimal && !isExponent) {
    // leading zero check (e.g. 01)
    if (digits.length > 1 && digits[0] === '0') {
      return new JsonSyntaxError(
        'Invalid number. Leading zeros are not allowed.',
        startLine,
        startCol,
        startPos,
        'INVALID_NUMBER',
      );
    }
  }
  const token = (isNegative ? '-' : '') + digits;
  const value = Number(token);
  if (!Number.isFinite(value)) {
    return new JsonSyntaxError('Number is out of range.', startLine, startCol, startPos, 'INVALID_NUMBER');
  }
  return value;
}

function parseLiteral(s: Scanner): JsonValue | JsonSyntaxError {
  const startLine = s.line;
  const startCol = s.column;
  const startPos = s.pos;
  if (s.peek() === 't') {
    for (const c of 'true') {
      if (s.peek() !== c) {
        return new JsonSyntaxError('Invalid literal. Expected "true".', startLine, startCol, startPos, 'UNEXPECTED_TOKEN');
      }
      s.next();
    }
    return true;
  }
  if (s.peek() === 'f') {
    for (const c of 'false') {
      if (s.peek() !== c) {
        return new JsonSyntaxError('Invalid literal. Expected "false".', startLine, startCol, startPos, 'UNEXPECTED_TOKEN');
      }
      s.next();
    }
    return false;
  }
  if (s.peek() === 'n') {
    for (const c of 'null') {
      if (s.peek() !== c) {
        return new JsonSyntaxError('Invalid literal. Expected "null".', startLine, startCol, startPos, 'UNEXPECTED_TOKEN');
      }
      s.next();
    }
    return null;
  }
  return new JsonSyntaxError('Invalid literal.', startLine, startCol, startPos, 'UNEXPECTED_TOKEN');
}
