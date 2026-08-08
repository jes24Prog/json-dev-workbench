import { analyzeJson, estimateJsonBytes, findDeepestNodes } from '../stats';

describe('analyzeJson', () => {
  it('counts nodes by type', () => {
    const stats = analyzeJson({ a: [1, 2, null], b: true, c: 'x', d: { e: 3 } });
    expect(stats.objects).toBe(2);
    expect(stats.arrays).toBe(1);
    expect(stats.strings).toBe(1);
    expect(stats.numbers).toBe(3);
    expect(stats.booleans).toBe(1);
    expect(stats.nulls).toBe(1);
    expect(stats.totalNodes).toBe(9);
  });

  it('reports max depth', () => {
    expect(analyzeJson({ a: { b: { c: 1 } } }).maxDepth).toBe(3);
    expect(analyzeJson(1).maxDepth).toBe(0);
  });

  it('handles the empty document', () => {
    const stats = analyzeJson({});
    expect(stats.totalNodes).toBe(1);
    expect(stats.rootType).toBe('object');
  });

  it('tracks largest arrays and objects', () => {
    const stats = analyzeJson({ small: [], big: Array.from({ length: 50 }, () => 1) });
    expect(stats.largestArrays[0].length).toBe(50);
    const objStats = analyzeJson({ a: { k1: 1, k2: 2, k3: 3 } });
    expect(objStats.largestObjects[0].keys).toBe(3);
  });

  it('identifies the root type', () => {
    expect(analyzeJson(null).rootType).toBe('null');
    expect(analyzeJson([]).rootType).toBe('array');
    expect(analyzeJson({}).rootType).toBe('object');
    expect(analyzeJson(5).rootType).toBe('number');
  });
});

describe('estimateJsonBytes', () => {
  it('estimates a positive byte size', () => {
    expect(estimateJsonBytes({ a: 'hello' })).toBeGreaterThan(0);
  });
});

describe('findDeepestNodes', () => {
  it('finds the deepest paths', () => {
    const nodes = findDeepestNodes({ a: { b: { c: 1 } } }, 10);
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes[0].depth).toBe(3);
  });
});
