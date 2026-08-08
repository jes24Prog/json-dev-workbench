import { Search } from 'lucide-react';
import { ToolPage } from '../../components/common/ToolPage';
import { SplitPane } from '../../components/common/SplitPane';
import { JsonInputPanel } from '../../components/common/JsonInputPanel';
import { ErrorBox } from '../../components/common/ErrorBox';
import { useDraft } from '../../stores/draftsStore';
import { parseJson } from '../../core/json/parse';
import type { JsonValue } from '../../types/json';

export function SchemaExplorerPage() {
  const { value, setValue } = useDraft('schema-explorer');
  const parsed = parseJson(value);
  const schema = parsed.ok && typeof parsed.value === 'object' && !Array.isArray(parsed.value) ? parsed.value : null;

  const right = (
    <div className="h-full overflow-auto p-4">
      {!parsed.ok ? (
        value.trim() ? (
          <ErrorBox error={parsed.error} />
        ) : (
          <p className="text-xs text-muted">Paste a JSON Schema to browse its structure.</p>
        )
      ) : schema ? (
        <SchemaNode name="root" node={schema as Record<string, JsonValue>} required={[]} depth={0} />
      ) : (
        <p className="text-xs text-muted">The root of a JSON Schema must be an object.</p>
      )}
    </div>
  );

  return (
    <ToolPage title="Schema Explorer" description="Browse and explain a schema" icon={Search}>
      <SplitPane
        left={<JsonInputPanel value={value} onChange={setValue} label="Schema" placeholder='{"type": "object", "properties": {}}' />}
        right={right}
        leftLabel="Schema"
        rightLabel="Structure"
        initialRatio={0.45}
      />
    </ToolPage>
  );
}

function SchemaNode({ node, name, required, depth }: { node: Record<string, JsonValue>; name: string; required: string[]; depth: number }) {
  const type = node.type;
  const props = (node.properties as Record<string, JsonValue> | undefined) ?? {};
  const items = node.items;
  const title = node.title as string | undefined;
  const description = node.description as string | undefined;
  const format = node.format as string | undefined;
  const enumValues = Array.isArray(node.enum) ? (node.enum as JsonValue[]) : undefined;

  return (
    <div className="mb-4" style={{ marginLeft: depth * 16 }}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">{name}</code>
        <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-accent">{typeValue(type)}</span>
        {required.includes(name) && (
          <span className="rounded bg-amber-600/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">required</span>
        )}
        {format && <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] text-muted">{format}</span>}
      </div>
      {title && <p className="mb-0.5 text-xs font-semibold text-ink">{title}</p>}
      {description && <p className="mb-1 text-[11px] text-muted">{description}</p>}
      {enumValues && (
        <p className="mb-1 font-mono text-[11px] text-muted">
          enum: [{enumValues.map((e) => JSON.stringify(e)).join(', ')}]
        </p>
      )}
      {typeof type === 'object' || type === 'array' ? (
        <div className="mt-2 space-y-2 border-l border-edge pl-3">
          {type === 'array' && items && typeof items === 'object' && !Array.isArray(items) && (
            <SchemaNode node={items as Record<string, JsonValue>} name="items" required={[]} depth={depth + 1} />
          )}
          {Object.keys(props).length > 0 && (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-muted">Properties</p>
              {Object.entries(props).map(([key, propValue]) => (
                <SchemaNode
                  key={key}
                  node={propValue as Record<string, JsonValue>}
                  name={key}
                  required={(node.required as string[]) ?? []}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function typeValue(type: JsonValue): string {
  if (type === undefined) return 'any';
  return JSON.stringify(type);
}
