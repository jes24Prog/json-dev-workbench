import { useState } from 'react';
import { FileCode2 } from 'lucide-react';
import { ConvertTool } from '../../components/common/ConvertTool';
import { OptionsBar, TextInput, Field } from '../../components/common/controls';
import { xmlToJson, jsonToXml } from '../../core/converters/xml';
import { parseJson } from '../../core/json/parse';

export function XmlPage() {
  const [rootName, setRootName] = useState('root');

  return (
    <ConvertTool
      toolId="xml"
      toolLabel="XML ⇄ JSON"
      description="Convert between XML and JSON"
      icon={FileCode2}
      toJson={xmlToJson}
      fromJson={(input) => {
        const parsed = parseJson(input);
        return jsonToXml(parsed.ok ? parsed.value : {}, { rootName, indent: '  ' });
      }}
      inputPlaceholder={'<users>\n  <user id="1">\n    <name>Ada</name>\n  </user>\n</users>'}
      defaultDirection="toJson"
      recordSettings={() => JSON.stringify({ rootName })}
      options={
        <OptionsBar>
          <Field label="Root element">
            <TextInput value={rootName} onChange={setRootName} className="w-32 font-mono" />
          </Field>
        </OptionsBar>
      }
    />
  );
}
