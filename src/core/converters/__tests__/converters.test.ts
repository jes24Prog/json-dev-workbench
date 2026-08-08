import { jsonToYaml, yamlToJson } from '../yaml';
import { jsonToCsv, csvToJson } from '../csv';
import { xmlToJson, jsonToXml } from '../xml';
import { jsonToMarkdown, jsonToHtml } from '../markdown';
import { jsonToSql } from '../sql';

describe('YAML', () => {
  it('converts JSON to YAML and back', () => {
    const value = { name: 'Ada', tags: ['math', 'code'], meta: { ok: true } };
    const toYaml = jsonToYaml(value);
    expect(toYaml.ok).toBe(true);
    const back = yamlToJson(toYaml.output as string);
    expect(back.ok).toBe(true);
    if (back.ok) expect(JSON.parse(back.output as string)).toEqual(value);
  });

  it('rejects empty YAML documents', () => {
    const result = yamlToJson('   ');
    expect(result.ok).toBe(false);
  });

  it('rejects malformed YAML', () => {
    const result = yamlToJson('foo: [unclosed');
    expect(result.ok).toBe(false);
  });
});

describe('CSV', () => {
  const rows = [
    { name: 'Ada', age: 36 },
    { name: 'Grace', age: 85 },
  ];

  it('converts an array of objects to CSV', () => {
    const result = jsonToCsv(rows);
    expect(result.ok).toBe(true);
    expect(result.output).toContain('name,age');
    expect(result.output).toContain('Ada,36');
  });

  it('round-trips CSV back to JSON', () => {
    const csv = jsonToCsv(rows);
    expect(csv.ok).toBe(true);
    const back = csvToJson(csv.output as string);
    expect(back.ok).toBe(true);
    if (back.ok) expect(JSON.parse(back.output as string)).toEqual(rows);
  });

  it('handles a custom delimiter', () => {
    const result = jsonToCsv(rows, { delimiter: ';' });
    expect(result.output).toContain('Ada;36');
  });

  it('rejects scalars', () => {
    const result = jsonToCsv(5, {});
    expect(result.ok).toBe(false);
  });
});

describe('XML', () => {
  it('parses XML into JSON with normalized attributes', () => {
    const result = xmlToJson('<root><item id="1"><name>Ada</name></item></root>');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const parsed = JSON.parse(result.output as string) as Record<string, unknown>;
      expect((parsed.root as { item: { '@id': string; name: string } }).item.name).toBe('Ada');
      expect((parsed.root as { item: { '@id': string; name: string } }).item['@id']).toBe('1');
    }
  });

  it('generates XML from JSON', () => {
    const result = jsonToXml({ name: 'Ada', active: true }, { rootName: 'user', indent: '  ' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('<user>');
    expect(result.output).toContain('<name>Ada</name>');
  });

  it('rejects scalar roots for XML generation', () => {
    const result = jsonToXml(5, { rootName: 'root', indent: '  ' });
    expect(result.ok).toBe(false);
  });
});

describe('Markdown', () => {
  it('renders arrays of objects as a table', () => {
    const result = jsonToMarkdown([{ a: 1 }, { a: 2 }]);
    expect(result.ok).toBe(true);
    expect(result.output).toContain('| a |');
    expect(result.output).toContain('| --- |');
  });

  it('renders objects as a bullet list', () => {
    const result = jsonToMarkdown({ name: 'Ada' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('**name**');
  });

  it('generates an HTML page that escapes user content', () => {
    const result = jsonToHtml({ x: '<script>alert(1)</script>' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('&lt;script&gt;');
    expect(result.output).not.toContain('<script>alert');
  });
});

describe('SQL', () => {
  it('generates INSERT statements for arrays of objects', () => {
    const result = jsonToSql([{ id: 1, name: "O'Brien", active: true }], { tableName: 'users' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('INSERT INTO "users"');
    expect(result.output).toContain("O''Brien");
  });

  it('uses MySQL quoting conventions', () => {
    const result = jsonToSql([{ id: 1 }], { dialect: 'mysql', tableName: 'users' });
    expect(result.output).toContain('INSERT INTO `users`');
  });

  it('rejects rows without named properties', () => {
    const result = jsonToSql([5], {});
    expect(result.ok).toBe(false);
  });
});
