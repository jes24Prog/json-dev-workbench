import { analyzeSecurity, detectSecrets, DANGEROUS_PROPERTY_NAMES } from '../security';
import type { JsonValue } from '../../types/json';

describe('detectSecrets', () => {
  it('detects an AWS access key', () => {
    const matches = detectSecrets({ env: { key: 'AKIAIOSFODNN7EXAMPLE' } });
    expect(matches.some((m) => m.type === 'AWS Access Key ID')).toBe(true);
  });

  it('detects a JWT', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.someSignature';
    const matches = detectSecrets({ token: jwt });
    expect(matches.some((m) => m.type === 'JWT')).toBe(true);
  });

  it('detects an SSH private key', () => {
    const key = '-----BEGIN RSA PRIVATE KEY-----\nMIIEow...\n-----END RSA PRIVATE KEY-----';
    const matches = detectSecrets({ pem: key });
    expect(matches.some((m) => m.type === 'Private key')).toBe(true);
  });

  it('flags sensitive property names even for short values', () => {
    const matches = detectSecrets({ password: 'abc' });
    expect(matches.some((m) => m.type === 'Sensitive property')).toBe(true);
  });

  it('reports the JSON Pointer of the match', () => {
    const matches = detectSecrets({ nested: { api_key: 'abcdefghijklmnop' } });
    expect(matches[0].pointer).toBe('/nested/api_key');
  });

  it('returns no matches for safe documents', () => {
    expect(detectSecrets({ a: 1, b: 'hello' })).toHaveLength(0);
  });
});

describe('analyzeSecurity', () => {
  it('scores clean documents highly', () => {
    const result = analyzeSecurity({ a: 1, b: 'hello' }, 20);
    expect(result.hasSecrets).toBe(false);
    expect(result.score).toBe(100);
  });

  it('flags documents with secrets', () => {
    const result = analyzeSecurity({ password: 'secret123456' }, 40);
    expect(result.hasSecrets).toBe(true);
    expect(result.score).toBeLessThan(100);
    expect(result.findings.some((f) => f.severity === 'CRITICAL')).toBe(true);
  });

  it('flags prototype pollution property names', () => {
    const result = analyzeSecurity(JSON.parse('{"__proto__":{"x":1}}'), 10);
    expect(result.findings.some((f) => f.category === 'Prototype pollution')).toBe(true);
  });

  it('warns about very deep documents', () => {
    const deep: Record<string, JsonValue> = {};
    let cursor = deep;
    for (let i = 0; i < 40; i += 1) {
      cursor.n = {};
      cursor = cursor.n as Record<string, JsonValue>;
    }
    const result = analyzeSecurity(deep, 10);
    expect(result.findings.some((f) => f.category === 'Depth')).toBe(true);
  });
});

describe('DANGEROUS_PROPERTY_NAMES', () => {
  it('lists prototype-pollution targets', () => {
    expect(DANGEROUS_PROPERTY_NAMES).toContain('__proto__');
  });
});
