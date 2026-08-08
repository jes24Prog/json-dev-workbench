import { CheckCircle2 } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { ToolRunner } from '../../components/common/ToolRunner';
import { parseJson } from '../../core/json/parse';
import { jsonTypeName } from '../../types/json';

export function ValidatorPage() {
  return (
    <ToolPage title="Validator" description="Syntax and structure validation" icon={CheckCircle2}>
      <ToolRunner
        toolId="validator"
        toolLabel="Validator"
        compute={(input) => {
          const result = parseJson(input);
          if (!result.ok) return { ok: false, error: result.error };
          const value = result.value;
          const rootType = jsonTypeName(value);
          let size = 0;
          if (typeof value === 'string') size = value.length;
          else if (typeof value === 'number') size = String(value).length;
          else size = countNodes(value);
          return {
            ok: true,
            output: `Valid JSON ✓\n\nRoot type: ${rootType}\nNode count: ${size.toLocaleString()}\n\nValue: ${JSON.stringify(value, null, 2)}`,
          };
        }}
        outputLanguage="text"
        runOnChange
        emptyText="Valid JSON will be confirmed here as you type."
      />
    </ToolPage>
  );
}

function countNodes(value: unknown): number {
  if (Array.isArray(value)) return 1 + value.reduce((sum, v) => sum + countNodes(v), 0);
  if (typeof value === 'object' && value !== null) {
    return 1 + Object.values(value).reduce((sum, v) => sum + countNodes(v), 0);
  }
  return 1;
}
