import { generateTypeScript, pascalCase, camelCase } from '../typescript';
import { generateMock, generateSingleMock } from '../../mock';

describe('pascalCase / camelCase', () => {
  it('converts kebab and snake case', () => {
    expect(pascalCase('user-profile')).toBe('UserProfile');
    expect(camelCase('user-profile')).toBe('userProfile');
    expect(camelCase('full_name')).toBe('fullName');
  });

  it('prefixes leading digits', () => {
    expect(pascalCase('2fa')).toBe('_2fa');
  });
});

describe('generateTypeScript', () => {
  it('generates interfaces for nested objects', () => {
    const result = generateTypeScript({ id: 1, user: { name: 'Ada' } }, { rootName: 'Root' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('export interface Root {');
    expect(result.output).toContain('export interface RootUser {');
    expect(result.output).toContain('name: string;');
  });

  it('handles empty root objects', () => {
    const result = generateTypeScript({}, { rootName: 'Empty' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('Record<string, unknown>');
  });

  it('generates union item types for arrays', () => {
    const result = generateTypeScript([1, 'a'], { rootName: 'Items' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('Items');
  });

  it('supports type-alias mode', () => {
    const result = generateTypeScript({ a: 1 }, { rootName: 'Root', useType: true });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('export type Root =');
  });

  it('handles primitive roots', () => {
    const result = generateTypeScript(42, { rootName: 'Num' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('Num');
  });
});

describe('generateMock', () => {
  it('generates the requested number of seeded records', () => {
    const result = generateMock({
      count: 3,
      seed: 42,
      nullable: 0,
      wrapInArray: true,
      fields: [
        { key: 'id', type: 'integer', nullable: 0 },
        { key: 'email', type: 'email', nullable: 0 },
      ],
    });
    expect(result.ok).toBe(true);
    const value = result.value as Array<{ id: number; email: string }>;
    expect(value).toHaveLength(3);
    expect(value[0].email).toMatch(/@/);
  });

  it('is deterministic for a given seed', () => {
    const config = { count: 2, seed: 7, nullable: 0, wrapInArray: true, fields: [{ key: 'name', type: 'name' as const, nullable: 0 }] };
    const a = generateMock(config).value as Array<{ name: string }>;
    const b = generateMock(config).value as Array<{ name: string }>;
    expect(a).toEqual(b);
  });

  it('honours nullable percentage', () => {
    const result = generateMock({
      count: 100,
      seed: 5,
      nullable: 0,
      wrapInArray: true,
      fields: [{ key: 'maybe', type: 'string', nullable: 100 }],
    });
    const value = result.value as Array<{ maybe: string | null }>;
    expect(value.every((r) => r.maybe === null)).toBe(true);
  });

  it('returns a single record when wrapInArray is false', () => {
    const result = generateMock({ count: 1, seed: 1, nullable: 0, wrapInArray: false, fields: [{ key: 'n', type: 'number', nullable: 0 }] });
    expect(Array.isArray(result.value)).toBe(false);
  });

  it('rejects empty field lists', () => {
    const result = generateMock({ count: 1, seed: 1, nullable: 0, wrapInArray: false, fields: [] });
    expect(result.ok).toBe(false);
  });

  it('rejects absurd counts', () => {
    const result = generateMock({ count: 999999, seed: 1, nullable: 0, wrapInArray: false, fields: [{ key: 'n', type: 'number', nullable: 0 }] });
    expect(result.ok).toBe(false);
  });

  it('builds nested objects and arrays', () => {
    const result = generateMock({
      count: 1,
      seed: 1,
      nullable: 0,
      wrapInArray: false,
      fields: [
        {
          key: 'meta',
          type: 'object',
          nullable: 0,
          fields: [{ key: 'tag', type: 'string', nullable: 0 }],
        },
        { key: 'list', type: 'array', arrayType: 'integer', arraySize: 4, nullable: 0 },
      ],
    });
    const value = result.value as { meta: { tag: string }; list: number[] };
    expect(typeof value.meta.tag).toBe('string');
    expect(value.list).toHaveLength(4);
  });
});

describe('generateSingleMock', () => {
  it('generates a single record', () => {
    const value = generateSingleMock([{ key: 'uuid', type: 'uuid', nullable: 0 }], 3) as { uuid: string };
    expect(value.uuid).toMatch(/^[0-9a-f-]{36}$/);
  });
});
