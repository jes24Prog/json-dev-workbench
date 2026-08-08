import { JSONPath } from 'jsonpath-plus';
import type { JsonValue } from '../types/json';

export interface JsonPathMatch {
  /** Canonical JSONPath string such as $['users'][0]['name']. */
  path: string;
  value: JsonValue;
  /** RFC 6901 JSON Pointer such as /users/0/name. */
  pointer: string;
}

export interface QueryResult {
  ok: boolean;
  matches?: JsonPathMatch[];
  count?: number;
  error?: string;
}

export const EXAMPLE_QUERIES: { label: string; query: string }[] = [
  { label: 'All names', query: '$.users[*].name' },
  { label: 'Adults only', query: '$.users[?(@.age >= 18)]' },
  { label: 'Filter nested', query: '$.orders[?(@.status == "shipped")]' },
  { label: 'Map to ids', query: '$.users[*].id' },
  { label: 'Wildcard keys', query: '$.*.email' },
  { label: 'First item', query: '$.users[0]' },
  { label: 'Last item', query: '$.users[-1:]' },
  { label: 'Deep scan', query: '$..name' },
  { label: 'Count check', query: '$.users.length' },
  { label: 'Regex match', query: '$.users[?(@.email =~ /@example\\.com$/)]' },
];

function pathToPointer(canonicalPath: string): string {
  if (!canonicalPath || canonicalPath === '$') return '/';
  const segments: string[] = [];
  const re = /\$|\.([^.[]+)|\[(\d+)\]|\[['"]([^'"]+)['"]\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(canonicalPath)) !== null) {
    const segment = match[1] ?? match[2] ?? match[3];
    if (segment !== undefined) {
      segments.push(segment.replace(/~/g, '~0').replace(/\//g, '~1'));
    }
  }
  return '/' + segments.join('/');
}

interface RawResult {
  path?: unknown;
  value?: unknown;
}

export function queryJsonPath(document: JsonValue, expression: string): QueryResult {
  if (!expression || expression.trim() === '') {
    return { ok: false, error: 'Enter a JSONPath expression to execute.' };
  }
  try {
    const raw = JSONPath({ path: expression, json: document, resultType: 'all', wrap: false });
    const list: RawResult[] = Array.isArray(raw) ? (raw as RawResult[]) : [raw as RawResult];
    const matches: JsonPathMatch[] = [];
    for (const item of list) {
      if (item === null || typeof item !== 'object') {
        matches.push({ path: '$', value: item as JsonValue, pointer: '/' });
        continue;
      }
      const path = typeof item.path === 'string' ? item.path : '$';
      matches.push({
        path,
        value: item.value as JsonValue,
        pointer: pathToPointer(path),
      });
    }
    return { ok: true, matches, count: matches.length };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Invalid JSONPath expression.',
    };
  }
}
