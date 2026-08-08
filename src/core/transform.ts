import type { JsonValue } from '../types/json';
import { getValueAtPath, toJsonPointer } from './json/path';
import { sortArray, sortObjectKeys } from './json/sort';

export type CompareOp = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'notContains' | 'exists';

export type TransformOperation =
  | { id: string; type: 'rename'; key: string; to: string }
  | { id: string; type: 'delete'; key: string }
  | { id: string; type: 'pick'; keys: string[] }
  | { id: string; type: 'omit'; keys: string[] }
  | { id: string; type: 'add'; path: string; json: string }
  | { id: string; type: 'move'; from: string; to: string }
  | { id: string; type: 'copy'; from: string; to: string }
  | { id: string; type: 'flatten' }
  | { id: string; type: 'unflatten' }
  | { id: string; type: 'defaults'; key: string; json: string }
  | { id: string; type: 'filter'; path: string; key: string; op: CompareOp; value: string }
  | { id: string; type: 'sort'; path: string; key?: string; direction: 'asc' | 'desc' }
  | { id: string; type: 'groupBy'; path: string; key: string }
  | { id: string; type: 'dedupe'; path: string; key?: string }
  | { id: string; type: 'unique'; path: string }
  | { id: string; type: 'convert'; path: string; to: 'string' | 'number' | 'boolean' | 'null' }
  | { id: string; type: 'case'; path: string; mode: 'upper' | 'lower' | 'title' };

export type TransformOperationType = TransformOperation['type'];

export const TRANSFORM_OPERATION_TYPES: TransformOperationType[] = [
  'rename',
  'delete',
  'pick',
  'omit',
  'add',
  'move',
  'copy',
  'flatten',
  'unflatten',
  'defaults',
  'filter',
  'sort',
  'groupBy',
  'dedupe',
  'unique',
  'convert',
  'case',
];

export interface TransformResult {
  ok: boolean;
  output?: JsonValue;
  error?: string;
  changed?: boolean;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function parseValueJson(json: string, fallbackName: string): JsonValue | { error: string } {
  try {
    return JSON.parse(json) as JsonValue;
  } catch {
    return { error: `Invalid JSON value for "${fallbackName}".` };
  }
}

function isErrorResult(value: JsonValue | { error: string }): value is { error: string } {
  return typeof value === 'object' && value !== null && 'error' in value;
}

/** Recursively apply an operation that targets a property by name at any depth. */
function mapByName(node: JsonValue, key: string, fn: (value: JsonValue) => JsonValue | undefined): JsonValue {
  if (Array.isArray(node)) {
    return node.map((item) => mapByName(item, key, fn));
  }
  if (typeof node === 'object' && node !== null) {
    const obj = node as Record<string, JsonValue>;
    const result: Record<string, JsonValue> = {};
    for (const k of Object.keys(obj)) {
      if (k === key) {
        const next = fn(obj[k]);
        if (next !== undefined) result[k] = next;
      } else {
        result[k] = mapByName(obj[k], key, fn);
      }
    }
    return result;
  }
  return node;
}

function replaceByPath(root: JsonValue, path: string[], next: JsonValue | undefined): JsonValue | undefined {
  if (path.length === 0) return next;
  const head = path[0];
  if (Array.isArray(root)) {
    const idx = Number(head);
    const result = [...root];
    const child = replaceByPath(root[idx], path.slice(1), next);
    if (child === undefined) result.splice(idx, 1);
    else result[idx] = child;
    return result;
  }
  const obj = root as Record<string, JsonValue>;
  const result = { ...obj };
  const child = replaceByPath(obj[head], path.slice(1), next);
  if (child === undefined) delete result[head];
  else result[head] = child;
  return result;
}

function compareValue(actual: JsonValue | undefined, op: CompareOp, rawValue: string): boolean {
  if (op === 'exists') return actual !== undefined;
  if (actual === undefined) return false;
  const target = rawValue;
  const actualStr = typeof actual === 'string' ? actual : JSON.stringify(actual);
  switch (op) {
    case 'eq':
      return JSON.stringify(actual) === target || actualStr === target;
    case 'ne':
      return JSON.stringify(actual) !== target && actualStr !== target;
    case 'contains':
      return actualStr.includes(target);
    case 'notContains':
      return !actualStr.includes(target);
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const a = typeof actual === 'number' ? actual : Number(actual);
      const b = Number(target);
      if (Number.isNaN(a) || Number.isNaN(b)) return false;
      switch (op) {
        case 'gt':
          return a > b;
        case 'gte':
          return a >= b;
        case 'lt':
          return a < b;
        case 'lte':
          return a <= b;
      }
      return false;
    }
    default:
      return false;
  }
}

function applyOperation(value: JsonValue, op: TransformOperation): TransformResult {
  switch (op.type) {
    case 'rename': {
      if (!op.key || !op.to || op.key === op.to) return { ok: true, output: value };
      const renameRec = (node: JsonValue): JsonValue => {
        if (Array.isArray(node)) return node.map(renameRec);
        if (typeof node === 'object' && node !== null) {
          const obj = node as Record<string, JsonValue>;
          const result: Record<string, JsonValue> = {};
          for (const k of Object.keys(obj)) {
            if (k === op.key) result[op.to] = renameRec(obj[k]);
            else result[k] = renameRec(obj[k]);
          }
          return result;
        }
        return node;
      };
      return { ok: true, output: renameRec(value) };
    }
    case 'delete':
      if (!op.key) return { ok: true, output: value };
      return { ok: true, output: mapByName(value, op.key, () => undefined) };
    case 'pick': {
      if (!Array.isArray(value) && typeof value !== 'object') {
        return { ok: false, error: 'Pick requires an object or array of objects.' };
      }
      const keys = op.keys.filter((k) => k.length > 0);
      if (Array.isArray(value)) {
        return {
          ok: true,
          output: value.map((item) => {
            if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
              const obj: Record<string, JsonValue> = {};
              for (const k of keys) if (k in (item as Record<string, JsonValue>)) obj[k] = (item as Record<string, JsonValue>)[k];
              return obj;
            }
            return item;
          }),
        };
      }
      const obj: Record<string, JsonValue> = {};
      for (const k of keys) if (k in (value as Record<string, JsonValue>)) obj[k] = (value as Record<string, JsonValue>)[k];
      return { ok: true, output: obj };
    }
    case 'omit': {
      const keys = new Set(op.keys.filter((k) => k.length > 0));
      const omitKeys = (node: JsonValue): JsonValue => {
        if (Array.isArray(node)) return node.map(omitKeys);
        if (typeof node === 'object' && node !== null) {
          const obj: Record<string, JsonValue> = {};
          for (const k of Object.keys(node as Record<string, JsonValue>)) {
            if (!keys.has(k)) obj[k] = omitKeys((node as Record<string, JsonValue>)[k]);
          }
          return obj;
        }
        return node;
      };
      return { ok: true, output: omitKeys(value) };
    }
    case 'add': {
      const parsed = parseValueJson(op.json, op.path);
      if (isErrorResult(parsed)) return { ok: false, error: parsed.error };
      const path = op.path.split('.').filter((s) => s.length > 0);
      return { ok: true, output: setValueAtPath(value, path, parsed as JsonValue) };
    }
    case 'move': {
      const from = op.from.split('.').filter((s) => s.length > 0);
      const to = op.to.split('.').filter((s) => s.length > 0);
      const target = getValueAtPath(value, from);
      if (target === undefined) return { ok: false, error: `Source path "${op.from}" not found.` };
      const removed = replaceByPath(value, from, undefined);
      if (removed === undefined) return { ok: false, error: `Source path "${op.from}" not found.` };
      return { ok: true, output: setValueAtPath(removed, to, clone(target)) };
    }
    case 'copy': {
      const from = op.from.split('.').filter((s) => s.length > 0);
      const to = op.to.split('.').filter((s) => s.length > 0);
      const target = getValueAtPath(value, from);
      if (target === undefined) return { ok: false, error: `Source path "${op.from}" not found.` };
      return { ok: true, output: setValueAtPath(value, to, clone(target)) };
    }
    case 'flatten':
      return { ok: true, output: flattenObject(value) };
    case 'unflatten':
      return { ok: true, output: unflattenObject(value) };
    case 'defaults': {
      const parsed = parseValueJson(op.json, op.key);
      if (isErrorResult(parsed)) return { ok: false, error: parsed.error };
      const applyDefaults = (node: JsonValue): JsonValue => {
        if (Array.isArray(node)) return node.map(applyDefaults);
        if (typeof node === 'object' && node !== null) {
          const obj: Record<string, JsonValue> = {};
          for (const k of Object.keys(node as Record<string, JsonValue>)) {
            obj[k] = applyDefaults((node as Record<string, JsonValue>)[k]);
          }
          if (!(op.key in obj)) obj[op.key] = clone(parsed);
          return obj;
        }
        return node;
      };
      return { ok: true, output: applyDefaults(value) };
    }
    case 'filter': {
      if (!Array.isArray(value)) return { ok: false, error: 'Filter requires the input to be an array.' };
      return {
        ok: true,
        output: value.filter((item) => {
          const actual = op.key && op.key !== 'self' ? getValueAtPath(item, op.key.split('.').filter(Boolean)) : item;
          return compareValue(actual, op.op, op.value);
        }),
      };
    }
    case 'sort': {
      if (!Array.isArray(value)) return { ok: false, error: 'Sort requires the input to be an array.' };
      const sorted = sortArray(value, { direction: op.direction, arrayKey: op.key });
      return { ok: true, output: sorted };
    }
    case 'groupBy': {
      if (!Array.isArray(value)) return { ok: false, error: 'GroupBy requires the input to be an array.' };
      const groups: Record<string, JsonValue[]> = {};
      for (const item of value) {
        const keyValue = op.key ? getValueAtPath(item, op.key.split('.').filter(Boolean)) : undefined;
        const groupKey = keyValue === undefined ? '__missing__' : typeof keyValue === 'string' ? keyValue : JSON.stringify(keyValue);
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(clone(item));
      }
      return { ok: true, output: groups };
    }
    case 'dedupe': {
      if (!Array.isArray(value)) return { ok: false, error: 'Dedupe requires the input to be an array.' };
      const seen = new Set<string>();
      const output: JsonValue[] = [];
      for (const item of value) {
        const key = op.key
          ? JSON.stringify(getValueAtPath(item, op.key.split('.').filter(Boolean)))
          : JSON.stringify(item);
        if (!seen.has(key)) {
          seen.add(key);
          output.push(item);
        }
      }
      return { ok: true, output };
    }
    case 'unique':
      return applyOperation(value, { id: op.id, type: 'dedupe', path: op.path });
    case 'convert': {
      if (!Array.isArray(value) && typeof value !== 'object') {
        return { ok: false, error: 'Convert requires an object or array.' };
      }
      const convertNode = (node: JsonValue): JsonValue => {
        if (Array.isArray(node)) return node.map(convertNode);
        if (typeof node === 'object' && node !== null) {
          const obj: Record<string, JsonValue> = {};
          for (const k of Object.keys(node as Record<string, JsonValue>)) {
            obj[k] = convertNode((node as Record<string, JsonValue>)[k]);
          }
          return obj;
        }
        const s = typeof node === 'string' ? node : JSON.stringify(node);
        switch (op.to) {
          case 'string':
            return s;
          case 'number':
            return Number(s);
          case 'boolean':
            if (s === 'true' || s === '1') return true;
            if (s === 'false' || s === '0' || s === '') return false;
            return Boolean(s);
          case 'null':
            return null;
          default:
            return node;
        }
      };
      return { ok: true, output: convertNode(value) };
    }
    case 'case': {
      const applyCase = (node: JsonValue): JsonValue => {
        if (Array.isArray(node)) return node.map(applyCase);
        if (typeof node === 'object' && node !== null) {
          const obj: Record<string, JsonValue> = {};
          for (const k of Object.keys(node as Record<string, JsonValue>)) {
            obj[k] = applyCase((node as Record<string, JsonValue>)[k]);
          }
          return obj;
        }
        if (typeof node === 'string') {
          switch (op.mode) {
            case 'upper':
              return node.toUpperCase();
            case 'lower':
              return node.toLowerCase();
            case 'title':
              return node.replace(/\b\w/g, (c) => c.toUpperCase());
          }
        }
        return node;
      };
      return { ok: true, output: applyCase(value) };
    }
    default:
      return { ok: false, error: `Unknown operation type.` };
  }
}

function setValueAtPath(root: JsonValue, path: string[], value: JsonValue): JsonValue {
  if (path.length === 0) return value;
  const head = path[0];
  if (Array.isArray(root)) {
    const idx = Number(head);
    const next = Array.isArray(root[idx]) || (typeof root[idx] === 'object' && root[idx] !== null) ? root[idx] : {};
    const result = [...root];
    result[idx] = path.length === 1 ? value : setValueAtPath(next, path.slice(1), value);
    return result;
  }
  const obj = root as Record<string, JsonValue>;
  const result = { ...obj };
  const existing = obj[head];
  const next = existing !== undefined && (typeof existing === 'object' || Array.isArray(existing)) ? existing : {};
  result[head] = path.length === 1 ? value : setValueAtPath(next, path.slice(1), value);
  return result;
}

export function flattenObject(node: JsonValue, prefix = ''): JsonValue {
  if (typeof node !== 'object' || node === null) return node;
  const result: Record<string, JsonValue> = {};
  const visit = (current: JsonValue, p: string): void => {
    if (Array.isArray(current)) {
      current.forEach((item, i) => visit(item, `${p}[${i}]`));
    } else if (typeof current === 'object' && current !== null) {
      for (const key of Object.keys(current as Record<string, JsonValue>)) {
        const child = (current as Record<string, JsonValue>)[key];
        const newPrefix = p ? `${p}.${key}` : key;
        if (typeof child === 'object' && child !== null) {
          visit(child, newPrefix);
        } else {
          result[newPrefix] = child;
        }
      }
    } else {
      result[p] = current;
    }
  };
  visit(node, prefix);
  return result;
}

export function unflattenObject(node: JsonValue): JsonValue {
  if (typeof node !== 'object' || node === null || Array.isArray(node)) return node;
  const result: Record<string, JsonValue> = {};
  for (const key of Object.keys(node as Record<string, JsonValue>)) {
    const segments = key.split('.');
    let target = result;
    segments.forEach((seg, i) => {
      const isLast = i === segments.length - 1;
      if (seg.startsWith('[') && seg.endsWith(']')) {
        // array index
        const idx = Number(seg.slice(1, -1));
        if (!target[idx]) target[idx] = isLast ? (node as Record<string, JsonValue>)[key] : {};
      } else if (isLast) {
        target[seg] = (node as Record<string, JsonValue>)[key];
      } else {
        if (!target[seg] || typeof target[seg] !== 'object') target[seg] = {};
        target = target[seg] as Record<string, JsonValue>;
      }
    });
  }
  return result;
}

export function applyTransformPipeline(input: JsonValue, ops: TransformOperation[]): TransformResult {
  let current = clone(input);
  for (const op of ops) {
    const result = applyOperation(current, op);
    if (!result.ok) return result;
    if (result.output === undefined) return { ok: false, error: `Operation "${op.type}" produced no output.` };
    current = result.output;
  }
  const changed = JSON.stringify(current) !== JSON.stringify(input);
  return { ok: true, output: current, changed };
}

export function transformLabel(op: TransformOperation): string {
  switch (op.type) {
    case 'rename':
      return `Rename "${op.key}" → "${op.to}"`;
    case 'delete':
      return `Delete "${op.key}"`;
    case 'pick':
      return `Pick ${op.keys.join(', ') || '(none)'}`;
    case 'omit':
      return `Omit ${op.keys.join(', ') || '(none)'}`;
    case 'add':
      return `Add at ${op.path || '$'}`;
    case 'move':
      return `Move ${op.from} → ${op.to}`;
    case 'copy':
      return `Copy ${op.from} → ${op.to}`;
    case 'flatten':
      return 'Flatten objects';
    case 'unflatten':
      return 'Unflatten objects';
    case 'defaults':
      return `Default "${op.key}"`;
    case 'filter':
      return `Filter ${op.key} ${op.op} ${op.value}`;
    case 'sort':
      return `Sort ${op.key ?? 'items'} ${op.direction}`;
    case 'groupBy':
      return `Group by ${op.key}`;
    case 'dedupe':
      return `Dedupe by ${op.key ?? 'whole item'}`;
    case 'unique':
      return 'Unique items';
    case 'convert':
      return `Convert to ${op.to}`;
    case 'case':
      return `Case → ${op.mode}`;
    default:
      return 'unknown';
  }
}

export function getValueAtPathForTransform(root: JsonValue, path: string): JsonValue | undefined {
  return getValueAtPath(root, path.split('.').filter((s) => s.length > 0));
}

export { toJsonPointer };
export { sortObjectKeys };
