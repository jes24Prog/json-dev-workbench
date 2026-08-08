import type { JsonValue } from '../../types/json';
import { pascalCase } from './typescript';
import type { GenResult } from './common';

export interface CSharpGenOptions {
  className: string;
  namespace: string;
  useRecord: boolean;
  addJsonProperty: boolean;
  nullable: boolean;
}

const CSHARP_KEYWORDS = new Set([
  'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked',
  'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else',
  'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for',
  'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock',
  'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params',
  'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed',
  'short', 'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw',
  'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using',
  'virtual', 'void', 'volatile', 'while', 'record',
]);

function csharpName(key: string): string {
  let name = pascalCase(key);
  if (!name) name = 'Property';
  if (CSHARP_KEYWORDS.has(name.toLowerCase())) name = '@' + name;
  return name;
}

export function generateCSharp(value: JsonValue, options: Partial<CSharpGenOptions> = {}): GenResult {
  const opts: CSharpGenOptions = {
    className: 'Root',
    namespace: '',
    useRecord: false,
    addJsonProperty: true,
    nullable: false,
    ...options,
  };
  if (typeof value !== 'object' || value === null) {
    return { ok: false, error: 'C# generation requires a JSON object or array at the root.' };
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

  const csType = (v: JsonValue, baseName: string, key: string): string => {
    const q = opts.nullable ? '?' : '';
    if (v === null) return 'object';
    if (Array.isArray(v)) {
      if (v.length === 0) return 'List<object>';
      return `List<${csType(v[0], baseName, key)}>`;
    }
    if (typeof v === 'object') return nameOf.get(v) ?? pascalCase(baseName) + pascalCase(key);
    switch (typeof v) {
      case 'string':
        return 'string';
      case 'number':
        return Number.isInteger(v) ? `long${q}` : `double${q}`;
      case 'boolean':
        return `bool${q}`;
      default:
        return 'object';
    }
  };

  const buildClass = (obj: Record<string, JsonValue>, className: string): void => {
    const fields = Object.keys(obj);
    const lines: string[] = [];
    lines.push(opts.useRecord ? `public record ${className}(` : `public class ${className}\n{`);
    if (fields.length === 0) {
      blocks.push(opts.useRecord ? `public record ${className}();` : `public class ${className} { }`);
      return;
    }
    if (opts.useRecord) {
      const params = fields.map((key) => {
        const propName = csharpName(key);
        return `${csType(obj[key], className, key)} ${propName}`;
      });
      lines[0] = `public record ${className}(\n  ${params.join(',\n  ')}\n);`;
      blocks.push(lines.join('\n'));
      return;
    }
    for (const key of fields) {
      const propName = csharpName(key);
      if (opts.addJsonProperty && propName !== key) {
        lines.push(`  [JsonPropertyName("${key.replace(/"/g, '\\"')}")]`);
      }
      lines.push(`  public ${csType(obj[key], className, key)} ${propName} { get; set; } = default!;`);
    }
    lines.push('}');
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
      blocks.push(`public class ${rootName} { public List<object> Items { get; set; } = default!; }`);
    }
  } else {
    buildClass(value as Record<string, JsonValue>, rootName);
  }

  const usings = ['using System;', 'using System.Collections.Generic;', ...(opts.addJsonProperty ? ['using System.Text.Json.Serialization;'] : [])].join('\n');
  const ns = opts.namespace ? `\n\nnamespace ${opts.namespace}\n{\n${blocks.map((b) => indent(b)).join('\n\n')}\n}` : `\n\n${blocks.join('\n\n')}`;
  return { ok: true, output: usings + ns + '\n' };
}

function indent(block: string): string {
  return block
    .split('\n')
    .map((line) => (line === '' ? '' : '  ' + line))
    .join('\n');
}
