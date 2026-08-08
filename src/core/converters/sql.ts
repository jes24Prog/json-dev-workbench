import type { JsonValue } from '../../types/json';
import type { ConvertResult } from './yaml';

export type SqlDialect = 'postgres' | 'mysql' | 'sqlserver' | 'sqlite' | 'oracle';

export interface SqlOptions {
  dialect: SqlDialect;
  tableName: string;
  schemaName: string;
  quoteIdentifiers: boolean;
  batchSize: number;
}

const DEFAULT_SQL_OPTIONS: SqlOptions = {
  dialect: 'postgres',
  tableName: 'items',
  schemaName: '',
  quoteIdentifiers: true,
  batchSize: 50,
};

function quoteIdentifier(name: string, dialect: SqlDialect, quote: boolean): string {
  if (!quote) return name;
  switch (dialect) {
    case 'mysql':
      return '`' + name.replace(/`/g, '``') + '`';
    case 'sqlserver':
      return '[' + name.replace(/]/g, ']]') + ']';
    default:
      return '"' + name.replace(/"/g, '""') + '"';
  }
}

function escapeString(value: string, dialect: SqlDialect): string {
  if (dialect === 'postgres') {
    return "'" + value.replace(/'/g, "''") + "'";
  }
  if (dialect === 'sqlite') {
    return "'" + value.replace(/'/g, "''") + "'";
  }
  if (dialect === 'mysql') {
    return "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
  }
  return "'" + value.replace(/'/g, "''") + "'";
}

function formatValue(value: JsonValue, dialect: SqlDialect): string {
  if (value === null) return 'NULL';
  if (typeof value === 'number') {
    if (Number.isFinite(value)) return String(value);
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    switch (dialect) {
      case 'mysql':
      case 'sqlserver':
      case 'oracle':
      case 'sqlite':
        return value ? '1' : '0';
      case 'postgres':
      default:
        return value ? 'TRUE' : 'FALSE';
    }
  }
  if (typeof value === 'object') {
    const json = JSON.stringify(value);
    if (dialect === 'postgres' || dialect === 'sqlite') {
      return `'${json.replace(/'/g, "''")}'::jsonb`;
    }
    return escapeString(json, dialect);
  }
  return escapeString(value, dialect);
}

function unnest(value: JsonValue): JsonValue[] {
  if (Array.isArray(value)) return value;
  return [value];
}

export function jsonToSql(value: JsonValue, options: Partial<SqlOptions> = {}): ConvertResult {
  const opts = { ...DEFAULT_SQL_OPTIONS, ...options };
  try {
    const rows = unnest(value);
    if (rows.length === 0) return { ok: true, output: '-- No rows to insert.' };
    const headers = new Set<string>();
    for (const row of rows) {
      if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
        Object.keys(row as Record<string, JsonValue>).forEach((k) => headers.add(k));
      }
    }
    const columns = [...headers];
    if (columns.length === 0) {
      return { ok: false, error: 'Each row must be a JSON object with named properties.' };
    }
    const schemaPrefix = opts.schemaName
      ? quoteIdentifier(opts.schemaName, opts.dialect, opts.quoteIdentifiers) + '.'
      : '';
    const table = schemaPrefix + quoteIdentifier(opts.tableName, opts.dialect, opts.quoteIdentifiers);
    const colList = columns.map((c) => quoteIdentifier(c, opts.dialect, opts.quoteIdentifiers)).join(', ');
    const lines: string[] = [];
    if (opts.batchSize <= 1) {
      for (const row of rows) {
        const values = columns.map((c) => {
          const cell = (row as Record<string, JsonValue>)[c];
          return formatValue(cell, opts.dialect);
        });
        lines.push(`INSERT INTO ${table} (${colList})\nVALUES (${values.join(', ')});`);
      }
    } else {
      for (let i = 0; i < rows.length; i += opts.batchSize) {
        const batch = rows.slice(i, i + opts.batchSize);
        const valueGroups = batch.map((row) => {
          const values = columns.map((c) => {
            const cell = (row as Record<string, JsonValue>)[c];
            return formatValue(cell, opts.dialect);
          });
          return `(${values.join(', ')})`;
        });
        lines.push(`INSERT INTO ${table} (${colList})\nVALUES\n${valueGroups.join(',\n')};`);
      }
    }
    const createStmt =
      opts.dialect === 'postgres'
        ? `CREATE TABLE IF NOT EXISTS ${table} (${columns
            .map((c) => `${quoteIdentifier(c, opts.dialect, opts.quoteIdentifiers)} ${inferType(rows, c, opts)}`)
            .join(', ')});`
        : '';
    return { ok: true, output: [createStmt, ...lines].filter(Boolean).join('\n\n') };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to generate SQL.' };
  }
}

function inferType(rows: JsonValue[], column: string, opts: SqlOptions): string {
  let hasNull = false;
  const types = new Set<string>();
  for (const row of rows) {
    const cell = (row as Record<string, JsonValue>)[column];
    if (cell === null || cell === undefined) {
      hasNull = true;
      continue;
    }
    if (typeof cell === 'number') {
      types.add(Number.isInteger(cell) ? 'BIGINT' : 'DOUBLE PRECISION');
    } else if (typeof cell === 'boolean') {
      types.add('BOOLEAN');
    } else if (typeof cell === 'object') {
      types.add('JSONB');
    } else {
      types.add('TEXT');
    }
  }
  const type = types.size === 0 ? 'TEXT' : [...types][0];
  const base = opts.dialect === 'mysql' ? type.replace('DOUBLE PRECISION', 'DOUBLE').replace('JSONB', 'JSON') : type;
  return hasNull && (opts.dialect === 'postgres' || opts.dialect === 'sqlite' || opts.dialect === 'sqlserver' || opts.dialect === 'oracle')
    ? base
    : base;
}
