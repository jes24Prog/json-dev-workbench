import type { JsonValue } from '../../types/json';
import { camelCase, pascalCase } from './typescript';
import type { GenResult } from './common';

export interface KotlinGenOptions {
  className: string;
  packageName: string;
  addSerialName: boolean;
}

const KOTLIN_KEYWORDS = new Set([
  'as', 'break', 'class', 'continue', 'do', 'else', 'false', 'for', 'fun', 'if', 'in',
  'interface', 'is', 'null', 'object', 'package', 'return', 'super', 'this', 'throw',
  'true', 'try', 'typealias', 'typeof', 'val', 'var', 'when', 'while', 'data', 'sealed',
]);

function kotlinFieldName(key: string): string {
  let name = camelCase(key);
  if (!name) name = 'field';
  if (KOTLIN_KEYWORDS.has(name)) name = '`' + name + '`';
  return name;
}

export function generateKotlin(value: JsonValue, options: Partial<KotlinGenOptions> = {}): GenResult {
  const opts: KotlinGenOptions = { className: 'Root', packageName: '', addSerialName: true, ...options };
  if (typeof value !== 'object' || value === null) {
    return { ok: false, error: 'Kotlin generation requires a JSON object or array at the root.' };
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

  const ktType = (v: JsonValue, baseName: string, key: string): string => {
    if (v === null) return 'Any?';
    if (Array.isArray(v)) {
      if (v.length === 0) return 'List<Any?>';
      return `List<${ktType(v[0], baseName, key)}>`;
    }
    if (typeof v === 'object') return nameOf.get(v) ?? pascalCase(baseName) + pascalCase(key);
    switch (typeof v) {
      case 'string':
        return 'String';
      case 'number':
        return Number.isInteger(v) ? 'Long' : 'Double';
      case 'boolean':
        return 'Boolean';
      default:
        return 'Any?';
    }
  };

  const buildClass = (obj: Record<string, JsonValue>, className: string): void => {
    const fields = Object.keys(obj);
    const lines: string[] = [];
    if (fields.length === 0) {
      blocks.push(`data class ${className}(val value: Any? = null)`);
      return;
    }
    const params = fields.map((key) => {
      const name = kotlinFieldName(key);
      const annotation = opts.addSerialName && name !== key ? `@SerialName("${key.replace(/"/g, '\\"')}") ` : '';
      return `    ${annotation}val ${name}: ${ktType(obj[key], className, key)}? = null`;
    });
    lines.push(`data class ${className}(`);
    lines.push(params.join(',\n'));
    lines.push(')');
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
      blocks.push(`data class ${rootName}(val items: List<Any?> = emptyList())`);
    }
  } else {
    buildClass(value as Record<string, JsonValue>, rootName);
  }

  const pkg = opts.packageName ? `package ${opts.packageName}\n\n` : '';
  const importLine = opts.addSerialName ? 'import kotlinx.serialization.SerialName\nimport kotlinx.serialization.Serializable\n\n' : '';
  return { ok: true, output: pkg + importLine + blocks.join('\n\n') + '\n' };
}
