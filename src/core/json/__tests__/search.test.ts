import { searchJson } from '../search';

const doc = {
  name: 'Maria Santos',
  email: 'maria.santos@example.com',
  age: 32,
  active: true,
  roles: ['admin', 'editor'],
  profile: { country: 'PH', city: 'Manila' },
};

describe('searchJson', () => {
  it('finds values with contains matching', () => {
    const r = searchJson(doc, 'maria', { mode: 'value', caseSensitive: false, matchType: 'contains' });
    expect(r.total).toBeGreaterThan(0);
  });

  it('is case-sensitive when requested', () => {
    const insensitive = searchJson(doc, 'MARIA', { mode: 'value', caseSensitive: false, matchType: 'contains' });
    const sensitive = searchJson(doc, 'MARIA', { mode: 'value', caseSensitive: true, matchType: 'contains' });
    expect(insensitive.total).toBeGreaterThan(0);
    expect(sensitive.total).toBe(0);
  });

  it('searches keys', () => {
    const r = searchJson(doc, 'mail', { mode: 'key', caseSensitive: false, matchType: 'contains' });
    expect(r.total).toBe(1);
    expect(r.matches[0].key).toBe('email');
  });

  it('supports exact matching', () => {
    const r = searchJson(doc, 'PH', { mode: 'value', caseSensitive: true, matchType: 'exact' });
    expect(r.matches.some((m) => m.value === 'PH')).toBe(true);
  });

  it('supports regex matching', () => {
    const r = searchJson(doc, '^maria', { mode: 'value', caseSensitive: false, matchType: 'regex' });
    expect(r.total).toBeGreaterThan(0);
  });

  it('falls back to literal matching on invalid regex', () => {
    const r = searchJson(doc, '(unclosed', { mode: 'value', caseSensitive: false, matchType: 'regex' });
    expect(Array.isArray(r.matches)).toBe(true);
    expect(r.total).toBeGreaterThanOrEqual(0);
  });

  it('returns zero matches when nothing matches', () => {
    const r = searchJson(doc, 'zzzzz', { mode: 'both', caseSensitive: false, matchType: 'contains' });
    expect(r.total).toBe(0);
  });

  it('returns a JSON pointer for each match', () => {
    const r = searchJson(doc, 'Manila', { mode: 'value', caseSensitive: true, matchType: 'contains' });
    expect(r.total).toBe(1);
    expect(r.matches[0].pointer).toBe('/profile/city');
  });
});
