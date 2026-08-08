import type { JsonValue } from '../../types/json';
import { pascalCase } from './typescript';
import type { GenResult } from './common';

export interface GoGenOptions {
  typeName: string;
  packageName: string;
  usePointers: boolean;
}

function goFieldName(key: string): string {
  const name = pascalCase(key);
  return name ? name : 'Field';
}

function goType(v: JsonValue, baseName: string, key: string, opts: GoGenOptions): string {
  const ptr = opts.usePointers;
  if (v === null) return 'interface{}';
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]interface{}';
    return `[]${goType(v[0], baseName, key, opts)}`;
  }
  if (typeof v === 'object') return pascalCase(baseName) + pascalCase(key);
  switch (typeof v) {
    case 'string':
      return 'string';
    case 'number':
      return Number.isInteger(v) ? (ptr ? '*int64' : 'int64') : ptr ? '*float64' : 'float64';
    case 'boolean':
      return ptr ? '*bool' : 'bool';
    default:
      return 'interface{}';
  }
}

export function generateGo(value: JsonValue, options: Partial<GoGenOptions> = {}): GenResult {
  const opts: GoGenOptions = { typeName: 'Root', packageName: 'main', usePointers: true, ...options };
  if (typeof value !== 'object' || value === null) {
    return { ok: false, error: 'Go generation requires a JSON object or array at the root.' };
  }
  const usedNames = new Set<string>();
  const nameOf = new WeakMap<object, string>();
  const structs: string[] = [];

  const allocateName = (base: string): string => {
    const name = pascalCase(base) || 'Model';
    let candidate = name;
    let counter = 2;
    while (usedNames.has(candidate)) {
      candidate = name + counter;
      counter += 1;
    }
    usedNames.add(candidate);
    return candidate;
  };

  const buildStruct = (obj: Record<string, JsonValue>, typeName: string): void => {
    const fields = Object.keys(obj);
    const lines: string[] = [];
    lines.push(`type ${typeName} struct {`);
    for (const key of fields) {
      const fieldName = goFieldName(key);
      const jsonTag = `json:"${key.replace(/"/g, '\\"')}"`;
      lines.push(`\t${fieldName}\t${goType(obj[key], typeName, key, opts)}\t` + '`' + jsonTag + '`');
    }
    lines.push('}');
    structs.push(lines.join('\n'));
  };

  const prepare = (node: JsonValue, baseName: string): void => {
    if (node === null || typeof node !== 'object') return;
    if (nameOf.has(node)) return;
    nameOf.set(node, allocateName(baseName));
    if (Array.isArray(node)) {
      node.forEach((item, i) => prepare(item, baseName + 'Item' + i));
      return;
    }
    for (const key of Object.keys(node as Record<string, JsonValue>)) {
      prepare((node as Record<string, JsonValue>)[key], baseName + pascalCase(key));
    }
  };

  const rootBase = pascalCase(opts.typeName);
  prepare(value, rootBase);
  const rootName = nameOf.get(value) ?? rootBase;

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        buildStruct(item as Record<string, JsonValue>, nameOf.get(item) ?? rootBase + 'Item');
      }
    });
  } else {
    buildStruct(value as Record<string, JsonValue>, rootName);
  }

  const pkg = `package ${opts.packageName}\n\n`;
  return { ok: true, output: pkg + structs.join('\n\n') + '\n' };
}
