export function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function decodeBase64(input: string): { ok: true; value: string } | { ok: false; error: string } {
  try {
    const binary = atob(input.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const value = new TextDecoder().decode(bytes);
    return { ok: true, value };
  } catch {
    return { ok: false, error: 'Invalid Base64 input. Characters must be A-Z, a-z, 0-9, +, / and =.' };
  }
}

export function encodeUrl(input: string): string {
  return encodeURIComponent(input);
}

export function decodeUrl(input: string): { ok: true; value: string } | { ok: false; error: string } {
  try {
    return { ok: true, value: decodeURIComponent(input) };
  } catch {
    return { ok: false, error: 'Invalid percent-encoding. The URL contains malformed sequences.' };
  }
}

export function encodeUrlComponent(input: string): string {
  return encodeURIComponent(input).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

export function encodeHtmlEntities(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function decodeHtmlEntities(input: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&nbsp;': '\u00a0',
  };
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity.startsWith('#x')) {
      return String.fromCodePoint(parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith('#')) {
      return String.fromCodePoint(parseInt(entity.slice(1), 10));
    }
    return map[match] ?? match;
  });
}

export function encodeUnicode(input: string): string {
  let out = '';
  for (const ch of input) {
    const code = ch.codePointAt(0) as number;
    if (code > 0x7e || code < 0x20) {
      if (code > 0xffff) {
        const hi = 0xd800 + Math.floor((code - 0x10000) / 0x400);
        const lo = 0xdc00 + ((code - 0x10000) % 0x400);
        out += '\\u' + hi.toString(16).padStart(4, '0') + '\\u' + lo.toString(16).padStart(4, '0');
      } else {
        out += '\\u' + code.toString(16).padStart(4, '0');
      }
    } else {
      out += ch;
    }
  }
  return out;
}

export function decodeUnicode(input: string): { ok: true; value: string } | { ok: false; error: string } {
  try {
    const value = input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
    return { ok: true, value };
  } catch {
    return { ok: false, error: 'Invalid unicode escape sequence.' };
  }
}

export function jsonEscape(input: string): string {
  return JSON.stringify(input);
}

export function jsonUnescape(input: string): { ok: true; value: string } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed !== 'string') return { ok: false, error: 'Input is not a JSON string.' };
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, error: 'Invalid JSON string escape sequence.' };
  }
}

export function hexEncode(input: string): string {
  return [...new TextEncoder().encode(input)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function hexDecode(input: string): { ok: true; value: string } | { ok: false; error: string } {
  const cleaned = input.replace(/\s+/g, '');
  if (!/^[0-9a-fA-F]*$/.test(cleaned) || cleaned.length % 2 !== 0) {
    return { ok: false, error: 'Invalid hex input. Provide an even number of hex digits.' };
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return { ok: true, value: new TextDecoder().decode(bytes) };
}
