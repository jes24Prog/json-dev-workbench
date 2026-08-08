import type { JsonValue } from '../../types/json';
import { walk, toJsonPathString } from './path';

export interface SearchOptions {
  mode: 'key' | 'value' | 'both';
  caseSensitive: boolean;
  matchType: 'exact' | 'contains' | 'regex' | 'starts' | 'ends';
}

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  mode: 'both',
  caseSensitive: false,
  matchType: 'contains',
};

export interface SearchMatch {
  path: JsonPathSegments;
  key: string;
  value: string;
  index: number;
  type: string;
  pointer: string;
}

// Re-export path type alias to keep API stable.
export type JsonPathSegments = string[];

function toValueString(value: JsonValue): string {
  if (typeof value === 'string') return value;
  if (value === null) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return JSON.stringify(value);
}

function compileMatcher(query: string, options: SearchOptions): (input: string) => boolean {
  if (options.matchType === 'regex') {
    const flags = options.caseSensitive ? '' : 'i';
    try {
      const re = new RegExp(query, flags);
      return (input: string) => re.test(input);
    } catch {
      // Fall back to literal match when the pattern is invalid.
      const needle = options.caseSensitive ? query : query.toLowerCase();
      return (input: string) =>
        (options.caseSensitive ? input : input.toLowerCase()).includes(needle);
    }
  }
  const needle = options.caseSensitive ? query : query.toLowerCase();
  const norm = (input: string) => (options.caseSensitive ? input : input.toLowerCase());
  switch (options.matchType) {
    case 'exact':
      return (input) => norm(input) === needle;
    case 'starts':
      return (input) => norm(input).startsWith(needle);
    case 'ends':
      return (input) => norm(input).endsWith(needle);
    case 'contains':
    default:
      return (input) => norm(input).includes(needle);
  }
}

export function searchJson(
  root: JsonValue,
  query: string,
  options: SearchOptions = DEFAULT_SEARCH_OPTIONS,
): { matches: SearchMatch[]; total: number; truncated: boolean } {
  if (query === '') return { matches: [], total: 0, truncated: false };
  const matcher = compileMatcher(query, options);
  const matches: SearchMatch[] = [];
  let index = 0;
  const MAX_MATCHES = 5000;
  let truncated = false;

  for (const { path, value } of walk(root)) {
    if (matches.length >= MAX_MATCHES) {
      truncated = true;
      break;
    }
    const parentKey = path.length > 0 ? path[path.length - 1] : '';
    const isContainer = value !== null && typeof value === 'object';
    if (options.mode !== 'value') {
      // Match property names on objects.
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        for (const key of Object.keys(value as Record<string, JsonValue>)) {
          if (matches.length >= MAX_MATCHES) {
            truncated = true;
            break;
          }
          if (matcher(key)) {
            const child = (value as Record<string, JsonValue>)[key];
            matches.push({
              path: [...path, key],
              key,
              value: toValueString(child),
              index: index++,
              type: child === null ? 'null' : Array.isArray(child) ? 'array' : typeof child,
              pointer: '/' + [...path, key].map((s) => s.replace(/~/g, '~0').replace(/\//g, '~1')).join('/'),
            });
          }
        }
      }
    }
    if (options.mode !== 'key') {
      if (isContainer) continue;
      const valueStr = toValueString(value);
      if (matcher(valueStr)) {
        matches.push({
          path,
          key: parentKey,
          value: valueStr,
          index: index++,
          type: value === null ? 'null' : typeof value,
          pointer: '/' + path.map((s) => s.replace(/~/g, '~0').replace(/\//g, '~1')).join('/'),
        });
      }
    }
  }

  return { matches, total: matches.length, truncated };
}

export function displayPath(path: JsonPathSegments): string {
  return toJsonPathString(path);
}
