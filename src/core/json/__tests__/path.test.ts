import {
  toJsonPointer,
  fromJsonPointer,
  escapePointerSegment,
  unescapePointerSegment,
  getValueAtPath,
  resolvePointer,
  testPointer,
  toBracketPath,
  toJsonPathString,
} from '../path';

describe('JSON Pointers', () => {
  it('builds pointers from segments', () => {
    expect(toJsonPointer([])).toBe('/');
    expect(toJsonPointer(['a', 'b'])).toBe('/a/b');
    expect(toJsonPointer(['a', 'b/c'])).toBe('/a/b~1c');
    expect(toJsonPointer(['a~b'])).toBe('/a~0b');
  });

  it('parses pointers back into segments', () => {
    expect(fromJsonPointer('/a/b')).toEqual(['a', 'b']);
    expect(fromJsonPointer('/a/b~1c')).toEqual(['a', 'b/c']);
    expect(fromJsonPointer('/a~0b')).toEqual(['a~b']);
  });

  it('round-trips segments', () => {
    for (const seg of ['plain', 'a/b', 'a~b', 'uni-codé']) {
      expect(unescapePointerSegment(escapePointerSegment(seg))).toBe(seg);
    }
  });
});

const doc = { users: [{ id: 1, name: 'Ada' }], meta: { tags: ['x'] } };

describe('getValueAtPath', () => {
  it('reads nested values', () => {
    expect(getValueAtPath(doc, ['users', '0', 'name'])).toBe('Ada');
    expect(getValueAtPath(doc, ['meta', 'tags', '1'])).toBeUndefined();
  });

  it('returns undefined for missing paths', () => {
    expect(getValueAtPath(doc, ['missing'])).toBeUndefined();
    expect(getValueAtPath(doc, ['users', '9'])).toBeUndefined();
  });
});

describe('resolvePointer and testPointer', () => {
  it('resolves valid pointers', () => {
    expect(resolvePointer(doc, '/users/0/name')).toBe('Ada');
    expect(resolvePointer(doc, '')).toEqual(doc);
  });

  it('returns undefined for invalid pointers', () => {
    expect(resolvePointer(doc, '/nope')).toBeUndefined();
  });

  it('testPointer reports existence', () => {
    expect(testPointer(doc, '/meta/tags')).toBe(true);
    expect(testPointer(doc, '/meta/missing')).toBe(false);
  });
});

describe('path display', () => {
  it('renders bracket notation', () => {
    expect(toBracketPath(['users', '0', 'name'])).toBe('users[0].name');
  });

  it('renders JSONPath style', () => {
    expect(toJsonPathString(['a', '0', 'b'])).toBe('$.a[0].b');
  });
});
