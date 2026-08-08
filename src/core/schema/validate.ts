import Ajv, { type ErrorObject, type Options as AjvOptions } from 'ajv';
import addFormats from 'ajv-formats';
import { type JsonValue } from '../../types/json';
import { type SchemaDraft } from './generate';

export interface SchemaValidationIssue {
  path: string;
  message: string;
  schemaPath: string;
  keyword: string;
  params?: Record<string, unknown>;
}

export interface SchemaValidationResult {
  valid: boolean;
  issues: SchemaValidationIssue[];
  errorText?: string;
}

export interface SchemaValidateOptions {
  draft: SchemaDraft;
  coerceTypes: boolean;
  useDefaults: boolean;
  removeAdditional: boolean;
}

const defaultOptions: SchemaValidateOptions = {
  draft: 'draft-07',
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
};

const draft7Cache = new Map<string, Ajv>();

function getDraft7(): Ajv {
  let cached = draft7Cache.get('default');
  if (!cached) {
    cached = new Ajv({ allErrors: true, strict: false, verbose: false });
    addFormats(cached);
    draft7Cache.set('default', cached);
  }
  return cached;
}

export function compileSchema(
  schema: unknown,
  draft: SchemaDraft = 'draft-07',
  opts: Partial<SchemaValidateOptions> = {},
): { ok: true; validate: (data: JsonValue) => boolean } | { ok: false; error: string } {
  const merged = { ...defaultOptions, ...opts };
  const ajvOptions: AjvOptions = {
    allErrors: true,
    strict: false,
    coerceTypes: merged.coerceTypes,
    useDefaults: merged.useDefaults,
    removeAdditional: merged.removeAdditional,
  };
  try {
    if (draft === '2020-12') {
      const ajv = new Ajv(ajvOptions);
      addFormats(ajv);
      const validate = ajv.compile(schema as object);
      return {
        ok: true,
        validate: (data: JsonValue) => validate(data),
      };
    }
    const ajv = getDraft7();
    const validate = ajv.compile(schema as object);
    return {
      ok: true,
      validate: (data: JsonValue) => validate(data),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to compile schema.',
    };
  }
}

export function validateWithSchema(
  data: JsonValue,
  schema: unknown,
  opts: Partial<SchemaValidateOptions> = {},
): SchemaValidationResult {
  const merged = { ...defaultOptions, ...opts };
  const ajvOptions: AjvOptions = {
    allErrors: true,
    strict: false,
    coerceTypes: merged.coerceTypes,
    useDefaults: merged.useDefaults,
    removeAdditional: merged.removeAdditional,
  };
  try {
    const ajv = merged.draft === '2020-12' ? new Ajv(ajvOptions) : new Ajv(ajvOptions);
    if (merged.draft === '2020-12') addFormats(ajv);
    const validate = ajv.compile(schema as object);
    const valid = validate(data);
    const issues: SchemaValidationIssue[] = (validate.errors ?? []).map(normalizeError);
    return { valid, issues };
  } catch (err) {
    return {
      valid: false,
      issues: [],
      errorText: err instanceof Error ? err.message : 'Failed to validate against schema.',
    };
  }
}

function normalizeError(error: ErrorObject): SchemaValidationIssue {
  return {
    path: error.instancePath || '/',
    message: error.message ?? 'Validation failed',
    schemaPath: error.schemaPath ?? '',
    keyword: error.keyword ?? 'unknown',
    params: error.params as Record<string, unknown> | undefined,
  };
}
