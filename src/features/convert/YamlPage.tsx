import { FileCode2 } from 'lucide-react';
import { ConvertTool } from '../../components/common/ConvertTool';
import { jsonToYaml, yamlToJson } from '../../core/converters/yaml';

export function YamlPage() {
  return (
    <ConvertTool
      toolId="yaml"
      toolLabel="YAML ⇄ JSON"
      description="Convert between YAML and JSON"
      icon={FileCode2}
      toJson={yamlToJson}
      fromJson={jsonToYaml}
      inputPlaceholder={'# Paste YAML or JSON\nname: Ada\nskills:\n  - json\n  - yaml'}
      defaultDirection="toJson"
    />
  );
}
