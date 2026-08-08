import type { ComponentType } from 'react';
import { FormatterPage } from './core/FormatterPage';
import { MinifierPage } from './core/MinifierPage';
import { ValidatorPage } from './core/ValidatorPage';
import { EditorPage } from './core/EditorPage';
import { TreePage } from './core/TreePage';
import { ExplorerPage } from './core/ExplorerPage';
import { SearchPage } from './core/SearchPage';
import { TransformPage } from './restructure/TransformPage';
import { MergePage } from './restructure/MergePage';
import { FlattenPage } from './restructure/FlattenPage';
import { SortPage } from './restructure/SortPage';
import { PickPage } from './restructure/PickPage';
import { ArraysPage } from './restructure/ArraysPage';
import { JsonPathPage } from './query/JsonPathPage';
import { QueryBuilderPage } from './query/QueryBuilderPage';
import { DiffPage } from './compare/DiffPage';
import { PatchPage } from './compare/PatchPage';
import { PointerPage } from './compare/PointerPage';
import { SchemaGeneratorPage } from './schema/SchemaGeneratorPage';
import { SchemaValidatorPage } from './schema/SchemaValidatorPage';
import { SchemaExplorerPage } from './schema/SchemaExplorerPage';
import { YamlPage } from './convert/YamlPage';
import { XmlPage } from './convert/XmlPage';
import { CsvPage } from './convert/CsvPage';
import { MarkdownPage } from './convert/MarkdownPage';
import { HtmlPage } from './convert/HtmlPage';
import { SqlPage } from './convert/SqlPage';
import { MockPage } from './generate/MockPage';
import { SchemaMockPage } from './generate/SchemaMockPage';
import { SamplesPage } from './generate/SamplesPage';
import { UuidPage } from './generate/UuidPage';
import { ApiResponsePage } from './generate/ApiResponsePage';
import { TypeScriptPage } from './developer/TypeScriptPage';
import { JavaPage } from './developer/JavaPage';
import { CSharpPage } from './developer/CSharpPage';
import { KotlinPage } from './developer/KotlinPage';
import { GoPage } from './developer/GoPage';
import { PythonPage } from './developer/PythonPage';
import { OpenApiPage } from './developer/OpenApiPage';
import { EncodingPage } from './utilities/EncodingPage';
import { TimestampPage } from './utilities/TimestampPage';
import { MaskingPage } from './utilities/MaskingPage';
import { SecretDetectionPage } from './utilities/SecretDetectionPage';
import { SecurityPage } from './utilities/SecurityPage';
import { RegexPage } from './utilities/RegexPage';
import { ProjectsPage } from './workspace/ProjectsPage';
import { SnippetsPage } from './workspace/SnippetsPage';
import { HistoryPage } from './workspace/HistoryPage';
import { FavoritesPage } from './workspace/FavoritesPage';

const TOOL_COMPONENTS: Record<string, ComponentType> = {
  formatter: FormatterPage,
  minifier: MinifierPage,
  validator: ValidatorPage,
  editor: EditorPage,
  tree: TreePage,
  explorer: ExplorerPage,
  search: SearchPage,
  transform: TransformPage,
  merge: MergePage,
  flatten: FlattenPage,
  sort: SortPage,
  pick: PickPage,
  arrays: ArraysPage,
  jsonpath: JsonPathPage,
  'query-builder': QueryBuilderPage,
  diff: DiffPage,
  patch: PatchPage,
  pointer: PointerPage,
  'schema-generator': SchemaGeneratorPage,
  'schema-validator': SchemaValidatorPage,
  'schema-explorer': SchemaExplorerPage,
  yaml: YamlPage,
  xml: XmlPage,
  csv: CsvPage,
  markdown: MarkdownPage,
  html: HtmlPage,
  sql: SqlPage,
  mock: MockPage,
  'schema-mock': SchemaMockPage,
  samples: SamplesPage,
  uuid: UuidPage,
  'api-response': ApiResponsePage,
  typescript: TypeScriptPage,
  java: JavaPage,
  csharp: CSharpPage,
  kotlin: KotlinPage,
  go: GoPage,
  python: PythonPage,
  openapi: OpenApiPage,
  encoding: EncodingPage,
  timestamp: TimestampPage,
  masking: MaskingPage,
  'secret-detection': SecretDetectionPage,
  security: SecurityPage,
  regex: RegexPage,
  workspace: ProjectsPage,
  snippets: SnippetsPage,
  history: HistoryPage,
  favorites: FavoritesPage,
};

export function getToolComponent(toolId: string): ComponentType | undefined {
  return TOOL_COMPONENTS[toolId];
}
