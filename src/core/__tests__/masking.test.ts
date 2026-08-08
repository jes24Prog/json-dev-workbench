import { maskString, maskJson, isMaskableKey, findSensitivePaths, SENSITIVE_KEYS_LIST } from '../masking';

describe('maskString', () => {
  it('masks with stars', () => {
    const value = 'supersecret';
    const masked = maskString(value, 'stars');
    expect(masked).toBe('*'.repeat(value.length));
    expect(masked).not.toContain('super');
  });

  it('masks with a hash', () => {
    const masked = maskString('secret-value', 'hash');
    expect(masked).toMatch(/^#[0-9a-f]{8}#$/);
  });

  it('partially masks emails', () => {
    const masked = maskString('juan@example.com', 'partial');
    expect(masked).toContain('@example.com');
    expect(masked).not.toContain('juan');
  });

  it('partially masks other strings', () => {
    const masked = maskString('hello world', 'partial');
    expect(masked.length).toBeGreaterThanOrEqual(2);
    expect(masked.includes('*')).toBe(true);
  });
});

describe('isMaskableKey', () => {
  it('recognizes sensitive key names', () => {
    expect(isMaskableKey('password')).toBe(true);
    expect(isMaskableKey('API_KEY')).toBe(true);
    expect(isMaskableKey('client_secret')).toBe(true);
    expect(isMaskableKey('notes')).toBe(false);
  });
});

describe('maskJson', () => {
  it('masks sensitive keys by default key set', () => {
    const result = maskJson({ user: { password: 'hunter2' }, ok: true }, { mode: 'stars', keys: ['password'] });
    expect(result.ok).toBe(true);
    expect(result.maskedCount).toBe(1);
    const user = (result.value as { user: { password: string } }).user;
    expect(user.password).toMatch(/^\*+$/);
    expect((result.value as { ok: boolean }).ok).toBe(true);
  });

  it('does not mutate the source document', () => {
    const source = { password: 'x' };
    maskJson(source, { mode: 'stars', keys: ['password'] });
    expect(source.password).toBe('x');
  });

  it('masks values at explicit pointers', () => {
    const result = maskJson({ a: { b: 'visible' } }, { mode: 'stars', pointers: ['/a/b'] });
    expect(result.ok).toBe(true);
    expect((result.value as { a: { b: string } }).a.b).toMatch(/^\*+$/);
    expect((result.value as { a: { b: string } }).a.b).not.toBe('visible');
  });

  it('masks values matching a regex', () => {
    const result = maskJson({ note: 'call 555-0100 now' }, { mode: 'stars', regex: '555-0100' });
    expect(result.maskedCount).toBe(1);
  });

  it('reports invalid regexes', () => {
    const result = maskJson({ a: 'x' }, { mode: 'stars', regex: '(unclosed' });
    expect(result.ok).toBe(false);
  });

  it('keeps non-string values untouched', () => {
    const result = maskJson({ n: 42, b: true, arr: [1, 2] }, { mode: 'stars', keys: ['n'] });
    expect(result.value).toEqual({ n: 42, b: true, arr: [1, 2] });
  });
});

describe('findSensitivePaths', () => {
  it('locates sensitive-key string values', () => {
    const paths = findSensitivePaths({ data: { token: 'abc', safe: 'x' } });
    expect(paths).toHaveLength(1);
    expect(paths[0].key).toBe('token');
    expect(paths[0].pointer).toBe('/data/token');
  });
});

describe('SENSITIVE_KEYS_LIST', () => {
  it('exposes the default sensitive key names', () => {
    expect(SENSITIVE_KEYS_LIST).toContain('password');
    expect(SENSITIVE_KEYS_LIST).toContain('token');
  });
});
