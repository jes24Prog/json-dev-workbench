import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import type { JsonValue } from '../../types/json';
import { stringifyJson } from '../json/format';
import type { ConvertResult } from './yaml';

export interface XmlOptions {
  rootName: string;
  indent: string;
}

export function xmlToJson(text: string): ConvertResult {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseTagValue: true,
      parseAttributeValue: false,
      trimValues: true,
      processEntities: true,
      textNodeName: '#text',
      preserveOrder: false,
    });
    const raw = parser.parse(text);
    // Normalize '@_attr' to '@attr' keys.
    const normalized = normalizeAttrs(raw);
    return {
      ok: true,
      output: stringifyJson(normalized, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false }),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to parse XML.',
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAttrs(node: any): any {
  if (Array.isArray(node)) return node.map(normalizeAttrs);
  if (node !== null && typeof node === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (key.startsWith('@_')) {
        result['@' + key.slice(2)] = normalizeAttrs(value);
      } else {
        result[key] = normalizeAttrs(value);
      }
    }
    return result;
  }
  return node;
}

export function jsonToXml(value: JsonValue, options: XmlOptions): ConvertResult {
  try {
    if (typeof value !== 'object' || value === null) {
      return { ok: false, error: 'XML conversion requires a JSON object or array at the root.' };
    }
    const rootName = options.rootName.trim() || 'root';
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
      indentBy: options.indent,
      processEntities: true,
      suppressEmptyNode: false,
    });
    const output = builder.build({ [rootName]: value });
    return { ok: true, output };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to convert to XML.' };
  }
}
