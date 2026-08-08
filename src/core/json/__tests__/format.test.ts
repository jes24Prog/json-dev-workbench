import { formatJsonText, minifyJsonText, stringifyJson, computeMinifyStats, byteSize } from '../format';
import { parseJson } from '../parse';

const input = '{ "b": 2, "a": [1, { "z": null }] }';

describe('formatJsonText', () => {
  it('pretty-prints with default options', () => {
    const r = formatJsonText(input);
    expect(r.ok).toBe(true);
    expect(r.output!).toBe('{\n  "b": 2,\n  "a": [\n    1,\n    {\n      "z": null\n    }\n  ]\n}');
  });

  it('respects indentation width', () => {
    const r = formatJsonText(input, { indentation: 4, sortKeys: false, sortArrays: false, escapeUnicode: false });
    expect(r.ok).toBe(true);
    expect(r.output!).toContain('    "b": 2');
  });

  it('sorts keys when requested', () => {
    const r = formatJsonText('{"z":1,"a":2}', { indentation: 2, sortKeys: true, sortArrays: false, escapeUnicode: false });
    expect(r.ok).toBe(true);
    const output = r.output!;
    expect(output).toContain('"a": 2');
    expect(output.indexOf('"a"')).toBeLessThan(output.indexOf('"z"'));
  });

  it('escapes unicode when requested', () => {
    const r = formatJsonText('{"x":"héllo"}', { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: true });
    expect(r.ok).toBe(true);
    expect(r.output!).toContain('\\u00e9');
  });

  it('returns an error for invalid JSON', () => {
    const r = formatJsonText('{invalid');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeDefined();
  });
});

describe('minifyJsonText', () => {
  it('removes all insignificant whitespace', () => {
    const r = minifyJsonText(input);
    expect(r.ok).toBe(true);
    expect(r.output!).toBe('{"b":2,"a":[1,{"z":null}]}');
  });

  it('reports an error for invalid JSON', () => {
    const r = minifyJsonText('nope');
    expect(r.ok).toBe(false);
  });
});

describe('stringifyJson', () => {
  it('round-trips parsed values', () => {
    const parsed = parseJson(input);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      const min = stringifyJson(parsed.value, { indentation: 'none', sortKeys: false, sortArrays: false, escapeUnicode: false });
      expect(min).toBe('{"b":2,"a":[1,{"z":null}]}');
    }
  });

  it('does not mutate the input when sorting keys', () => {
    const value = { z: 1, a: 2 };
    stringifyJson(value, { indentation: 'none', sortKeys: true, sortArrays: false, escapeUnicode: false });
    expect(Object.keys(value)).toEqual(['z', 'a']);
  });
});

describe('byteSize and computeMinifyStats', () => {
  it('counts UTF-8 bytes', () => {
    expect(byteSize('héllo')).toBe(6);
  });

  it('computes reduction statistics', () => {
    const stats = computeMinifyStats('{\n  "a": 1\n}', '{"a":1}');
    expect(stats.originalBytes).toBeGreaterThan(stats.minifiedBytes);
    expect(stats.percentReduction).toBeGreaterThan(0);
  });
});
