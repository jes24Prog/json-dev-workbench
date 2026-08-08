import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { ConvertTool } from '../../components/common/ConvertTool';
import { OptionsBar, Toggle, Segmented } from '../../components/common/controls';
import { jsonToCsv, csvToJson } from '../../core/converters/csv';
import { parseJson } from '../../core/json/parse';

export function CsvPage() {
  const [delimiter, setDelimiter] = useState(',');
  const [header, setHeader] = useState(true);
  const [flattenNested, setFlattenNested] = useState(true);

  return (
    <ConvertTool
      toolId="csv"
      toolLabel="CSV ⇄ JSON"
      description="Convert between CSV and JSON"
      icon={FileSpreadsheet}
      toJson={(input) => csvToJson(input, { delimiter, header })}
      fromJson={(input) => {
        const parsed = parseJson(input);
        if (!parsed.ok) return { ok: false, error: parsed.error.message };
        return jsonToCsv(parsed.value, { delimiter, header, flattenNested });
      }}
      inputPlaceholder={'name,age,city\nAda,36,London\nLinus,53,Helsinki'}
      defaultDirection="toJson"
      recordSettings={() => JSON.stringify({ delimiter, header, flattenNested })}
      options={
        <OptionsBar>
          <Segmented
            label="Delimiter"
            value={delimiter}
            onChange={setDelimiter}
            options={[
              { value: ',', label: 'Comma' },
              { value: ';', label: 'Semicolon' },
              { value: '\t', label: 'Tab' },
              { value: '|', label: 'Pipe' },
            ]}
          />
          <Toggle checked={header} onChange={setHeader} label="Header row" />
          <Toggle checked={flattenNested} onChange={setFlattenNested} label="Flatten nested" />
        </OptionsBar>
      }
    />
  );
}
