import {
  encodeBase64,
  decodeBase64,
  encodeUrlComponent,
  decodeUrl,
  encodeHtmlEntities,
  decodeHtmlEntities,
  encodeUnicode,
  decodeUnicode,
  jsonEscape,
  jsonUnescape,
  hexEncode,
  hexDecode,
} from '../encoding';

describe('Base64', () => {
  it('round-trips text including unicode', () => {
    const text = 'héllo → JSON ✅';
    const encoded = encodeBase64(text);
    const decoded = decodeBase64(encoded);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.value).toBe(text);
  });

  it('rejects invalid input', () => {
    const decoded = decodeBase64('!!!not-base64!!!');
    expect(decoded.ok).toBe(false);
  });
});

describe('URL encoding', () => {
  it('encodes components', () => {
    expect(encodeUrlComponent('a b&c=d')).toBe('a%20b%26c%3Dd');
  });

  it('decodes valid percent-encoding', () => {
    const decoded = decodeUrl('a%20b');
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.value).toBe('a b');
  });

  it('rejects malformed sequences', () => {
    const decoded = decodeUrl('%zz');
    expect(decoded.ok).toBe(false);
  });
});

describe('HTML entities', () => {
  it('escapes special characters', () => {
    expect(encodeHtmlEntities(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });

  it('decodes named and numeric entities', () => {
    expect(decodeHtmlEntities('&amp;&lt;&#39;&#x41;')).toBe('&<\'A');
  });

  it('leaves unknown entities intact', () => {
    expect(decodeHtmlEntities('&bogus;')).toBe('&bogus;');
  });
});

describe('Unicode escapes', () => {
  it('encodes non-ASCII characters', () => {
    expect(encodeUnicode('Aé')).toBe('A\\u00e9');
  });

  it('encodes surrogate pairs as two escapes', () => {
    expect(encodeUnicode('😀')).toBe('\\ud83d\\ude00');
  });

  it('decodes escapes back to characters', () => {
    const decoded = decodeUnicode('\\u00e9\\ud83d\\ude00');
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.value).toBe('é😀');
  });
});

describe('JSON string escaping', () => {
  it('escapes and unescapes strings', () => {
    const escaped = jsonEscape('a"b\nc');
    expect(escaped).toBe('"a\\"b\\nc"');
    const decoded = jsonUnescape(escaped);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.value).toBe('a"b\nc');
  });

  it('rejects non-string JSON', () => {
    const decoded = jsonUnescape('42');
    expect(decoded.ok).toBe(false);
  });
});

describe('Hex encoding', () => {
  it('encodes and decodes hex', () => {
    const encoded = hexEncode('abc');
    expect(encoded).toBe('616263');
    const decoded = hexDecode(encoded);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.value).toBe('abc');
  });

  it('rejects odd-length or invalid hex', () => {
    expect(hexDecode('abc').ok).toBe(false);
    expect(hexDecode('zz').ok).toBe(false);
  });

  it('ignores whitespace when decoding', () => {
    const decoded = hexDecode('61 62');
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.value).toBe('ab');
  });
});
