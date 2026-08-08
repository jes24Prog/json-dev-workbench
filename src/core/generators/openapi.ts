import type { JsonValue } from '../../types/json';
import type { GenResult } from './common';
import { generateSchema } from '../schema/generate';

export interface OpenApiGenOptions {
  title: string;
  version: string;
  modelName: string;
}

/** Generate OpenAPI-compatible Schema Objects from a JSON sample. */
export function generateOpenApiSchemas(value: JsonValue, options: Partial<OpenApiGenOptions> = {}): GenResult {
  const opts: OpenApiGenOptions = { title: 'Generated API', version: '1.0.0', modelName: 'Model', ...options };
  try {
    const rootSchema = generateSchema(value, { draft: '2020-12', additionalProperties: true });
    // Convert to OpenAPI Schema Object (remove $schema/$id keywords).
    const convert = (schema: Record<string, unknown>): Record<string, unknown> => {
      const copy: Record<string, unknown> = {};
      for (const key of Object.keys(schema)) {
        if (key === '$schema' || key === '$id') continue;
        copy[key] = schema[key];
      }
      return copy;
    };
    const components: Record<string, unknown> = {
      schemas: {
        [opts.modelName]: convert(rootSchema as Record<string, unknown>),
      },
    };
    const doc = {
      openapi: '3.0.3',
      info: { title: opts.title, version: opts.version },
      paths: {},
      components,
    };
    return { ok: true, output: JSON.stringify(doc, null, 2) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to generate OpenAPI schema.' };
  }
}
