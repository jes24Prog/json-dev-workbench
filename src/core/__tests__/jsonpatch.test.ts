import { applyPatch, validatePatch, generatePatch, applyMergePatch, toMergePatch, type PatchOp } from '../jsonpatch';

const doc = { a: { b: [1, 2, 3] }, keep: 'x' };

describe('validatePatch', () => {
  it('accepts a valid patch', () => {
    expect(validatePatch([{ op: 'add', path: '/c', value: 1 }]).ok).toBe(true);
  });

  it('rejects missing op', () => {
    expect(validatePatch([{ path: '/c' } as unknown as PatchOp]).ok).toBe(false);
  });

  it('rejects unknown operations', () => {
    expect(validatePatch([{ op: 'explode', path: '/c' } as unknown as PatchOp]).ok).toBe(false);
  });

  it('rejects paths without a leading slash', () => {
    expect(validatePatch([{ op: 'remove', path: 'c' }]).ok).toBe(false);
  });

  it('requires from for move and copy', () => {
    expect(validatePatch([{ op: 'move', path: '/c' }]).ok).toBe(false);
    expect(validatePatch([{ op: 'move', path: '/c', from: '/a' }]).ok).toBe(true);
  });

  it('requires value for add, replace, test', () => {
    expect(validatePatch([{ op: 'replace', path: '/a' }]).ok).toBe(false);
  });
});

describe('applyPatch', () => {
  it('adds a new member', () => {
    const result = applyPatch(doc, [{ op: 'add', path: '/c', value: 4 }]);
    expect(result.ok).toBe(true);
    expect(result.value).toEqual({ a: { b: [1, 2, 3] }, keep: 'x', c: 4 });
  });

  it('inserts into arrays', () => {
    const result = applyPatch(doc, [{ op: 'add', path: '/a/b/1', value: 99 }]);
    expect(result.ok).toBe(true);
    expect(result.value).toEqual({ a: { b: [1, 99, 2, 3] }, keep: 'x' });
  });

  it('replaces values', () => {
    const result = applyPatch(doc, [{ op: 'replace', path: '/a/b/0', value: 10 }]);
    expect(result.ok).toBe(true);
    expect((result.value as typeof doc).a.b[0]).toBe(10);
  });

  it('removes members and array items', () => {
    expect(applyPatch(doc, [{ op: 'remove', path: '/keep' }]).value).toEqual({ a: { b: [1, 2, 3] } });
    expect(applyPatch(doc, [{ op: 'remove', path: '/a/b/1' }]).value).toEqual({ a: { b: [1, 3] }, keep: 'x' });
  });

  it('moves and copies nodes', () => {
    const moved = applyPatch(doc, [{ op: 'move', from: '/keep', path: '/renamed' }]);
    expect(moved.ok).toBe(true);
    expect(moved.value).toEqual({ a: { b: [1, 2, 3] }, renamed: 'x' });

    const copied = applyPatch(doc, [{ op: 'copy', from: '/keep', path: '/keep2' }]);
    expect(copied.ok).toBe(true);
    expect((copied.value as Record<string, unknown>).keep2).toBe('x');
  });

  it('supports test guards', () => {
    const ok = applyPatch(doc, [{ op: 'test', path: '/keep', value: 'x' }]);
    expect(ok.ok).toBe(true);
    const fail = applyPatch(doc, [{ op: 'test', path: '/keep', value: 'y' }]);
    expect(fail.ok).toBe(false);
  });

  it('fails cleanly on invalid operations', () => {
    const result = applyPatch(doc, [{ op: 'remove', path: '/missing' }]);
    expect(result.ok).toBe(false);
  });

  it('does not mutate the original document', () => {
    applyPatch(doc, [{ op: 'add', path: '/c', value: 4 }]);
    expect('c' in doc).toBe(false);
  });

  it('applies a sequence of operations', () => {
    const patch: PatchOp[] = [
      { op: 'add', path: '/n', value: 1 },
      { op: 'replace', path: '/keep', value: 'y' },
      { op: 'remove', path: '/a/b/0' },
    ];
    const result = applyPatch(doc, patch);
    expect(result.ok).toBe(true);
    expect(result.value).toEqual({ a: { b: [2, 3] }, keep: 'y', n: 1 });
  });
});

describe('generatePatch', () => {
  it('produces an empty patch for equal documents', () => {
    const { patch, equal } = generatePatch({ a: 1 }, { a: 1 });
    expect(equal).toBe(true);
    expect(patch).toHaveLength(0);
  });

  it('generates a patch that replays onto the left document', () => {
    const left = { a: 1, b: [1, 2], c: { keep: true } };
    const right = { a: 2, b: [1, 2, 3], d: 'new' };
    const { patch, equal } = generatePatch(left, right);
    expect(equal).toBe(false);
    const result = applyPatch(left, patch);
    expect(result.ok).toBe(true);
    expect(result.value).toEqual(right);
  });
});

describe('applyMergePatch', () => {
  it('merges objects and removes keys with null', () => {
    const result = applyMergePatch({ a: 1, b: 2, nested: { x: 1 } }, { b: null, c: 3, nested: { y: 2 } });
    expect(result).toEqual({ a: 1, c: 3, nested: { x: 1, y: 2 } });
  });

  it('replaces non-object targets', () => {
    expect(applyMergePatch(5, { a: 1 })).toEqual({ a: 1 });
  });
});

describe('toMergePatch', () => {
  it('returns an empty object for equal documents', () => {
    expect(toMergePatch({ a: 1 }, { a: 1 })).toEqual({});
  });

  it('produces a patch that replays with applyMergePatch', () => {
    const left = { a: 1, b: { x: 1, y: 2 }, c: 3 };
    const right = { a: 2, b: { x: 1 }, d: 4 };
    const patch = toMergePatch(left, right);
    expect(applyMergePatch(left, patch)).toEqual(right);
  });
});
