import type { JsonValue } from '../../types/json';

export interface SampleGenOptions {
  maxArrayItems?: number;
  seed?: number;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WORDS = [
  'alpha', 'beta', 'gamma', 'delta', 'user', 'order', 'item', 'product', 'account',
  'region', 'status', 'level', 'token', 'value', 'record', 'entry', 'node', 'field',
];

export function generateSampleFromSchema(
  schema: JsonValue,
  options: SampleGenOptions = {},
): { ok: true; value: JsonValue } | { ok: false; error: string } {
  const rand = mulberry32(options.seed ?? 42);
  const maxItems = options.maxArrayItems ?? 5;

  const pickWord = (): string => WORDS[Math.floor(rand() * WORDS.length)];
  const randomId = (): string =>
    `${pickWord()}-${Math.floor(rand() * 10000)}`;
  const randomInt = (min: number, max: number): number =>
    Math.floor(rand() * (max - min + 1)) + min;

  const resolveRef = (ref: string): JsonValue | undefined => {
    if (!ref.startsWith('#/')) return undefined;
    const parts = ref.slice(2).split('/');
    let node: JsonValue | undefined = schema;
    for (const part of parts) {
      if (node === null || typeof node !== 'object') return undefined;
      node = (node as Record<string, JsonValue>)[part];
    }
    return node;
  };

  const generate = (node: JsonValue, depth: number): JsonValue | undefined => {
    if (depth > 10) return undefined;
    if (node === null || typeof node === 'boolean') {
      if (node === false) return undefined;
      return null;
    }
    if (typeof node !== 'object') return undefined;
    const s = node as Record<string, JsonValue>;

    if (typeof s.enum !== 'undefined' && Array.isArray(s.enum) && s.enum.length > 0) {
      return s.enum[Math.floor(rand() * s.enum.length)];
    }
    if (typeof s.const !== 'undefined') return s.const;
    if (typeof s.$ref === 'string') {
      const resolved = resolveRef(s.$ref);
      if (resolved !== undefined) return generate(resolved, depth + 1);
    }
    if (Array.isArray(s.anyOf) && s.anyOf.length > 0) {
      return generate(s.anyOf[Math.floor(rand() * s.anyOf.length)], depth + 1);
    }
    if (Array.isArray(s.oneOf) && s.oneOf.length > 0) {
      return generate(s.oneOf[Math.floor(rand() * s.oneOf.length)], depth + 1);
    }
    if (Array.isArray(s.allOf) && s.allOf.length > 0) {
      let merged: JsonValue | undefined;
      for (const sub of s.allOf) {
        const subValue = generate(sub, depth + 1);
        if (subValue !== undefined && typeof subValue === 'object' && !Array.isArray(subValue)) {
          merged = { ...(merged as Record<string, JsonValue>), ...(subValue as Record<string, JsonValue>) };
        }
      }
      if (merged !== undefined) return merged;
    }

    const type = Array.isArray(s.type) ? (s.type[0] as string) : ((s.type as string) ?? guessType(node));
    switch (type) {
      case 'null':
        return null;
      case 'boolean':
        return rand() > 0.5;
      case 'integer': {
        const min = typeof s.minimum === 'number' ? Math.ceil(s.minimum) : 1;
        const max = typeof s.maximum === 'number' ? Math.floor(s.maximum) : Math.max(min + 10, 100);
        return randomInt(min, max);
      }
      case 'number': {
        const min = typeof s.minimum === 'number' ? s.minimum : 0;
        const max = typeof s.maximum === 'number' ? s.maximum : min + 100;
        return Math.round((min + rand() * (max - min)) * 100) / 100;
      }
      case 'string': {
        const format = s.format as string | undefined;
        const pattern = s.pattern as string | undefined;
        if (format === 'email') return `user.${randomId()}@example.com`;
        if (format === 'uuid') return randomUuid();
        if (format === 'date-time') return new Date(Date.now() - Math.floor(rand() * 1e10)).toISOString();
        if (format === 'date') return new Date(Date.now() - Math.floor(rand() * 1e10)).toISOString().slice(0, 10);
        if (format === 'time') return `${String(randomInt(0, 23)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`;
        if (format === 'uri' || format === 'url') return `https://example.com/${pickWord()}`;
        if (format === 'ipv4') return `${randomInt(10, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
        if (pattern) {
          try {
            return mockPattern(pattern, rand);
          } catch {
            return `${pickWord()}-${randomId()}`;
          }
        }
        if (typeof s.minLength === 'number' && typeof s.maxLength === 'number') {
          const len = randomInt(s.minLength, s.maxLength);
          return Array.from({ length: Math.min(len, 32) }, () => pickWord()).join(' ');
        }
        return `${pickWord()}-${randomId()}`;
      }
      case 'array': {
        const items = s.items as JsonValue | undefined;
        const min = typeof s.minItems === 'number' ? s.minItems : 1;
        const max = typeof s.maxItems === 'number' ? Math.min(s.maxItems, maxItems) : maxItems;
        const count = randomInt(Math.min(min, max), max);
        const out: JsonValue[] = [];
        for (let i = 0; i < count; i += 1) {
          const item = items !== undefined ? generate(items, depth + 1) : null;
          if (item !== undefined) out.push(item);
        }
        return out;
      }
      case 'object': {
        const props = (s.properties as Record<string, JsonValue> | undefined) ?? {};
        const required: string[] = Array.isArray(s.required)
          ? s.required.filter((k): k is string => typeof k === 'string')
          : Object.keys(props);
        const out: Record<string, JsonValue> = {};
        for (const key of Object.keys(props)) {
          const propValue = generate(props[key], depth + 1);
          if (propValue !== undefined) out[key] = propValue;
        }
        for (const key of required) {
          if (!(key in out)) out[key] = generate(props[key] ?? { type: 'string' }, depth + 1) ?? null;
        }
        const additional = s.additionalProperties;
        if (out && Object.keys(out).length === 0 && additional !== false && additional !== undefined) {
          out[pickWord()] = generate(additional === true ? { type: 'string' } : additional, depth + 1) ?? null;
        }
        return out;
      }
      default:
        return null;
    }
  };

  try {
    const value = generate(schema, 0);
    if (value === undefined) return { ok: false, error: 'Could not generate a value from this schema.' };
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to generate sample data.' };
  }
}

function randomUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function guessType(node: JsonValue): string {
  if (node === null || typeof node !== 'object') return 'string';
  if (Array.isArray(node)) return 'array';
  return 'object';
}

function mockPattern(pattern: string, rand: () => number): string {
  let out = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern[i];
    if (ch === '\\') {
      out += pattern[i + 1] ?? '';
      i += 1;
    } else if (ch === '.') {
      out += String.fromCharCode(97 + Math.floor(rand() * 26));
    } else if (ch === '\\d' || ch === 'd') {
      out += String(Math.floor(rand() * 10));
    } else if (ch === '[') {
      const end = pattern.indexOf(']', i);
      if (end === -1) break;
      const body = pattern.slice(i + 1, end);
      out += body[Math.floor(rand() * body.length)] ?? '';
      i = end;
    } else {
      out += ch;
    }
  }
  return out;
}
