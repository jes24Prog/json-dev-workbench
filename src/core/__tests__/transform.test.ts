import { applyTransformPipeline, flattenObject, unflattenObject, transformLabel } from '../transform';
import type { TransformOperation } from '../transform';

describe('flattenObject / unflattenObject', () => {
  it('flattens nested objects with dot notation', () => {
    const flat = flattenObject({ a: { b: { c: 1 } }, d: [1, 2] });
    expect(flat).toEqual({ 'a.b.c': 1, 'd[0]': 1, 'd[1]': 2 });
  });

  it('unflattens back to nested objects', () => {
    const nested = unflattenObject({ 'a.b.c': 1, 'd.0': 1 });
    expect(nested).toEqual({ a: { b: { c: 1 } }, d: { '0': 1 } });
  });
});

function run(op: TransformOperation, input: unknown): unknown {
  const result = applyTransformPipeline(input as never, [op]);
  expect(result.ok).toBe(true);
  return result.output;
}

describe('applyTransformPipeline', () => {
  it('renames a key at any depth', () => {
    const out = run({ id: 'x', type: 'rename', key: 'old', to: 'new' }, { old: 1, nested: { old: 2 } });
    expect(out).toEqual({ new: 1, nested: { new: 2 } });
  });

  it('deletes a key at any depth', () => {
    const out = run({ id: 'x', type: 'delete', key: 'secret' }, { secret: 'x', keep: { secret: 'y', ok: 1 } });
    expect(out).toEqual({ keep: { ok: 1 } });
  });

  it('picks only the requested keys', () => {
    const out = run({ id: 'x', type: 'pick', keys: ['id', 'name'] }, { id: 1, name: 'a', extra: 2 });
    expect(out).toEqual({ id: 1, name: 'a' });
  });

  it('omits the requested keys', () => {
    const out = run({ id: 'x', type: 'omit', keys: ['extra'] }, { id: 1, extra: 2 });
    expect(out).toEqual({ id: 1 });
  });

  it('adds a value at a path', () => {
    const out = run({ id: 'x', type: 'add', path: 'a.b', json: '42' }, {});
    expect(out).toEqual({ a: { b: 42 } });
  });

  it('moves and copies nodes', () => {
    const moved = run({ id: 'x', type: 'move', from: 'a', to: 'b' }, { a: 1 });
    expect(moved).toEqual({ b: 1 });
    const copied = run({ id: 'x', type: 'copy', from: 'a', to: 'b' }, { a: 1 });
    expect(copied).toEqual({ a: 1, b: 1 });
  });

  it('applies defaults for empty values', () => {
    const out = run({ id: 'x', type: 'defaults', key: 'port', json: '8080' }, { host: 'x' });
    expect(out).toEqual({ host: 'x', port: 8080 });
  });

  it('filters array items by a comparison', () => {
    const out = run(
      { id: 'x', type: 'filter', path: '', key: 'age', op: 'gte', value: '21' },
      [{ age: 30 }, { age: 18 }],
    );
    expect(out).toEqual([{ age: 30 }]);
  });

  it('converts value types', () => {
    const out = run({ id: 'x', type: 'convert', path: 'a', to: 'number' }, { a: '42' });
    expect(out).toEqual({ a: 42 });
  });

  it('changes string casing', () => {
    const out = run({ id: 'x', type: 'case', path: 'a', mode: 'upper' }, { a: 'hello' });
    expect(out).toEqual({ a: 'HELLO' });
  });

  it('reports an error for a missing move source', () => {
    const result = applyTransformPipeline({ a: 1 }, [{ id: 'x', type: 'move', from: 'zz', to: 'b' }]);
    expect(result.ok).toBe(false);
  });

  it('runs multiple operations in order', () => {
    const ops: TransformOperation[] = [
      { id: '1', type: 'rename', key: 'name', to: 'fullName' },
      { id: '2', type: 'omit', keys: ['secret'] },
    ];
    const result = applyTransformPipeline({ name: 'Ada', secret: 'x', ok: true }, ops);
    expect(result.ok).toBe(true);
    expect(result.output).toEqual({ fullName: 'Ada', ok: true });
    expect(result.changed).toBe(true);
  });
});

describe('transformLabel', () => {
  it('describes operations', () => {
    expect(transformLabel({ id: 'x', type: 'rename', key: 'a', to: 'b' })).toContain('a');
    expect(transformLabel({ id: 'x', type: 'convert', path: '', to: 'number' })).toContain('number');
    expect(transformLabel({ id: 'x', type: 'flatten' })).toBeTruthy();
  });
});
