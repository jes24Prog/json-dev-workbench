import type { JsonValue } from '../types/json';
import { walk } from './json/path';

export type MaskMode = 'partial' | 'stars' | 'hash';

export interface MaskOptions {
  mode: MaskMode;
  /** Mask values whose property name matches one of these keys. */
  keys?: string[];
  /** Mask values at these JSON Pointers. */
  pointers?: string[];
  /** Mask values matching this regex. */
  regex?: string;
  /** Replace masked values with fake data (null disables replacement). */
  fakeReplace?: boolean;
}

const SENSITIVE_KEYS = [
  'password',
  'passwd',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'apikey',
  'authorization',
  'auth',
  'accessToken',
  'refreshToken',
  'clientSecret',
  'privateKey',
  'credential',
  'cookie',
  'session',
  'otp',
  'pin',
  'creditCard',
  'cardNumber',
  'cvv',
];

export function maskString(value: string, mode: MaskMode): string {
  if (value.length === 0) return mode === 'stars' ? '***' : '***';
  switch (mode) {
    case 'stars':
      return '*'.repeat(Math.min(value.length, 12));
    case 'hash': {
      let hash = 0;
      for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) | 0;
      }
      return `#${(hash >>> 0).toString(16).padStart(8, '0')}#`;
    }
    case 'partial':
    default: {
      if (value.length <= 2) return '*'.repeat(value.length);
      if (value.includes('@')) {
        const [local, domain] = value.split('@');
        const head = local.slice(0, 2);
        return `${head}${'*'.repeat(Math.min(Math.max(local.length - 2, 2), 6))}@${domain}`;
      }
      const keep = Math.max(1, Math.floor(value.length * 0.25));
      return value.slice(0, keep) + '*'.repeat(Math.min(value.length - keep, 10));
    }
  }
}

export function isMaskableKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some((k) => lower === k || lower.includes(k));
}

export interface MaskResult {
  ok: boolean;
  value?: JsonValue;
  maskedCount: number;
  error?: string;
}

export function maskJson(root: JsonValue, options: MaskOptions): MaskResult {
  const keys = new Set((options.keys ?? []).map((k) => k.trim()).filter(Boolean));
  const pointers = new Set(
    (options.pointers ?? []).map((p) => (p.startsWith('/') ? p : '/' + p)),
  );
  let regex: RegExp | null = null;
  if (options.regex && options.regex.trim() !== '') {
    try {
      regex = new RegExp(options.regex);
    } catch {
      return { ok: false, maskedCount: 0, error: 'Invalid mask regex pattern.' };
    }
  }

  let maskedCount = 0;

  const cloneAndMask = (node: JsonValue, path: string[], pointer: string): JsonValue => {
    if (Array.isArray(node)) {
      return node.map((item, i) =>
        cloneAndMask(item, [...path, String(i)], `${pointer}/${i}`),
      );
    }
    if (typeof node === 'object' && node !== null) {
      const obj = node as Record<string, JsonValue>;
      const result: Record<string, JsonValue> = {};
      for (const key of Object.keys(obj)) {
        const childPointer = `${pointer}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`;
        result[key] = cloneAndMask(obj[key], [...path, key], childPointer);
      }
      return result;
    }
    if (typeof node === 'string') {
      const shouldMask =
        (path.length > 0 && keys.has(path[path.length - 1])) ||
        pointers.has(pointer) ||
        (regex !== null && regex.test(node));
      if (shouldMask) {
        maskedCount += 1;
        if (options.fakeReplace) return maskString(node, options.mode);
        return maskString(node, options.mode);
      }
      return node;
    }
    return node;
  };

  const value = cloneAndMask(root, [], '');
  return { ok: true, value, maskedCount };
}

export const SENSITIVE_KEYS_LIST = SENSITIVE_KEYS;

/** Returns the set of sensitive-key paths without mutating the document. */
export function findSensitivePaths(root: JsonValue): { path: string; pointer: string; key: string }[] {
  const results: { path: string; pointer: string; key: string }[] = [];
  for (const { path, value } of walk(root)) {
    if (path.length === 0) continue;
    const key = path[path.length - 1];
    if (typeof value === 'string' && isMaskableKey(key)) {
      results.push({
        path: path.join('.'),
        pointer: '/' + path.map((s) => s.replace(/~/g, '~0').replace(/\//g, '~1')).join('/'),
        key,
      });
    }
  }
  return results;
}
