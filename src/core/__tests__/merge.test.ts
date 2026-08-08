import { deepMerge, shallowMerge, mergeMany, DEFAULT_MERGE_OPTIONS } from '../merge';

describe('deepMerge', () => {
  it('deeply merges nested objects without mutating inputs', () => {
    const left = { a: { x: 1 }, b: 2 };
    const right = { a: { y: 2 }, c: 3 };
    const result = deepMerge(left, right);
    expect(result.ok).toBe(true);
    expect(result.result).toEqual({ a: { x: 1, y: 2 }, b: 2, c: 3 });
    expect(left).toEqual({ a: { x: 1 }, b: 2 });
  });

  it('appends arrays by default', () => {
    const result = deepMerge({ a: [1] }, { a: [2, 3] });
    expect(result.ok).toBe(true);
    expect(result.result).toEqual({ a: [1, 2, 3] });
  });

  it('overwrites arrays when requested', () => {
    const result = deepMerge({ a: [1] }, { a: [2] }, { arrays: 'overwrite' });
    expect(result.result).toEqual({ a: [2] });
  });

  it('dedupes arrays in unique mode', () => {
    const result = deepMerge({ a: [1, { x: 1 }] }, { a: [1, { x: 2 }, 1] }, { arrays: 'unique' });
    expect(result.result).toEqual({ a: [1, { x: 1 }, { x: 2 }] });
  });

  it('last-wins on primitive conflicts by default', () => {
    const result = deepMerge({ a: 1 }, { a: 2 });
    expect(result.result).toEqual({ a: 2 });
  });

  it('first-wins on primitive conflicts', () => {
    const result = deepMerge({ a: 1 }, { a: 2 }, { conflict: 'first-wins' });
    expect(result.result).toEqual({ a: 1 });
  });

  it('fails with an error strategy', () => {
    const result = deepMerge({ a: 1 }, { a: 2 }, { conflict: 'error' });
    expect(result.ok).toBe(false);
    expect(result.conflicts.length).toBe(1);
    expect(result.conflicts[0].path).toBe('/a');
  });

  it('records conflicts with their path under the error strategy', () => {
    const result = deepMerge({ a: { b: 1 } }, { a: { b: 2 } }, { conflict: 'error' });
    expect(result.ok).toBe(false);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].path).toBe('/a/b');
  });

  it('obeys maxDepth', () => {
    const result = deepMerge({ a: { b: 1 } }, { a: { b: 2 } }, { maxDepth: 1 });
    expect(result.result).toEqual({ a: { b: 2 } });
  });

  it('uses defaults when no options are given', () => {
    expect(DEFAULT_MERGE_OPTIONS.arrays).toBe('append');
    expect(DEFAULT_MERGE_OPTIONS.conflict).toBe('last-wins');
  });
});

describe('shallowMerge', () => {
  it('merges top-level keys only', () => {
    const result = shallowMerge({ a: { x: 1 } }, { a: { y: 2 } });
    expect(result.result).toEqual({ a: { y: 2 } });
  });

  it('rejects non-objects', () => {
    const result = shallowMerge(5, { a: 1 });
    expect(result.ok).toBe(false);
  });
});

describe('mergeMany', () => {
  it('merges several documents in order', () => {
    const result = mergeMany([{ a: 1 }, { a: 2, b: 1 }, { c: 3 }]);
    expect(result.ok).toBe(true);
    expect(result.result).toEqual({ a: 2, b: 1, c: 3 });
  });

  it('errors when no documents are provided', () => {
    const result = mergeMany([]);
    expect(result.ok).toBe(false);
  });
});
