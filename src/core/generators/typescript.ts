import type { JsonValue } from '../../types/json';
import type { GenResult } from './common';

export interface TsGenOptions {
  rootName: string;
  exportKeyword: boolean;
  readonly: boolean;
  optional: boolean;
  useType: boolean;
  quoteKeys: boolean;
}

export const DEFAULT_TS_OPTIONS: TsGenOptions = {
  rootName: 'Root',
  exportKeyword: true,
  readonly: false,
  optional: false,
  useType: false,
  quoteKeys: false,
};

export function pascalCase(input: string): string {
  return input
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')
    .replace(/^\d/, (d) => '_' + d);
}

export function camelCase(input: string): string {
  const pascal = pascalCase(input);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function isIdentifier(input: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(input);
}

export function generateTypeScript(value: JsonValue, options: Partial<TsGenOptions> = {}): GenResult {
  const opts: TsGenOptions = { ...DEFAULT_TS_OPTIONS, ...options };
  const usedNames = new Set<string>();
  const blocks: string[] = [];
  const nameOf = new WeakMap<object, string>();
  const built = new WeakSet<object>();

  const allocateName = (base: string): string => {
    let name = pascalCase(base) || 'Anonymous';
    if (!name.startsWith('_') && /^\d/.test(name)) name = '_' + name;
    let candidate = name;
    let counter = 2;
    while (usedNames.has(candidate)) {
      candidate = name + counter;
      counter += 1;
    }
    usedNames.add(candidate);
    return candidate;
  };

  const decl = (name: string): string => {
    const prefix = opts.exportKeyword ? 'export ' : '';
    return opts.useType ? `${prefix}type ${name} =` : `${prefix}interface ${name}`;
  };

  const emit = (name: string, body: string): void => {
    blocks.push(`${decl(name)} ${body}`);
  };

  const typeExpr = (v: JsonValue, baseName: string, key: string): string => {
    if (v === null) return 'null';
    if (Array.isArray(v)) {
      if (v.length === 0) return 'unknown[]';
      const itemTypes = v.map((item) => typeExpr(item, baseName, key));
      const unique = [...new Set(itemTypes)];
      if (unique.length === 1) return `${unique[0]}[]`;
      if (unique.length === 2 && unique.includes('null')) {
        return `${unique.find((t) => t !== 'null')}[] | null[]`;
      }
      return `(${unique.join(' | ')})[]`;
    }
    if (typeof v === 'object') {
      if (built.has(v)) return nameOf.get(v) ?? 'unknown';
      const name = allocateName(baseName + pascalCase(key));
      nameOf.set(v, name);
      buildObject(v, name);
      return name;
    }
    switch (typeof v) {
      case 'string':
        return 'string';
      case 'number':
        return Number.isInteger(v) ? 'number' : 'number';
      case 'boolean':
        return 'boolean';
      default:
        return 'unknown';
    }
  };

  const buildObject = (obj: Record<string, JsonValue>, name: string): void => {
    if (built.has(obj)) return;
    built.add(obj);
    const fields = Object.keys(obj);
    if (fields.length === 0) {
      emit(name, 'Record<string, unknown>');
      return;
    }
    const lines: string[] = [];
    for (const key of fields) {
      const optionalSuffix = opts.optional ? '?' : '';
      const readonlyPrefix = opts.readonly ? 'readonly ' : '';
      const fieldName = opts.quoteKeys || !isIdentifier(key) ? `"${key.replace(/"/g, '\\"')}"` : key;
      const type = typeExpr(obj[key], name, key);
      lines.push(`  ${readonlyPrefix}${fieldName}${optionalSuffix}: ${type};`);
    }
    emit(name, `{\n${lines.join('\n')}\n}`);
  };

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const rootName = allocateName(opts.rootName);
    nameOf.set(value, rootName);
    buildObject(value as Record<string, JsonValue>, rootName);
  } else if (Array.isArray(value)) {
    if (value.length === 0) {
      return { ok: true, output: `export type ${pascalCase(opts.rootName)} = unknown[];` };
    }
    const rootName = allocateName(opts.rootName);
    const itemType = typeExpr(value[0], rootName, 'Item');
    blocks.push(`export type ${rootName} = ${itemType}[];`);
  } else {
    const rootName = pascalCase(opts.rootName);
    const t = typeExpr(value, rootName, '');
    blocks.push(`export type ${rootName} = ${t};`);
  }

  return { ok: true, output: blocks.join('\n\n') };
}
