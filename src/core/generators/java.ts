import type { JsonValue } from '../../types/json';
import { camelCase, pascalCase } from './typescript';
import type { GenResult } from './common';

export interface JavaGenOptions {
  className: string;
  packageName: string;
  useRecord: boolean;
  useLombok: boolean;
  addJackson: boolean;
}

const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
  'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
  'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
  'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public',
  'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
  'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'record', 'var',
]);

function javaFieldName(key: string): string {
  let name = camelCase(key);
  if (!name) name = 'field';
  if (JAVA_KEYWORDS.has(name)) name = name + '_';
  return name;
}

export function generateJava(value: JsonValue, options: Partial<JavaGenOptions> = {}): GenResult {
  const opts: JavaGenOptions = {
    className: 'Root',
    packageName: '',
    useRecord: false,
    useLombok: false,
    addJackson: true,
    ...options,
  };
  if (typeof value !== 'object' || value === null) {
    return { ok: false, error: 'Java generation requires a JSON object or array at the root.' };
  }
  const usedNames = new Set<string>();
  const built = new WeakSet<object>();
  const nameOf = new WeakMap<object, string>();
  const classes: string[] = [];

  const allocateName = (base: string): string => {
    const name = pascalCase(base) || 'Anonymous';
    let candidate = name;
    let counter = 2;
    while (usedNames.has(candidate)) {
      candidate = name + counter;
      counter += 1;
    }
    usedNames.add(candidate);
    return candidate;
  };

  const javaType = (v: JsonValue, baseName: string, key: string): string => {
    if (v === null) return 'Object';
    if (Array.isArray(v)) {
      if (v.length === 0) return 'List<Object>';
      return `List<${javaType(v[0], baseName, key)}>`;
    }
    if (typeof v === 'object') return nameOf.get(v) ?? pascalCase(baseName) + pascalCase(key);
    switch (typeof v) {
      case 'string':
        return 'String';
      case 'number':
        return Number.isInteger(v) ? 'Integer' : 'Double';
      case 'boolean':
        return 'Boolean';
      default:
        return 'Object';
    }
  };

  const buildClass = (obj: Record<string, JsonValue>, className: string): void => {
    if (built.has(obj)) return;
    built.add(obj);
    const fields = Object.keys(obj);
    const body: string[] = [];
    if (opts.useLombok) {
      body.push('@lombok.Getter');
      body.push('@lombok.Setter');
    }
    body.push(`public class ${className} {`);
    if (fields.length === 0) {
      body.push('}');
      classes.push(body.join('\n'));
      return;
    }
    const fieldDecls = fields.map((key) => ({
      javaName: javaFieldName(key),
      original: key,
      type: javaType(obj[key], className, key),
    }));
    for (const f of fieldDecls) {
      if (opts.addJackson && f.javaName !== f.original) {
        body.push(`    @com.fasterxml.jackson.annotation.JsonProperty("${f.original.replace(/"/g, '\\"')}")`);
      }
      body.push(`    private ${f.type} ${f.javaName};`);
      body.push('');
    }
    if (!opts.useRecord && !opts.useLombok) {
      for (const f of fieldDecls) {
        body.push(`    public ${f.type} get${pascalCase(f.javaName)}() {`);
        body.push(`        return ${f.javaName};`);
        body.push(`    }`);
        body.push('');
        body.push(`    public void set${pascalCase(f.javaName)}(${f.type} ${f.javaName}) {`);
        body.push(`        this.${f.javaName} = ${f.javaName};`);
        body.push(`    }`);
        body.push('');
      }
    }
    if (body[body.length - 1] === '') body.pop();
    body.push('}');
    classes.push(body.join('\n'));
  };

  const prepare = (node: JsonValue, baseName: string): void => {
    if (node === null || typeof node !== 'object') return;
    if (nameOf.has(node)) return;
    nameOf.set(node, allocateName(baseName));
    if (Array.isArray(node)) {
      node.forEach((item, i) => prepare(item, baseName + 'Item' + i));
      return;
    }
    const obj = node as Record<string, JsonValue>;
    for (const key of Object.keys(obj)) {
      prepare(obj[key], baseName + pascalCase(key));
    }
  };

  const rootBase = pascalCase(opts.className);
  prepare(value, rootBase);
  if (Array.isArray(value)) {
    const arrName = nameOf.get(value) ?? rootBase;
    classes.push(`public class ${arrName} {\n    public List<Object> items;\n}`);
    value.forEach((item) => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        buildClass(item as Record<string, JsonValue>, nameOf.get(item) ?? rootBase + 'Item');
      }
    });
  } else {
    buildClass(value as Record<string, JsonValue>, nameOf.get(value) ?? rootBase);
  }

  const pkg = opts.packageName ? `package ${opts.packageName};\n\n` : '';
  return { ok: true, output: pkg + classes.join('\n\n') + '\n' };
}
