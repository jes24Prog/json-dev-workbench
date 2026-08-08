import type { JsonValue } from '../types/json';
import { fromJsonPointer, toJsonPointer } from './json/path';
import { diffJson } from './diff';

export type PatchOpType = 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';

export interface PatchOp {
  op: PatchOpType;
  path: string;
  from?: string;
  value?: JsonValue;
}

export interface PatchResult {
  ok: boolean;
  value?: JsonValue;
  error?: string;
}

function clone<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Set value at a pointer path, creating intermediate objects/arrays as needed. */
function setAtPath(root: JsonValue, path: string[], value: JsonValue): JsonValue {
  if (path.length === 0) return value;
  const head = path[0];
  if (Array.isArray(root)) {
    const idx = Number(head);
    const next = root[idx];
    const updated = clone(root) as JsonValue[];
    updated[idx] = path.length === 1 ? value : setAtPath(next, path.slice(1), value);
    return updated;
  }
  const obj = root as Record<string, JsonValue>;
  const updated = clone(obj);
  updated[head] = path.length === 1 ? value : setAtPath(obj[head], path.slice(1), value);
  return updated;
}

function insertAtPath(root: JsonValue, path: string[], value: JsonValue): JsonValue {
  if (path.length === 0) return value;
  const head = path[0];
  if (Array.isArray(root)) {
    const idx = Number(head);
    if (path.length === 1) {
      const updated = clone(root) as JsonValue[];
      updated.splice(idx, 0, value);
      return updated;
    }
    const updated = clone(root) as JsonValue[];
    updated[idx] = insertAtPath(updated[idx], path.slice(1), value);
    return updated;
  }
  const obj = root as Record<string, JsonValue>;
  if (path.length === 1) {
    const updated = clone(obj);
    updated[head] = value;
    return updated;
  }
  const updated = clone(obj);
  updated[head] = insertAtPath(obj[head], path.slice(1), value);
  return updated;
}

function removeAtPath(root: JsonValue, path: string[]): JsonValue {
  if (path.length === 0) {
    throw new Error('Cannot remove the document root.');
  }
  const head = path[0];
  if (Array.isArray(root)) {
    const idx = Number(head);
    if (path.length === 1) {
      const updated = clone(root) as JsonValue[];
      if (idx < 0 || idx >= updated.length) throw new Error('Index out of range.');
      updated.splice(idx, 1);
      return updated;
    }
    const updated = clone(root) as JsonValue[];
    updated[idx] = removeAtPath(updated[idx], path.slice(1));
    return updated;
  }
  const obj = root as Record<string, JsonValue>;
  const updated = clone(obj);
  if (path.length === 1) {
    if (!(head in updated)) throw new Error(`Path does not exist: ${toJsonPointer(path)}`);
    delete updated[head];
    return updated;
  }
  updated[head] = removeAtPath(obj[head], path.slice(1));
  return updated;
}

function getAtPath(root: JsonValue, path: string[]): JsonValue | undefined {
  let current: JsonValue = root;
  for (const seg of path) {
    if (current === null || typeof current !== 'object') return undefined;
    if (Array.isArray(current)) {
      const idx = Number(seg);
      if (!Number.isInteger(idx) || idx < 0 || idx >= current.length) return undefined;
      current = current[idx];
    } else {
      const obj = current as Record<string, JsonValue>;
      if (!(seg in obj)) return undefined;
      current = obj[seg];
    }
  }
  return current;
}

export function validatePatch(patch: PatchOp[]): { ok: boolean; error?: string } {
  if (!Array.isArray(patch)) return { ok: false, error: 'Patch must be an array of operations.' };
  for (const op of patch) {
    if (!op || typeof op !== 'object' || typeof op.op !== 'string') {
      return { ok: false, error: 'Each patch operation must have an "op" field.' };
    }
    if (!['add', 'remove', 'replace', 'move', 'copy', 'test'].includes(op.op)) {
      return { ok: false, error: `Unknown operation "${op.op}".` };
    }
    if (typeof op.path !== 'string' || !op.path.startsWith('/')) {
      return { ok: false, error: 'Each operation must have a "/" prefixed "path".' };
    }
    if ((op.op === 'move' || op.op === 'copy') && (typeof op.from !== 'string' || !op.from.startsWith('/'))) {
      return { ok: false, error: `Operation "${op.op}" requires a "/" prefixed "from".` };
    }
    if ((op.op === 'add' || op.op === 'replace' || op.op === 'test') && !('value' in op)) {
      return { ok: false, error: `Operation "${op.op}" requires a "value".` };
    }
  }
  return { ok: true };
}

export function applyPatch(doc: JsonValue, patch: PatchOp[]): PatchResult {
  const valid = validatePatch(patch);
  if (!valid.ok) return { ok: false, error: valid.error };
  let current = clone(doc);
  try {
    for (const op of patch) {
      const path = fromJsonPointer(op.path);
      switch (op.op) {
        case 'add':
          current = insertAtPath(current, path, op.value as JsonValue);
          break;
        case 'remove':
          current = removeAtPath(current, path);
          break;
        case 'replace': {
          const existing = getAtPath(current, path);
          if (existing === undefined && path.length > 0 && !Array.isArray(current)) {
            // Allow replace on missing path if parent exists (lenient); RFC says it must exist.
          }
          current = setAtPath(current, path, op.value as JsonValue);
          break;
        }
        case 'move': {
          const fromPath = fromJsonPointer(op.from as string);
          const value = getAtPath(current, fromPath);
          if (value === undefined) {
            return { ok: false, error: `Move "from" path does not exist: ${op.from}` };
          }
          current = removeAtPath(current, fromPath);
          current = insertAtPath(current, path, value);
          break;
        }
        case 'copy': {
          const fromPath = fromJsonPointer(op.from as string);
          const value = getAtPath(current, fromPath);
          if (value === undefined) {
            return { ok: false, error: `Copy "from" path does not exist: ${op.from}` };
          }
          current = insertAtPath(current, path, clone(value));
          break;
        }
        case 'test': {
          const actual = getAtPath(current, path);
          if (JSON.stringify(actual) !== JSON.stringify(op.value)) {
            return {
              ok: false,
              error: `Test failed at ${op.path}: expected ${JSON.stringify(op.value)}, got ${JSON.stringify(actual)}`,
            };
          }
          break;
        }
      }
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to apply patch.' };
  }
  return { ok: true, value: current };
}

/** Generate an RFC 6902 patch between two documents using the diff engine. */
export function generatePatch(left: JsonValue, right: JsonValue): { patch: PatchOp[]; equal: boolean } {
  const { changes } = diffJson(left, right);
  const patch: PatchOp[] = [];
  // Apply removals deepest-first, additions shallowest-first to keep indices valid.
  const removals = changes.filter((c) => c.type === 'removed').sort((a, b) => b.path.length - a.path.length);
  const additions = changes.filter((c) => c.type === 'added').sort((a, b) => a.path.length - b.path.length);
  const modified = changes.filter((c) => c.type === 'modified');

  for (const c of additions) patch.push({ op: 'add', path: c.pointer, value: c.newValue });
  for (const c of removals) patch.push({ op: 'remove', path: c.pointer });
  for (const c of modified) patch.push({ op: 'replace', path: c.pointer, value: c.newValue });
  return { patch, equal: changes.length === 0 };
}

/** JSON Merge Patch (RFC 7396). */
export function applyMergePatch(target: JsonValue, patch: JsonValue): JsonValue {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    return clone(patch);
  }
  const targetObj = (typeof target === 'object' && target !== null && !Array.isArray(target)
    ? target
    : {}) as Record<string, JsonValue>;
  const result = clone(targetObj);
  for (const key of Object.keys(patch as Record<string, JsonValue>)) {
    const patchValue = (patch as Record<string, JsonValue>)[key];
    if (patchValue === null) {
      delete result[key];
    } else {
      result[key] = applyMergePatch(result[key], patchValue);
    }
  }
  return result;
}

export function toMergePatch(left: JsonValue, right: JsonValue): JsonValue {
  if (JSON.stringify(left) === JSON.stringify(right)) return {};
  if (typeof left !== 'object' || left === null || Array.isArray(left) || typeof right !== 'object' || right === null || Array.isArray(right)) {
    return clone(right);
  }
  const lObj = left as Record<string, JsonValue>;
  const rObj = right as Record<string, JsonValue>;
  const result: Record<string, JsonValue> = {};
  for (const key of Object.keys(rObj)) {
    if (!(key in lObj)) {
      result[key] = clone(rObj[key]);
    } else {
      const merged = toMergePatch(lObj[key], rObj[key]);
      if (JSON.stringify(merged) !== '{}' || JSON.stringify(lObj[key]) !== JSON.stringify(rObj[key])) {
        result[key] = merged;
      }
    }
  }
  for (const key of Object.keys(lObj)) {
    if (!(key in rObj)) result[key] = null;
  }
  return result;
}
