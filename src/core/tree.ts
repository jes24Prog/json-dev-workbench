import type { JsonValue } from '../types/json';
import { toJsonPointer } from './json/path';

export interface TreeResult {
  ok: boolean;
  value?: JsonValue;
  error?: string;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Get the parent object/array and the child key/index for a path. */
function parentOf(root: JsonValue, path: string[]): JsonValue | undefined {
  let node: JsonValue = root;
  for (const seg of path.slice(0, -1)) {
    if (node === null || typeof node !== 'object') return undefined;
    if (Array.isArray(node)) {
      const idx = Number(seg);
      if (!Number.isInteger(idx) || idx < 0 || idx >= node.length) return undefined;
      node = node[idx];
    } else {
      const obj = node as Record<string, JsonValue>;
      if (!(seg in obj)) return undefined;
      node = obj[seg];
    }
  }
  return node;
}

function updateAtPath(root: JsonValue, path: string[], updater: (node: JsonValue | undefined, parent: JsonValue | undefined) => JsonValue | undefined): JsonValue {
  if (path.length === 0) {
    const next = updater(root, undefined);
    return next === undefined ? root : next;
  }
  const head = path[0];
  if (Array.isArray(root)) {
    const idx = Number(head);
    const result = [...root];
    const child = path.length === 1 ? updater(root[idx], root) : updateAtPath(root[idx], path.slice(1), updater);
    if (path.length === 1 && child === undefined) {
      if (idx >= 0 && idx < result.length) result.splice(idx, 1);
    } else {
      result[idx] = child as JsonValue;
    }
    return result;
  }
  const obj = root as Record<string, JsonValue>;
  const result = { ...obj };
  const child = path.length === 1 ? updater(obj[head], obj) : updateAtPath(obj[head], path.slice(1), updater);
  if (path.length === 1 && child === undefined) {
    delete result[head];
  } else {
    result[head] = child as JsonValue;
  }
  return result;
}

export function deleteAt(root: JsonValue, path: string[]): TreeResult {
  if (path.length === 0) return { ok: false, error: 'Cannot delete the root node.' };
  if (parentOf(root, path) === undefined) {
    return { ok: false, error: `Node not found at ${toJsonPointer(path)}.` };
  }
  const value = updateAtPath(root, path, () => undefined);
  return { ok: true, value };
}

export function setAt(root: JsonValue, path: string[], newValue: JsonValue): TreeResult {
  if (path.length === 0) return { ok: true, value: clone(newValue) };
  if (parentOf(root, path) === undefined) {
    return { ok: false, error: `Parent node not found at ${toJsonPointer(path)}.` };
  }
  const value = updateAtPath(root, path, () => clone(newValue));
  return { ok: true, value };
}

export function renameAt(root: JsonValue, path: string[], newKey: string): TreeResult {
  if (path.length === 0) return { ok: false, error: 'Cannot rename the root node.' };
  const key = path[path.length - 1];
  const parent = parentOf(root, path);
  if (parent === undefined) return { ok: false, error: 'Parent node not found.' };
  const cleanKey = newKey.trim();
  if (cleanKey === '') return { ok: false, error: 'Property name cannot be empty.' };
  const target = getNode(root, path);
  if (target === undefined) return { ok: false, error: 'Node not found.' };
  if (Array.isArray(parent)) return { ok: false, error: 'Array items cannot be renamed. Use move instead.' };
  const obj = parent as Record<string, JsonValue>;
  if (cleanKey in obj) return { ok: false, error: `Property "${cleanKey}" already exists.` };
  const remaining = path.slice(0, -1);
  const value = updateAtPath(root, remaining, (parentNode) => {
    if (parentNode === undefined || typeof parentNode !== 'object' || Array.isArray(parentNode)) return parentNode;
    const next = { ...(parentNode as Record<string, JsonValue>) };
    delete next[key];
    next[cleanKey] = clone(target);
    return next;
  });
  return { ok: true, value };
}

export function duplicateAt(root: JsonValue, path: string[]): TreeResult {
  if (path.length === 0) return { ok: false, error: 'Cannot duplicate the root node.' };
  const parent = parentOf(root, path);
  const target = getNode(root, path);
  if (parent === undefined || target === undefined) return { ok: false, error: 'Node not found.' };
  const key = path[path.length - 1];
  const copy = clone(target);
  if (Array.isArray(parent)) {
    const idx = Number(key);
    const value = updateAtPath(root, [], (node) => {
      const arr = clone(node) as JsonValue[];
      arr.splice(idx + 1, 0, copy);
      return arr;
    });
    return { ok: true, value };
  }
  const obj = parent as Record<string, JsonValue>;
  let newKey = key + '_copy';
  let counter = 2;
  while (newKey in obj) {
    newKey = `${key}_copy${counter}`;
    counter += 1;
  }
  const value = updateAtPath(root, path.slice(0, -1), (parentNode) => {
    const next = { ...(parentNode as Record<string, JsonValue>) };
    next[newKey] = copy;
    return next;
  });
  return { ok: true, value };
}

export function addChildAt(root: JsonValue, path: string[], childKey: string, childValue: JsonValue, asArrayItem = false): TreeResult {
  const node = path.length === 0 ? root : getNode(root, path);
  if (node === undefined) return { ok: false, error: 'Parent node not found.' };
  if (Array.isArray(node)) {
    if (!asArrayItem) return { ok: false, error: 'Use "Add array item" for arrays.' };
    const value = updateAtPath(root, path, (n) => {
      const arr = clone(n) as JsonValue[];
      arr.push(clone(childValue));
      return arr;
    });
    return { ok: true, value };
  }
  if (typeof node === 'object' && node !== null) {
    const key = childKey.trim() || `property${Object.keys(node).length + 1}`;
    const obj = node as Record<string, JsonValue>;
    if (key in obj) return { ok: false, error: `Property "${key}" already exists.` };
    const value = updateAtPath(root, path, (n) => {
      const next = { ...(n as Record<string, JsonValue>) };
      next[key] = clone(childValue);
      return next;
    });
    return { ok: true, value };
  }
  return { ok: false, error: 'Cannot add children to a scalar value.' };
}

export function moveNode(root: JsonValue, fromPath: string[], toPath: string[]): TreeResult {
  const target = getNode(root, fromPath);
  if (target === undefined) return { ok: false, error: 'Source node not found.' };
  if (toPath.length === 0) return { ok: false, error: 'Cannot move a node to the root.' };
  const fromStr = toJsonPointer(fromPath);
  const toStr = toJsonPointer(toPath);
  if (toStr === fromStr) return { ok: true, value: clone(root) };
  if (toStr.startsWith(fromStr + '/')) {
    return { ok: false, error: 'Cannot move a node into its own subtree.' };
  }
  // Remove source first.
  const afterDelete = updateAtPath(root, fromPath, () => undefined);
  // Target index may shift if within the same parent before the source. Best-effort insert.
  const value = insertNode(afterDelete, toPath, clone(target));
  if (!value.ok) return value;
  return { ok: true, value: value.value };
}

function insertNode(root: JsonValue, path: string[], value: JsonValue): TreeResult {
  if (path.length === 0) return { ok: true, value };
  const parentPath = path.slice(0, -1);
  const parent = parentPath.length === 0 ? root : getNode(root, parentPath);
  if (parent === undefined) return { ok: false, error: `Target parent not found at ${toJsonPointer(parentPath)}.` };
  const key = path[path.length - 1];
  if (Array.isArray(parent)) {
    const idx = Number(key);
    const next = clone(root);
    const insertRec = (node: JsonValue): JsonValue => {
      let cur: JsonValue = node;
      for (const seg of parentPath) {
        if (typeof cur === 'object' && cur !== null) {
          cur = (cur as Record<string, JsonValue>)[seg];
        } else if (Array.isArray(cur)) {
          cur = cur[Number(seg)];
        }
      }
      const arr = cur as JsonValue[];
      const targetIdx = Number.isInteger(idx) ? idx : arr.length;
      arr.splice(Math.min(targetIdx, arr.length), 0, clone(value));
      return node;
    };
    return { ok: true, value: insertRec(next) };
  }
  if (typeof parent === 'object' && parent !== null) {
    const obj = parent as Record<string, JsonValue>;
    if (key in obj) return { ok: false, error: `Property "${key}" already exists at target.` };
    const next = clone(root);
    let cur: JsonValue = next;
    for (const seg of parentPath) {
      if (typeof cur === 'object' && cur !== null) {
        cur = (cur as Record<string, JsonValue>)[seg];
      } else if (Array.isArray(cur)) {
        cur = cur[Number(seg)];
      }
    }
    (cur as Record<string, JsonValue>)[key] = clone(value);
    return { ok: true, value: next };
  }
  return { ok: false, error: 'Cannot insert into a scalar value.' };
}

export function getNode(root: JsonValue, path: string[]): JsonValue | undefined {
  let node: JsonValue = root;
  for (const seg of path) {
    if (node === null || typeof node !== 'object') return undefined;
    if (Array.isArray(node)) {
      const idx = Number(seg);
      if (!Number.isInteger(idx) || idx < 0 || idx >= node.length) return undefined;
      node = node[idx];
    } else {
      const obj = node as Record<string, JsonValue>;
      if (!(seg in obj)) return undefined;
      node = obj[seg];
    }
  }
  return node;
}

export function previewValue(value: JsonValue): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length} item${value.length === 1 ? '' : 's'}]`;
  const keys = Object.keys(value as Record<string, JsonValue>);
  return `{${keys.length} key${keys.length === 1 ? '' : 's'}}`;
}
