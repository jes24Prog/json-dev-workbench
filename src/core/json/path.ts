import type { JsonValue } from '../../types/json';

/** A JSON path segment, either a property name or an array index (as a string). */
export type PathSegment = string;

/** Path as array of segments, e.g. ['users', '0', 'name']. */
export type JsonPath = PathSegment[];

/** RFC 6901 JSON Pointer escaping: ~ -> ~0, / -> ~1. */
export function escapePointerSegment(segment: string): string {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}

export function unescapePointerSegment(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

/** Build a JSON Pointer string like /users/0/name. */
export function toJsonPointer(path: JsonPath): string {
  return '/' + path.map(escapePointerSegment).join('/');
}

/** Parse a JSON Pointer string into a path. '' and '/' both mean root. */
export function fromJsonPointer(pointer: string): JsonPath {
  if (pointer === '' || pointer === '/') return [];
  if (!pointer.startsWith('/')) {
    throw new Error('Invalid JSON Pointer: must start with "/".');
  }
  return pointer
    .slice(1)
    .split('/')
    .map(unescapePointerSegment);
}

/** Human-readable path like users[0].name — used in UIs and JSONPath display. */
export function toBracketPath(path: JsonPath): string {
  let out = '';
  path.forEach((seg, i) => {
    if (i === 0) {
      out += seg;
    } else if (/^\d+$/.test(seg)) {
      out += `[${seg}]`;
    } else {
      out += `.${seg}`;
    }
  });
  return out === '' ? '$' : out;
}

/** JSONPath-style path like $.users[0].name. */
export function toJsonPathString(path: JsonPath): string {
  let out = '$';
  for (const seg of path) {
    if (/^\d+$/.test(seg)) {
      out += `[${seg}]`;
    } else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(seg)) {
      out += `.${seg}`;
    } else {
      out += `['${seg.replace(/'/g, "\\'")}']`;
    }
  }
  return out;
}

/** Resolve a path against a value. Returns undefined if not found. */
export function getValueAtPath(root: JsonValue, path: JsonPath): JsonValue | undefined {
  let current: JsonValue = root;
  for (const seg of path) {
    if (current === null || typeof current !== 'object') return undefined;
    if (Array.isArray(current)) {
      const idx = Number(seg);
      if (!Number.isInteger(idx) || idx < 0 || idx >= current.length) return undefined;
      current = current[idx];
    } else {
      const obj = current as Record<string, JsonValue>;
      if (!Object.prototype.hasOwnProperty.call(obj, seg)) return undefined;
      current = obj[seg];
    }
  }
  return current;
}

/** Resolve a JSON Pointer string. */
export function resolvePointer(root: JsonValue, pointer: string): JsonValue | undefined {
  const path = fromJsonPointer(pointer);
  return getValueAtPath(root, path);
}

/** Test whether a JSON Pointer resolves. */
export function testPointer(root: JsonValue, pointer: string): boolean {
  try {
    return getValueAtPath(root, fromJsonPointer(pointer)) !== undefined;
  } catch {
    return false;
  }
}

/**
 * Build a JSON Pointer string by resolving a target value (by identity)
 * against the root. Returns null when the value is not found or is a primitive
 * that appears more than once.
 */
export function pointerToValue(root: JsonValue, target: JsonValue): string | null {
  const path = findPath(root, target, [], new Set(), new Set());
  return path === null ? null : toJsonPointer(path);
}

function findPath(
  node: JsonValue,
  target: JsonValue,
  current: JsonPath,
  seen: Set<JsonValue>,
  visited: Set<JsonValue>,
): JsonPath | null {
  if (node === target) return current;
  if (node === null || typeof node !== 'object') return null;
  if (seen.has(node)) return null;
  seen.add(node);
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) {
      const result = findPath(node[i], target, [...current, String(i)], seen, visited);
      if (result !== null) return result;
    }
  } else {
    for (const key of Object.keys(node as Record<string, JsonValue>)) {
      const result = findPath(
        (node as Record<string, JsonValue>)[key],
        target,
        [...current, key],
        seen,
        visited,
      );
      if (result !== null) return result;
    }
  }
  seen.delete(node);
  return null;
}

/** Enumerate every (path, value) pair in a document, lazily in document order. */
export function* walk(root: JsonValue, path: JsonPath = []): Generator<{ path: JsonPath; value: JsonValue }> {
  yield { path, value: root };
  if (root === null || typeof root !== 'object') return;
  if (Array.isArray(root)) {
    for (let i = 0; i < root.length; i += 1) {
      yield* walk(root[i], [...path, String(i)]);
    }
  } else {
    for (const key of Object.keys(root as Record<string, JsonValue>)) {
      yield* walk((root as Record<string, JsonValue>)[key], [...path, key]);
    }
  }
}
