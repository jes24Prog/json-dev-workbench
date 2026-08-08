import { useState } from 'react';
import { Table2 } from 'lucide-react';
import { ConvertTool } from '../../components/common/ConvertTool';
import { OptionsBar, TextInput, Field, Segmented } from '../../components/common/controls';
import { jsonToSql, type SqlDialect } from '../../core/converters/sql';
import { parseJson } from '../../core/json/parse';

export function SqlPage() {
  const [dialect, setDialect] = useState<SqlDialect>('postgres');
  const [tableName, setTableName] = useState('items');
  const [schemaName, setSchemaName] = useState('');

  return (
    <ConvertTool
      toolId="sql"
      toolLabel="JSON → SQL"
      description="Generate INSERT statements for your data"
      icon={Table2}
      toJson={() => ({ ok: false, error: 'SQL → JSON conversion is not available.' })}
      fromJson={(input) => {
        const parsed = parseJson(input);
        if (!parsed.ok) return { ok: false, error: parsed.error.message };
        return jsonToSql(parsed.value, { dialect, tableName, schemaName });
      }}
      inputPlaceholder={'[{"id": 1, "name": "Ada", "active": true}, {"id": 2, "name": "Linus", "active": false}]'}
      defaultDirection="fromJson"
      recordSettings={() => JSON.stringify({ dialect, tableName, schemaName })}
      options={
        <OptionsBar>
          <Segmented
            label="Dialect"
            value={dialect}
            onChange={setDialect}
            options={[
              { value: 'postgres', label: 'Postgres' },
              { value: 'mysql', label: 'MySQL' },
              { value: 'sqlserver', label: 'SQL Server' },
              { value: 'sqlite', label: 'SQLite' },
              { value: 'oracle', label: 'Oracle' },
            ]}
          />
          <Field label="Table">
            <TextInput value={tableName} onChange={setTableName} className="w-28 font-mono" />
          </Field>
          <Field label="Schema">
            <TextInput value={schemaName} onChange={setSchemaName} className="w-28 font-mono" />
          </Field>
        </OptionsBar>
      }
    />
  );
}
