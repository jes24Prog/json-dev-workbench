import yaml from 'js-yaml';
import type { JsonValue } from '../../types/json';
import { stringifyJson } from '../json/format';

export interface ConvertResult {
  ok: boolean;
  output?: string;
  error?: string;
}

export function jsonToYaml(value: JsonValue): ConvertResult {
  try {
    const output = yaml.dump(value, { noRefs: true, lineWidth: 120 });
    return { ok: true, output };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to convert to YAML.' };
  }
}

export function yamlToJson(text: string): ConvertResult {
  try {
    const value = yaml.load(text, { schema: yaml.JSON_SCHEMA }) as JsonValue;
    if (value === undefined) {
      return { ok: false, error: 'The YAML document is empty.' };
    }
    return { ok: true, output: stringifyJson(value, { indentation: 2, sortKeys: false, sortArrays: false, escapeUnicode: false }) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message.replace(/^YAMLException: /, '') : 'Failed to parse YAML.',
    };
  }
}
