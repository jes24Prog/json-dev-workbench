import type { JsonValue } from '../types/json';
import { toJsonPointer } from './json/path';

export type DiffChangeType = 'added' | 'removed' | 'modified';

export interface DiffChange {
  type: DiffChangeType;
  path: string[];
  pointer: string;
  key: string;
  oldValue?: JsonValue;
  newValue?: JsonValue;
}

export interface DiffResult {
  changes: DiffChange[];
  added: number;
  removed: number;
  modified: number;
  equal: boolean;
}

export function diffJson(left: JsonValue, right: JsonValue): DiffResult {
  const changes: DiffChange[] = [];
  diffNode(left, right, [], changes);
  return {
    changes,
    added: changes.filter((c) => c.type === 'added').length,
    removed: changes.filter((c) => c.type === 'removed').length,
    modified: changes.filter((c) => c.type === 'modified').length,
    equal: changes.length === 0,
  };
}

function diffNode(
  left: JsonValue,
  right: JsonValue,
  path: string[],
  changes: DiffChange[],
): void {
  const leftIsArr = Array.isArray(left);
  const rightIsArr = Array.isArray(right);
  const leftIsObj = typeof left === 'object' && left !== null && !leftIsArr;
  const rightIsObj = typeof right === 'object' && right !== null && !rightIsArr;

  if (leftIsArr && rightIsArr) {
    diffArray(left, right, path, changes);
    return;
  }
  if (leftIsObj && rightIsObj) {
    diffObject(left, right, path, changes);
    return;
  }
  if (left !== right) {
    changes.push({
      type: 'modified',
      path,
      pointer: toJsonPointer(path),
      key: path[path.length - 1] ?? '$',
      oldValue: left,
      newValue: right,
    });
  }
}

function diffArray(
  left: JsonValue[],
  right: JsonValue[],
  path: string[],
  changes: DiffChange[],
): void {
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i += 1) {
    const childPath = [...path, String(i)];
    if (i >= left.length) {
      changes.push({
        type: 'added',
        path: childPath,
        pointer: toJsonPointer(childPath),
        key: String(i),
        newValue: right[i],
      });
    } else if (i >= right.length) {
      changes.push({
        type: 'removed',
        path: childPath,
        pointer: toJsonPointer(childPath),
        key: String(i),
        oldValue: left[i],
      });
    } else {
      diffNode(left[i], right[i], childPath, changes);
    }
  }
}

function diffObject(
  left: Record<string, JsonValue>,
  right: Record<string, JsonValue>,
  path: string[],
  changes: DiffChange[],
): void {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  const allKeys = new Set([...leftKeys, ...rightKeys]);
  for (const key of allKeys) {
    const childPath = [...path, key];
    if (!(key in left)) {
      changes.push({
        type: 'added',
        path: childPath,
        pointer: toJsonPointer(childPath),
        key,
        newValue: right[key],
      });
    } else if (!(key in right)) {
      changes.push({
        type: 'removed',
        path: childPath,
        pointer: toJsonPointer(childPath),
        key,
        oldValue: left[key],
      });
    } else {
      diffNode(left[key], right[key], childPath, changes);
    }
  }
}

export function changesToLines(changes: DiffChange[]): string[] {
  return changes.map((c) => {
    const path = toJsonPointer(c.path);
    switch (c.type) {
      case 'added':
        return `+ ${path}: ${safeValue(c.newValue)}`;
      case 'removed':
        return `- ${path}: ${safeValue(c.oldValue)}`;
      case 'modified':
        return `~ ${path}: ${safeValue(c.oldValue)} → ${safeValue(c.newValue)}`;
    }
  });
}

function safeValue(v: JsonValue | undefined): string {
  if (v === undefined) return '<undefined>';
  return JSON.stringify(v);
}
