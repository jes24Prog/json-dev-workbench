import { diffJson, changesToLines } from '../diff';

describe('diffJson', () => {
  it('reports no changes for equal documents', () => {
    const result = diffJson({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] });
    expect(result.equal).toBe(true);
    expect(result.changes).toHaveLength(0);
  });

  it('detects additions, removals, and modifications in objects', () => {
    const result = diffJson({ a: 1, b: 2 }, { a: 1, c: 3 });
    expect(result.added).toBe(1);
    expect(result.removed).toBe(1);
    expect(result.modified).toBe(0);
    expect(result.changes.some((c) => c.type === 'added' && c.key === 'c')).toBe(true);
    expect(result.changes.some((c) => c.type === 'removed' && c.key === 'b')).toBe(true);
  });

  it('detects modified values', () => {
    const result = diffJson({ a: 1 }, { a: 2 });
    expect(result.modified).toBe(1);
    const change = result.changes[0];
    expect(change.oldValue).toBe(1);
    expect(change.newValue).toBe(2);
  });

  it('diffs arrays by index', () => {
    const result = diffJson({ list: [1, 2] }, { list: [1, 2, 3] });
    expect(result.added).toBe(1);
    expect(result.changes[0].pointer).toBe('/list/2');
  });

  it('diffs nested objects', () => {
    const result = diffJson({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } });
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].pointer).toBe('/a/b/c');
  });

  it('treats structural changes as modified', () => {
    const result = diffJson({ a: 1 }, { a: [1] });
    expect(result.modified).toBe(1);
  });
});

describe('changesToLines', () => {
  it('renders a human-readable line per change', () => {
    const result = diffJson({ a: 1, b: 2 }, { a: 2, c: 3 });
    const lines = changesToLines(result.changes);
    expect(lines).toHaveLength(3);
    expect(lines.some((l) => l.startsWith('+ /c'))).toBe(true);
    expect(lines.some((l) => l.startsWith('- /b'))).toBe(true);
    expect(lines.some((l) => l.startsWith('~ /a'))).toBe(true);
  });
});
