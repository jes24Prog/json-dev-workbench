import type { JsonValue } from '../../types/json';
import { pascalCase } from './typescript';
import type { GenResult } from './common';

export type PythonStyle = 'dataclass' | 'typeddict';

export interface PythonGenOptions {
  className: string;
  style: PythonStyle;
  typeImports: boolean;
}

function pythonFieldName(key: string): string {
  let name = key.replace(/[^A-Za-z0-9_]/g, '_');
  if (!name || /^\d/.test(name)) name = 'field_' + name;
  const PY_KEYWORDS = new Set([
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def',
    'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if',
    'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise',
    'return', 'try', 'while', 'with', 'yield', 'self', 'True', 'False', 'None',
  ]);
  if (PY_KEYWORDS.has(name)) name = name + '_';
  return name;
}

function pythonType(v: JsonValue, baseName: string, key: string): string {
  if (v === null) return 'None';
  if (Array.isArray(v)) {
    if (v.length === 0) return 'list';
    return `list[${pythonType(v[0], baseName, key)}]`;
  }
  if (typeof v === 'object') return `"${pascalCase(baseName)}${pascalCase(key)}"`;
  switch (typeof v) {
    case 'string':
      return 'str';
    case 'number':
      return Number.isInteger(v) ? 'int' : 'float';
    case 'boolean':
      return 'bool';
    default:
      return 'Any';
  }
}

export function generatePython(value: JsonValue, options: Partial<PythonGenOptions> = {}): GenResult {
  const opts: PythonGenOptions = { className: 'Root', style: 'dataclass', typeImports: true, ...options };
  if (typeof value !== 'object' || value === null) {
    return { ok: false, error: 'Python generation requires a JSON object or array at the root.' };
  }
  const usedNames = new Set<string>();
  const nameOf = new WeakMap<object, string>();
  const blocks: string[] = [];

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

  const buildClass = (obj: Record<string, JsonValue>, className: string): void => {
    const fields = Object.keys(obj);
    const lines: string[] = [];
    if (opts.style === 'typeddict') {
      lines.push(`class ${className}(TypedDict):`);
      if (fields.length === 0) {
        lines.push('    pass');
        blocks.push(lines.join('\n'));
        return;
      }
      for (const key of fields) {
        lines.push(`    ${pythonFieldName(key)}: ${pythonType(obj[key], className, key)}`);
      }
      blocks.push(lines.join('\n'));
      return;
    }
    lines.push(`@dataclass`);
    lines.push(`class ${className}:`);
    if (fields.length === 0) {
      lines.push('    pass');
      blocks.push(lines.join('\n'));
      return;
    }
    for (const key of fields) {
      lines.push(`    ${pythonFieldName(key)}: ${pythonType(obj[key], className, key)} = None`);
    }
    blocks.push(lines.join('\n'));
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

  const rootBase = pascalCase(opts.className);
  prepare(value, rootBase);
  const rootName = nameOf.get(value) ?? rootBase;
  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        buildClass(item as Record<string, JsonValue>, nameOf.get(item) ?? rootBase + 'Item');
      }
    });
    if (value.every((v) => v === null || typeof v !== 'object')) {
      blocks.push(`class ${rootName}:\n    items: list = []`);
    }
  } else {
    buildClass(value as Record<string, JsonValue>, rootName);
  }

  const header: string[] = [];
  if (opts.style === 'dataclass') header.push('from dataclasses import dataclass');
  if (opts.style === 'typeddict') header.push('from typing import TypedDict');
  if (opts.typeImports && opts.style === 'dataclass') header.push('from typing import Optional');
  return { ok: true, output: [...header, '', ...blocks].join('\n') + '\n' };
}
