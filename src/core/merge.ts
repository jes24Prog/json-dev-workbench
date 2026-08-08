import type { JsonValue } from '../types/json';
import { isJsonObject } from '../types/json';
import { toJsonPointer } from './json/path';

export type ArrayMergeStrategy = 'append' | 'overwrite' | 'unique';
export type ConflictStrategy = 'last-wins' | 'first-wins' | 'error';

export interface MergeOptions {
  arrays: ArrayMergeStrategy;
  conflict: ConflictStrategy;
  maxDepth: number;
}

export const DEFAULT_MERGE_OPTIONS: MergeOptions = {
  arrays: 'append',
  conflict: 'last-wins',
  maxDepth: 100,
};

export interface MergeConflict {
  path: string;
  left: JsonValue;
  right: JsonValue;
}

export interface MergeResult {
  ok: boolean;
  result?: JsonValue;
  conflicts: MergeConflict[];
  error?: string;
}

function isUniqueDeep(a: JsonValue, b: JsonValue): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function deepMerge(
  left: JsonValue,
  right: JsonValue,
  options: Partial<MergeOptions> = {},
): MergeResult {
  const opts: MergeOptions = { ...DEFAULT_MERGE_OPTIONS, ...options };
  const conflicts: MergeConflict[] = [];

  const merge = (a: JsonValue, b: JsonValue, depth: number, path: string[]): JsonValue => {
    if (depth >= opts.maxDepth) return b;
    // Arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      switch (opts.arrays) {
        case 'overwrite':
          return JSON.parse(JSON.stringify(b)) as JsonValue;
        case 'unique': {
          const result = [...JSON.parse(JSON.stringify(a)) as JsonValue[]];
          for (const item of b) {
            if (!result.some((existing) => isUniqueDeep(existing, item))) {
              result.push(JSON.parse(JSON.stringify(item)) as JsonValue);
            }
          }
          return result;
        }
        case 'append':
        default:
          return [
            ...JSON.parse(JSON.stringify(a)) as JsonValue[],
            ...JSON.parse(JSON.stringify(b)) as JsonValue[],
          ];
      }
    }
    // Objects
    if (isJsonObject(a) && isJsonObject(b)) {
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      const result: Record<string, JsonValue> = {};
      for (const key of keys) {
        const childPath = [...path, key];
        if (key in a && key in b) {
          const bothObjects = isJsonObject(a[key]) && isJsonObject(b[key]);
          const bothArrays = Array.isArray(a[key]) && Array.isArray(b[key]);
          if (bothObjects || bothArrays) {
            result[key] = merge(a[key], b[key], depth + 1, childPath);
          } else {
            if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
              if (opts.conflict === 'error') {
                conflicts.push({ path: toJsonPointer(childPath), left: a[key], right: b[key] });
              }
              if (opts.conflict === 'first-wins') {
                result[key] = JSON.parse(JSON.stringify(a[key])) as JsonValue;
              } else {
                result[key] = JSON.parse(JSON.stringify(b[key])) as JsonValue;
              }
            } else {
              result[key] = JSON.parse(JSON.stringify(a[key])) as JsonValue;
            }
          }
        } else if (key in a) {
          result[key] = JSON.parse(JSON.stringify(a[key])) as JsonValue;
        } else {
          result[key] = JSON.parse(JSON.stringify(b[key])) as JsonValue;
        }
      }
      return result;
    }
    // Primitive conflict
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      conflicts.push({ path: toJsonPointer(path), left: a, right: b });
      if (opts.conflict === 'first-wins') return a;
      if (opts.conflict === 'error') return b;
      return b;
    }
    return a;
  };

  const result = merge(left, right, 0, []);
  if (opts.conflict === 'error' && conflicts.length > 0) {
    return { ok: false, result, conflicts, error: 'Conflicts detected while merging.' };
  }
  return { ok: true, result, conflicts };
}

/** Shallow merge: top-level keys from the right override the left. */
export function shallowMerge(left: JsonValue, right: JsonValue): MergeResult {
  if (!isJsonObject(left) || !isJsonObject(right)) {
    return { ok: false, conflicts: [], error: 'Shallow merge requires two JSON objects.' };
  }
  const result: Record<string, JsonValue> = {
    ...JSON.parse(JSON.stringify(left)) as Record<string, JsonValue>,
  };
  const conflicts: MergeConflict[] = [];
  for (const key of Object.keys(right as Record<string, JsonValue>)) {
    if (key in result && JSON.stringify(result[key]) !== JSON.stringify((right as Record<string, JsonValue>)[key])) {
      conflicts.push({
        path: '/' + key,
        left: result[key],
        right: (right as Record<string, JsonValue>)[key],
      });
    }
    result[key] = JSON.parse(JSON.stringify((right as Record<string, JsonValue>)[key])) as JsonValue;
  }
  return { ok: true, result, conflicts };
}

/** Merge any number of documents (must all be objects). */
export function mergeMany(docs: JsonValue[], options: Partial<MergeOptions> = {}): MergeResult {
  if (docs.length === 0) return { ok: false, conflicts: [], error: 'Provide at least one document.' };
  let accumulator = JSON.parse(JSON.stringify(docs[0])) as JsonValue;
  const allConflicts: MergeConflict[] = [];
  for (let i = 1; i < docs.length; i += 1) {
    const merged = deepMerge(accumulator, docs[i], options);
    allConflicts.push(...merged.conflicts);
    if (!merged.ok) {
      return { ok: false, result: merged.result, conflicts: allConflicts, error: merged.error };
    }
    accumulator = merged.result as JsonValue;
  }
  return { ok: true, result: accumulator, conflicts: allConflicts };
}
