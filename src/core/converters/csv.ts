import Papa from 'papaparse';
import type { JsonValue } from '../../types/json';
import { stringifyJson } from '../json/format';
import type { ConvertResult } from './yaml';

export interface CsvOptions {
  delimiter: string;
  header: boolean;
  flattenNested: boolean;
}

const DEFAULT_CSV_OPTIONS: CsvOptions = {
  delimiter: ',',
  header: true,
  flattenNested: true,
};

function flattenRow(value: JsonValue, prefix = ''): Record<string, string | number | boolean | null> {
  if (value === null || typeof value !== 'object') {
    return { [prefix || 'value']: value as string | number | boolean | null };
  }
  const result: Record<string, string | number | boolean | null> = {};
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      Object.assign(result, flattenRow(item, prefix ? `${prefix}[${i}]` : `[${i}]`));
    });
    return result;
  }
  for (const key of Object.keys(value as Record<string, JsonValue>)) {
    const child = (value as Record<string, JsonValue>)[key];
    const childKey = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'object' && child !== null) {
      if (Object.keys(child).length === 0) {
        result[childKey] = '{}';
        continue;
      }
      Object.assign(result, flattenRow(child, childKey));
    } else {
      result[childKey] = child as string | number | boolean | null;
    }
  }
  return result;
}

export function jsonToCsv(value: JsonValue, options: Partial<CsvOptions> = {}): ConvertResult {
  const opts = { ...DEFAULT_CSV_OPTIONS, ...options };
  try {
    if (Array.isArray(value)) {
      if (value.length === 0) return { ok: true, output: '' };
      const rows = opts.flattenNested ? value.map((item) => flattenRow(item)) : (value as Record<string, unknown>[]);
      const output = Papa.unparse(rows, {
        delimiter: opts.delimiter,
        header: opts.header,
        quoteChar: '"',
      });
      return { ok: true, output };
    }
    if (typeof value === 'object' && value !== null) {
      if (Object.keys(value).length === 0) return { ok: true, output: '' };
      const rows = opts.flattenNested ? [flattenRow(value)] : [value as Record<string, unknown>];
      const output = Papa.unparse(rows, {
        delimiter: opts.delimiter,
        header: opts.header,
      });
      return { ok: true, output };
    }
    return { ok: false, error: 'CSV conversion requires a JSON object or array of objects.' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to convert to CSV.' };
  }
}

export function csvToJson(text: string, options: Partial<CsvOptions> = {}): ConvertResult {
  const opts = { ...DEFAULT_CSV_OPTIONS, ...options };
  try {
    const result = Papa.parse(text, {
      header: opts.header,
      delimiter: opts.delimiter,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
    });
    if (result.errors.length > 0) {
      const first = result.errors[0];
      return {
        ok: false,
        error: `CSV parse error: ${first.message}${first.row !== undefined ? ` (row ${first.row + 1})` : ''}`,
      };
    }
    return {
      ok: true,
      output: stringifyJson(result.data as JsonValue, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false }),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to parse CSV.' };
  }
}
