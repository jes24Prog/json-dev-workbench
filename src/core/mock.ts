import type { JsonValue } from '../types/json';

export type MockFieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'uuid'
  | 'email'
  | 'url'
  | 'name'
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'address'
  | 'date'
  | 'dateTime'
  | 'timestamp'
  | 'currency'
  | 'company'
  | 'country'
  | 'ip'
  | 'username'
  | 'hexColor'
  | 'object'
  | 'array';

export const MOCK_TYPES: MockFieldType[] = [
  'string',
  'number',
  'integer',
  'boolean',
  'uuid',
  'email',
  'url',
  'name',
  'firstName',
  'lastName',
  'phone',
  'address',
  'date',
  'dateTime',
  'timestamp',
  'currency',
  'company',
  'country',
  'ip',
  'username',
  'hexColor',
  'object',
  'array',
];

export interface MockField {
  key: string;
  type: MockFieldType;
  min?: number;
  max?: number;
  nullable: number;
  enum?: string[];
  format?: string;
  fields?: MockField[];
  arrayType?: MockFieldType;
  arraySize?: number;
}

export interface MockConfig {
  count: number;
  seed: number;
  nullable: number;
  fields: MockField[];
  wrapInArray: boolean;
}

export interface MockResult {
  ok: boolean;
  value?: JsonValue;
  error?: string;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  'James', 'Maria', 'Robert', 'Wei', 'Michael', 'Sofia', 'David', 'Aisha', 'John', 'Yuki',
  'Daniel', 'Fatima', 'Alex', 'Priya', 'Carlos', 'Hannah', 'Omar', 'Lena', 'Mateo', 'Nadia',
];
const LAST_NAMES = [
  'Smith', 'Garcia', 'Chen', 'Kim', 'Nguyen', 'Patel', 'Gonzalez', 'Müller', 'Rossi', 'Silva',
  'Ivanov', 'Watanabe', 'Dubois', 'Okafor', 'Haddad', 'Kowalski', 'Novak', 'Reyes', 'Santos', 'Berg',
];
const COUNTRIES = [
  'United States', 'Philippines', 'Germany', 'Japan', 'Brazil', 'India', 'France', 'Australia',
  'Canada', 'Singapore', 'United Kingdom', 'Netherlands',
];
const COMPANIES = [
  'Acme Corp', 'Globex', 'Initech', 'Umbrella Inc', 'Stark Industries', 'Wayne Enterprises',
  'Cyberdyne', 'Soylent Corp', 'Hooli', 'Pied Piper', 'Vandelay Industries', 'Massive Dynamic',
];
const STREETS = [
  'Maple St', 'Oak Ave', 'Pine Rd', 'Elm Blvd', 'Cedar Ln', 'Birch Way', 'Willow Dr', 'Spruce Ct',
];
const CITIES = [
  'Manila', 'New York', 'Berlin', 'Tokyo', 'London', 'Sydney', 'Toronto', 'Paris',
  'Singapore', 'Amsterdam', 'Madrid', 'Mumbai',
];

function pick<T>(rand: () => number, list: T[]): T {
  return list[Math.floor(rand() * list.length)];
}

function randomString(rand: () => number, min: number, max: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = min + Math.floor(rand() * (max - min + 1));
  let out = '';
  for (let i = 0; i < length; i += 1) out += chars[Math.floor(rand() * chars.length)];
  return out;
}

function makeUuid(rand: () => number): string {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i += 1) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      out += '-';
      continue;
    }
    if (i === 14) {
      out += '4';
      continue;
    }
    if (i === 19) {
      out += hex[Math.floor(rand() * 4) + 8];
      continue;
    }
    out += hex[Math.floor(rand() * 16)];
  }
  return out;
}

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${formatDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}Z`;
}

function generateValue(rand: () => number, field: MockField): JsonValue {
  const type = field.type;
  switch (type) {
    case 'string':
      return field.enum && field.enum.length > 0
        ? pick(rand, field.enum)
        : randomString(rand, field.min ?? 5, field.max ?? 12);
    case 'number':
      return Math.round((field.min ?? 0) + rand() * ((field.max ?? 100) - (field.min ?? 0)));
    case 'integer':
      return Math.floor((field.min ?? 0) + rand() * ((field.max ?? 1000) - (field.min ?? 0) + 1));
    case 'boolean':
      return rand() > 0.5;
    case 'uuid':
      return makeUuid(rand);
    case 'email': {
      const user = randomString(rand, 4, 10).toLowerCase();
      return `${user}@${pick(rand, ['example.com', 'test.io', 'mail.dev', 'acme.co', 'domain.net'])}`;
    }
    case 'url':
      return `https://${randomString(rand, 5, 10).toLowerCase()}.${pick(rand, ['com', 'io', 'dev', 'net'])}/${randomString(rand, 3, 8)}`;
    case 'name':
      return `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`;
    case 'firstName':
      return pick(rand, FIRST_NAMES);
    case 'lastName':
      return pick(rand, LAST_NAMES);
    case 'phone': {
      let phone = '+1-555-';
      for (let i = 0; i < 7; i += 1) phone += Math.floor(rand() * 10);
      return phone;
    }
    case 'address':
      return `${Math.floor(rand() * 9000) + 100} ${pick(rand, STREETS)}, ${pick(rand, CITIES)}`;
    case 'date': {
      const base = new Date(Date.UTC(2020, 0, 1) + Math.floor(rand() * 5 * 365 * 24 * 3600 * 1000));
      return formatDate(base);
    }
    case 'dateTime': {
      const base = new Date(Date.UTC(2020, 0, 1) + Math.floor(rand() * 5 * 365 * 24 * 3600 * 1000));
      return formatDateTime(base);
    }
    case 'timestamp':
      return Date.UTC(2020, 0, 1) + Math.floor(rand() * 5 * 365 * 24 * 3600 * 1000);
    case 'currency':
      return Math.round((field.min ?? 1) + rand() * ((field.max ?? 999) - (field.min ?? 1)) * 100) / 100;
    case 'company':
      return pick(rand, COMPANIES);
    case 'country':
      return pick(rand, COUNTRIES);
    case 'ip':
      return `${Math.floor(rand() * 255)}.${Math.floor(rand() * 255)}.${Math.floor(rand() * 255)}.${Math.floor(rand() * 255)}`;
    case 'username':
      return pick(rand, ['dev', 'user', 'admin', 'tester', 'guest', 'coder']) + Math.floor(rand() * 9999);
    case 'hexColor':
      return '#' + Math.floor(rand() * 0xffffff).toString(16).padStart(6, '0');
    case 'object': {
      const obj: Record<string, JsonValue> = {};
      for (const sub of field.fields ?? []) {
        obj[sub.key] = generateValue(rand, sub);
      }
      return obj;
    }
    case 'array': {
      const size = field.arraySize ?? 3;
      const subField: MockField = {
        key: field.key,
        type: field.arrayType ?? 'string',
        min: field.min,
        max: field.max,
        nullable: field.nullable,
      };
      const out: JsonValue[] = [];
      for (let i = 0; i < size; i += 1) out.push(generateValue(rand, subField));
      return out;
    }
    default:
      return '';
  }
}

export function generateMock(config: MockConfig): MockResult {
  if (!config || !Array.isArray(config.fields)) {
    return { ok: false, error: 'Define at least one field to generate mock data.' };
  }
  if (config.fields.length === 0) {
    return { ok: false, error: 'Define at least one field to generate mock data.' };
  }
  const count = Math.min(Math.max(config.count, 1), 100000);
  if (config.count > 100000) {
    return { ok: false, error: 'Count exceeds the 100,000 record safety limit.' };
  }
  const rand = mulberry32(config.seed);
  const records: Record<string, JsonValue>[] = [];
  for (let i = 0; i < count; i += 1) {
    const record: Record<string, JsonValue> = {};
    for (const field of config.fields) {
      if (field.nullable > 0 && rand() < field.nullable / 100) {
        record[field.key] = null;
      } else {
        record[field.key] = generateValue(rand, field);
      }
    }
    records.push(record);
  }
  return { ok: true, value: config.wrapInArray ? records : records[0] };
}

export function generateSingleMock(fields: MockField[], seed = 1): JsonValue {
  const result = generateMock({ count: 1, seed, nullable: 0, fields, wrapInArray: false });
  return result.ok && result.value !== undefined ? result.value : null;
}
