import type { JsonValue } from '../../types/json';

export type SchemaDraft = 'draft-07' | '2020-12';

export const SCHEMA_DRAFTS: SchemaDraft[] = ['draft-07', '2020-12'];

export interface JsonSchema {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  patternProperties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  required?: string[];
  items?: JsonSchema | JsonSchema[] | boolean;
  prefixItems?: JsonSchema[];
  minItems?: number;
  uniqueItems?: boolean;
  minProperties?: number;
  enum?: JsonValue[];
  const?: JsonValue;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  examples?: JsonValue[];
  nullable?: boolean;
  [key: string]: unknown;
}

export interface SchemaGenOptions {
  draft: SchemaDraft;
  additionalProperties: boolean;
  mergeArrayItems: boolean;
  detectFormats: boolean;
  title?: string;
}

export const DEFAULT_SCHEMA_GEN_OPTIONS: SchemaGenOptions = {
  draft: 'draft-07',
  additionalProperties: true,
  mergeArrayItems: true,
  detectFormats: true,
};

const DRAFT_URI: Record<SchemaDraft, string> = {
  'draft-07': 'http://json-schema.org/draft-07/schema#',
  '2020-12': 'https://json-schema.org/draft/2020-12/schema',
};

export function detectFormat(value: string): string | undefined {
  const trimmed = value.length > 64 ? value.slice(0, 64) : value;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'email';
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return 'date';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(trimmed)) {
    return 'date-time';
  }
  if (/^https?:\/\/\S+$/i.test(trimmed)) return 'uri';
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)
  ) {
    return 'uuid';
  }
  if (
    /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/.test(
      trimmed,
    )
  ) {
    return 'ipv4';
  }
  return undefined;
}

function schemaForValue(value: JsonValue, opts: SchemaGenOptions): JsonSchema {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) {
    const schema: JsonSchema = { type: 'array' };
    if (value.length === 0) return schema;
    if (opts.mergeArrayItems) {
      const itemSchemas = value.map((item) => schemaForValue(item, opts));
      const merged = mergeItemSchemas(itemSchemas);
      if (opts.draft === '2020-12') {
        schema.prefixItems = [merged];
        schema.items = false;
      } else {
        schema.items = merged;
      }
    } else {
      schema.items = { anyOf: value.map((item) => schemaForValue(item, opts)) };
    }
    return schema;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, JsonValue>;
    const schema: JsonSchema = { type: 'object' };
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const key of Object.keys(obj)) {
      properties[key] = schemaForValue(obj[key], opts);
      required.push(key);
    }
    if (Object.keys(properties).length > 0) schema.properties = properties;
    if (required.length > 0) schema.required = required;
    schema.additionalProperties = opts.additionalProperties;
    return schema;
  }
  if (typeof value === 'string') {
    const schema: JsonSchema = { type: 'string' };
    if (opts.detectFormats) {
      const format = detectFormat(value);
      if (format) schema.format = format;
    }
    return schema;
  }
  if (typeof value === 'number') {
    const schema: JsonSchema = { type: 'number' };
    if (Number.isInteger(value)) schema.type = 'integer';
    return schema;
  }
  if (typeof value === 'boolean') return { type: 'boolean' };
  return {};
}

function mergeItemSchemas(schemas: JsonSchema[]): JsonSchema {
  if (schemas.length === 1) return schemas[0];
  const types = new Set<string>();
  let allObjects = true;
  for (const s of schemas) {
    const t = Array.isArray(s.type) ? s.type : [s.type];
    t.filter(Boolean).forEach((x) => types.add(x as string));
    if (s.type !== 'object') allObjects = false;
  }
  const merged: JsonSchema = {};
  if (types.size === 1) merged.type = [...types][0];
  else if (types.size > 1) merged.type = [...types];
  if (allObjects && types.size === 1) {
    const properties: Record<string, JsonSchema> = {};
    const required = new Set<string>();
    for (const s of schemas) {
      const p = (s.properties ?? {}) as Record<string, JsonSchema>;
      for (const key of Object.keys(p)) {
        if (properties[key]) {
          properties[key] = mergeItemSchemas([properties[key], p[key]]);
        } else {
          properties[key] = p[key];
        }
      }
      (s.required ?? []).forEach((r) => required.add(r));
    }
    merged.properties = properties;
    if (required.size > 0) merged.required = [...required];
  }
  return merged;
}

export function generateSchema(value: JsonValue, opts: Partial<SchemaGenOptions> = {}): JsonSchema {
  const merged: SchemaGenOptions = { ...DEFAULT_SCHEMA_GEN_OPTIONS, ...opts };
  const schema = schemaForValue(value, merged);
  if (merged.title) schema.title = merged.title;
  return { $schema: DRAFT_URI[merged.draft], ...schema };
}

export function generateSchemaText(value: JsonValue, opts: Partial<SchemaGenOptions> = {}): string {
  const schema = generateSchema(value, opts);
  return JSON.stringify(schema, null, 2);
}
