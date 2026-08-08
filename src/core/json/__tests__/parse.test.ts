import { parseJson } from '../parse';

describe('parseJson', () => {
  it('parses primitive values', () => {
    expect(parseJson('null').ok).toBe(true);
    expect(parseJson('true').ok).toBe(true);
    expect(parseJson('42').ok).toBe(true);
    expect(parseJson('-1.5e3').ok).toBe(true);
    expect(parseJson('"hello"').ok).toBe(true);
  });

  it('parses objects and arrays with whitespace', () => {
    const r = parseJson('  { "a": [1, 2, {"b": null}] }  ');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ a: [1, 2, { b: null }] });
  });

  it('handles unicode escapes and surrogate pairs', () => {
    const r = parseJson('"\\u0041\\uD83D\\uDE00"');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('A😀');
  });

  it('strips a UTF-8 BOM', () => {
    const r = parseJson('\uFEFF{"a":1}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ a: 1 });
  });

  it('rejects trailing data', () => {
    const r = parseJson('{"a":1} extra');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.category).toBe('TRAILING_DATA');
  });

  it('rejects trailing commas', () => {
    const arr = parseJson('[1,2,]');
    expect(arr.ok).toBe(false);
    if (!arr.ok) expect(arr.error.category).toBe('TRAILING_COMMA');
    const obj = parseJson('{"a":1,}');
    expect(obj.ok).toBe(false);
    if (!obj.ok) expect(obj.error.category).toBe('TRAILING_COMMA');
  });

  it('rejects leading zeros', () => {
    const r = parseJson('01');
    expect(r.ok).toBe(false);
  });

  it('rejects single-quoted strings', () => {
    const r = parseJson("{'a':1}");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.category).toBe('UNEXPECTED_TOKEN');
  });

  it('rejects unquoted keys', () => {
    const r = parseJson('{a:1}');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.category).toBe('UNEXPECTED_TOKEN');
  });

  it('rejects control characters in strings', () => {
    const r = parseJson('"a\nb"');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.category).toBe('INVALID_ESCAPE');
  });

  it('rejects empty input', () => {
    const r = parseJson('   ');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.category).toBe('EMPTY_INPUT');
  });

  it('reports line and column information', () => {
    const r = parseJson('{\n  "a": 1,\n  "b": }\n}');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.line).toBeGreaterThan(0);
      expect(r.error.column).toBeGreaterThan(0);
    }
  });
});
