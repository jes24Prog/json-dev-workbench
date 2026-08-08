export interface TimestampResult {
  seconds: string;
  milliseconds: string;
  iso: string;
  local: string;
  utc: string;
  human: string;
}

export function nowTimestamp(): TimestampResult {
  return fromMilliseconds(Date.now());
}

export function fromMilliseconds(ms: number): TimestampResult {
  const seconds = Math.floor(ms / 1000);
  const date = new Date(ms);
  return {
    seconds: String(seconds),
    milliseconds: String(ms),
    iso: date.toISOString(),
    local: date.toLocaleString(),
    utc: date.toUTCString(),
    human: date.toString(),
  };
}

export function fromSeconds(seconds: number): TimestampResult {
  return fromMilliseconds(seconds * 1000);
}

export type TimestampInput =
  | { kind: 'seconds'; value: string }
  | { kind: 'milliseconds'; value: string }
  | { kind: 'iso'; value: string }
  | { kind: 'local'; value: string };

export function convertTimestamp(input: TimestampInput): { ok: true; result: TimestampResult } | { ok: false; error: string } {
  switch (input.kind) {
    case 'seconds': {
      const n = Number(input.value.trim());
      if (!Number.isFinite(n)) return { ok: false, error: 'Enter a valid Unix timestamp (seconds).' };
      return { ok: true, result: fromSeconds(n) };
    }
    case 'milliseconds': {
      const n = Number(input.value.trim());
      if (!Number.isFinite(n)) return { ok: false, error: 'Enter a valid Unix timestamp (milliseconds).' };
      return { ok: true, result: fromMilliseconds(n) };
    }
    case 'iso': {
      const date = new Date(input.value);
      if (Number.isNaN(date.getTime())) return { ok: false, error: 'Enter a valid ISO 8601 date string.' };
      return { ok: true, result: fromMilliseconds(date.getTime()) };
    }
    case 'local': {
      const date = new Date(input.value);
      if (Number.isNaN(date.getTime())) return { ok: false, error: 'Enter a valid local date/time string.' };
      return { ok: true, result: fromMilliseconds(date.getTime()) };
    }
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
}
