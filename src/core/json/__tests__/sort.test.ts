import { sortObjectKeys, sortArray, sortArraysRecursive } from '../sort';
import type { JsonValue } from '../../../types/json';

describe('sortObjectKeys', () => {
  it('sorts keys alphabetically ascending', () => {
    const sorted = sortObjectKeys({ c: 1, a: 2, b: 3 }) as Record<string, JsonValue>;
    expect(Object.keys(sorted)).toEqual(['a', 'b', 'c']);
  });

  it('sorts keys descending', () => {
    const sorted = sortObjectKeys({ c: 1, a: 2, b: 3 }, { direction: 'desc' }) as Record<string, JsonValue>;
    expect(Object.keys(sorted)).toEqual(['c', 'b', 'a']);
  });

  it('is case-sensitive by default and when requested', () => {
    expect(Object.keys(sortObjectKeys({ b: 1, A: 2 }) as Record<string, JsonValue>)).toEqual(['A', 'b']);
    expect(Object.keys(sortObjectKeys({ b: 1, A: 2 }, { caseMode: 'sensitive' }) as Record<string, JsonValue>)).toEqual(['A', 'b']);
  });

  it('sorts recursively but preserves array order', () => {
    const sorted = sortObjectKeys({ b: { d: 1, c: 2 }, a: [{ z: 1, y: 2 }] }) as JsonValue;
    expect(Object.keys(sorted as Record<string, JsonValue>)).toEqual(['a', 'b']);
    const inner = (sorted as Record<string, JsonValue>).b as Record<string, JsonValue>;
    expect(Object.keys(inner)).toEqual(['c', 'd']);
    const arr = (sorted as Record<string, JsonValue>).a as JsonValue[];
    expect(arr).toHaveLength(1);
  });

  it('does not mutate the source', () => {
    const source = { b: 1, a: 2 };
    sortObjectKeys(source);
    expect(Object.keys(source)).toEqual(['b', 'a']);
  });
});

describe('sortArray', () => {
  it('sorts primitives', () => {
    expect(sortArray([3, 1, 2])).toEqual([1, 2, 3]);
    expect(sortArray([3, 1, 2], { direction: 'desc' })).toEqual([3, 2, 1]);
  });

  it('sorts objects by a key', () => {
    const rows = [{ id: 2 }, { id: 1 }, { id: 3 }];
    expect(sortArray(rows, { arrayKey: 'id' }).map((r) => (r as { id: number }).id)).toEqual([1, 2, 3]);
  });

  it('does not mutate the input array', () => {
    const rows = [3, 1, 2];
    sortArray(rows);
    expect(rows).toEqual([3, 1, 2]);
  });
});

describe('sortArraysRecursive', () => {
  it('sorts every array in the document', () => {
    const result = sortArraysRecursive({ a: [3, 1, 2], b: { c: ['z', 'a'] } });
    expect((result as Record<string, JsonValue>).a).toEqual([1, 2, 3]);
    expect(((result as Record<string, JsonValue>).b as Record<string, JsonValue>).c).toEqual(['a', 'z']);
  });
});
