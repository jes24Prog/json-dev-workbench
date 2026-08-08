import type { JsonValue } from '../types/json';
import { walk } from './json/path';
import { analyzeJson } from './json/stats';

export type Severity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface SecurityFinding {
  severity: Severity;
  category: string;
  message: string;
  path?: string;
  pointer?: string;
}

export interface SecurityAnalysis {
  findings: SecurityFinding[];
  score: number;
  hasSecrets: boolean;
}

export interface SecretMatch {
  type: string;
  match: string;
  path: string;
  pointer: string;
}

const SECRET_PATTERNS: { type: string; regex: RegExp }[] = [
  { type: 'AWS Access Key ID', regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  {
    type: 'AWS Secret Access Key',
    regex: /\b(?:aws_secret_access_key|secret_access_key)\s*[=:]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gi,
  },
  {
    type: 'JWT',
    regex: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
  },
  {
    type: 'Bearer token',
    regex: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/g,
  },
  { type: 'GitHub token', regex: /\bghp_[A-Za-z0-9]{36}\b/g },
  { type: 'GitLab token', regex: /\bglpat-[A-Za-z0-9_-]{20,}\b/g },
  { type: 'Slack token', regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { type: 'Stripe secret key', regex: /\bsk_live_[A-Za-z0-9]{20,}\b/g },
  { type: 'Google API key', regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { type: 'Private key', regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
  {
    type: 'Generic API key',
    regex: /\b(?:api[_-]?key|apikey)\s*[=:]\s*['"]?([A-Za-z0-9_-]{16,})['"]?/gi,
  },
  {
    type: 'Password field',
    regex: /\bpassword\s*[=:]\s*['"]?([^'"\s,}\]]{6,})['"]?/gi,
  },
  {
    type: 'Authorization header',
    regex: /\bauthorization\s*[=:]\s*['"]?([A-Za-z0-9._~+/=]{12,})['"]?/gi,
  },
  {
    type: 'Client secret',
    regex: /\b(?:client[_-]?secret|secret[_-]?key)\s*[=:]\s*['"]?([A-Za-z0-9_-]{12,})['"]?/gi,
  },
  { type: 'NPM token', regex: /\bnpm_[A-Za-z0-9]{36}\b/g },
  { type: 'PEM certificate', regex: /-----BEGIN CERTIFICATE-----/g },
];

export const DANGEROUS_PROPERTY_NAMES = ['__proto__', 'constructor', 'prototype'];

export function detectSecrets(root: JsonValue): SecretMatch[] {
  const results: SecretMatch[] = [];
  for (const { path, value } of walk(root)) {
    if (typeof value !== 'string') continue;
    const pointer = '/' + path.map((s) => s.replace(/~/g, '~0').replace(/\//g, '~1')).join('/');
    for (const { type, regex } of SECRET_PATTERNS) {
      regex.lastIndex = 0;
      const match = value.match(regex);
      if (match) {
        results.push({ type, match: match[0].slice(0, 64), path: path.join('.'), pointer });
        break;
      }
    }
    const key = path[path.length - 1] ?? '';
    const lower = key.toLowerCase();
    if (
      !results.some((r) => r.path === path.join('.')) &&
      (lower.includes('password') || lower.includes('secret') || lower.includes('token') || lower.includes('api_key') || lower.includes('apikey'))
    ) {
      results.push({
        type: 'Sensitive property',
        match: value.slice(0, 64),
        path: path.join('.'),
        pointer,
      });
    }
  }
  return results;
}

export function analyzeSecurity(root: JsonValue, textSize: number): SecurityAnalysis {
  const findings: SecurityFinding[] = [];
  const stats = analyzeJson(root);

  const add = (severity: Severity, category: string, message: string, path?: string, pointer?: string) => {
    findings.push({ severity, category, message, path, pointer });
  };

  // Secrets
  const secrets = detectSecrets(root);
  for (const s of secrets) {
    add('CRITICAL', 'Secret detection', `Potential ${s.type} detected.`, s.path, s.pointer);
  }

  // Dangerous property names
  for (const { path } of walk(root)) {
    if (path.length === 0) continue;
    const key = path[path.length - 1];
    if (DANGEROUS_PROPERTY_NAMES.includes(key)) {
      add(
        'WARNING',
        'Prototype pollution',
        `Property "${key}" can trigger prototype pollution in vulnerable parsers.`,
        path.join('.'),
        '/' + path.map((s) => s.replace(/~/g, '~0').replace(/\//g, '~1')).join('/'),
      );
    }
  }

  // Depth
  if (stats.maxDepth > 100) {
    add('CRITICAL', 'Depth', `Document depth is ${stats.maxDepth}. Extremely deep nesting can cause stack overflow.`);
  } else if (stats.maxDepth > 30) {
    add('WARNING', 'Depth', `Document depth is ${stats.maxDepth}. Deep nesting may slow down some parsers.`);
  }

  // Large arrays
  const largestArray = stats.largestArrays[0];
  if (largestArray && largestArray.length > 100000) {
    add('CRITICAL', 'Payload size', `Array at "${largestArray.path}" has ${largestArray.length} items.`);
  } else if (largestArray && largestArray.length > 10000) {
    add('WARNING', 'Payload size', `Array at "${largestArray.path}" has ${largestArray.length} items.`);
  }

  // Total size
  if (textSize > 10 * 1024 * 1024) {
    add('CRITICAL', 'Payload size', `Document is ${(textSize / (1024 * 1024)).toFixed(1)} MB.`);
  } else if (textSize > 1024 * 1024) {
    add('WARNING', 'Payload size', `Document is ${(textSize / (1024 * 1024)).toFixed(1)} MB.`);
  }

  // Duplicate keys
  if (stats.duplicateKeys.length > 0) {
    const sample = stats.duplicateKeys.slice(0, 5).map((d) => `"${d.key}" (×${d.occurrences})`).join(', ');
    add('WARNING', 'Duplicate keys', `Duplicate keys detected: ${sample}.`);
  }

  // Structural notes
  if (stats.totalNodes > 100000) {
    add('WARNING', 'Complexity', `Document contains ${stats.totalNodes.toLocaleString()} nodes.`);
  }
  if (textSize === 0) {
    add('INFO', 'Content', 'The document is empty.');
  }

  const score = Math.max(0, 100 - findings.reduce((acc, f) => acc + (f.severity === 'CRITICAL' ? 40 : f.severity === 'WARNING' ? 12 : 2), 0));
  return { findings, score, hasSecrets: secrets.length > 0 };
}
