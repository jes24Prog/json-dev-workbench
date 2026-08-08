import { describe, it, expect, beforeAll } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { getToolComponent } from '../features/ToolComponents';

beforeAll(() => {
  if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
});

const TOOL_IDS = [
  'formatter',
  'minifier',
  'validator',
  'editor',
  'tree',
  'explorer',
  'search',
  'transform',
  'merge',
  'flatten',
  'sort',
  'pick',
  'arrays',
  'jsonpath',
  'query-builder',
  'diff',
  'patch',
  'pointer',
  'schema-generator',
  'schema-validator',
  'schema-explorer',
  'yaml',
  'xml',
  'csv',
  'markdown',
  'html',
  'sql',
  'mock',
  'schema-mock',
  'samples',
  'uuid',
  'api-response',
  'typescript',
  'java',
  'csharp',
  'kotlin',
  'go',
  'python',
  'openapi',
  'encoding',
  'timestamp',
  'masking',
  'secret-detection',
  'security',
  'regex',
  'workspace',
  'snippets',
  'history',
  'favorites',
];

describe('page client render smoke test', () => {
  afterEach(() => cleanup());

  it.each(TOOL_IDS)('mounts tool page "%s" without crashing', async (id) => {
    expect(getToolComponent(id)).toBeDefined();
    render(
      <MemoryRouter initialEntries={[`/tools/${id}`]}>
        <App />
      </MemoryRouter>,
    );
    await new Promise((r) => setTimeout(r, 50));
  });
});
