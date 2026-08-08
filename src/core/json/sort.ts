import type { JsonValue } from '../../types/json';

export type SortDirection = 'asc' | 'desc';
export type SortCaseMode = 'sensitive' | 'insensitive';

export interface SortOptions {
  direction: SortDirection;
  caseMode: SortCaseMode;
  recursive: boolean;
  arrayKey?: string;
}

export const DEFAULT_SORT_OPTIONS: SortOptions = {
  direction: 'asc',
  caseMode: 'sensitive',
  recursive: true,
};

function compareStrings(a: string, b: string, caseMode: SortCaseMode): number {
  if (caseMode === 'insensitive') return a.toLowerCase().localeCompare(b.toLowerCase());
  return a.localeCompare(b);
}

function sortObjectKeysRecursive(node: JsonValue, opts: SortOptions): JsonValue {
  if (Array.isArray(node)) {
    return node.map((item) => sortObjectKeysRecursive(item, opts));
  }
  if (typeof node === 'object' && node !== null) {
    const obj = node as Record<string, JsonValue>;
    const keys = Object.keys(obj).sort((a, b) => {
      const cmp = compareStrings(a, b, opts.caseMode);
      return opts.direction === 'desc' ? -cmp : cmp;
    });
    const result: Record<string, JsonValue> = {};
    for (const key of keys) {
      result[key] = sortObjectKeysRecursive(obj[key], opts);
    }
    return result;
  }
  return node;
}

/** Sort the keys of every object in the document. Arrays keep item order. */
export function sortObjectKeys(node: JsonValue, opts: Partial<SortOptions> = {}): JsonValue {
  const merged = { ...DEFAULT_SORT_OPTIONS, ...opts };
  return sortObjectKeysRecursive(node, merged);
}

function compareValues(a: JsonValue, b: JsonValue, opts: SortOptions): number {
  const an = typeof a === 'number' ? a : null;
  const bn = typeof b === 'number' ? b : null;
  if (an !== null && bn !== null) return an - bn;
  const as = String(a);
  const bs = String(b);
  return compareStrings(as, bs, opts.caseMode);
}

/** Sort array items (optionally by a key property). */
export function sortArray(node: JsonValue[], opts: Partial<SortOptions> = {}): JsonValue[] {
  const merged = { ...DEFAULT_SORT_OPTIONS, ...opts };
  const sorted = [...node];
  if (merged.arrayKey && typeof merged.arrayKey === 'string' && merged.arrayKey.length > 0) {
    sorted.sort((a, b) => {
      const av = extractKey(a, merged.arrayKey as string);
      const bv = extractKey(b, merged.arrayKey as string);
      const cmp = compareValues(av, bv, merged);
      return merged.direction === 'desc' ? -cmp : cmp;
    });
  } else {
    sorted.sort((a, b) => {
      const cmp = compareValues(a, b, merged);
      return merged.direction === 'desc' ? -cmp : cmp;
    });
  }
  return sorted;
}

function extractKey(node: JsonValue, key: string): JsonValue {
  if (typeof node === 'object' && node !== null && !Array.isArray(node)) {
    const obj = node as Record<string, JsonValue>;
    if (key in obj) return obj[key];
    for (const part of key.split('.')) {
      if (typeof node !== 'object' || node === null) return undefined as unknown as JsonValue;
      node = (node as Record<string, JsonValue>)[part];
    }
    return node;
  }
  return undefined as unknown as JsonValue;
}

/** Sort every array in the document recursively. */
export function sortArraysRecursive(node: JsonValue, opts: Partial<SortOptions> = {}): JsonValue {
  const merged = { ...DEFAULT_SORT_OPTIONS, ...opts };
  if (Array.isArray(node)) {
    const sortedItems = sortArray(node, merged);
    return sortedItems.map((item) => sortArraysRecursive(item, merged));
  }
  if (typeof node === 'object' && node !== null) {
    const obj = node as Record<string, JsonValue>;
    const result: Record<string, JsonValue> = {};
    for (const key of Object.keys(obj)) {
      result[key] = sortArraysRecursive(obj[key], merged);
    }
    return result;
  }
  return node;
}
