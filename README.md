# JSON Developer Workbench

A comprehensive, privacy-first JSON developer workbench that runs entirely in the browser.

This repository contains a React + TypeScript single-page application that provides a set of JSON developer tools: editor, converter, comparer, generator, query tools, schema utilities and more. It is designed to run fully in the client (browser), keeping user data local and offline-capable (PWA-ready).

---

Table of contents
- Project overview
- Key features
- Quickstart (requirements & commands)
- Project structure
- Development workflow
- Testing
- Build & deployment
- Architecture & important modules
- Contributing
- Troubleshooting & FAQ
- License & acknowledgements

---

Project overview

This app is intended to be a privacy-first workbench for working with JSON and related data formats (YAML, XML, CSV). Major goals:
- Run fully in the browser (no server-side parsing by default)
- Provide a set of integrated developer tools for validating, transforming, comparing and querying JSON
- Fast, offline-capable, and extensible

Short description from package.json: "A comprehensive, privacy-first JSON developer workbench that runs entirely in the browser." See [package.json](C:/Users/JesusR/Documents/AIGen/json-tools/package.json).

Key features
- JSON Editor with syntax highlighting (CodeMirror)
- Validation using AJV and JSON Schema helpers
- Convert between JSON, YAML, XML, CSV
- JSONPath query support
- Diff/compare tools
- Generators and mockers for JSON data
- Schemas and schema utilities
- Local workspace & drafts backed by Dexie (IndexedDB)
- Web Worker offloading for compute-heavy tasks (format/minify/diff)
- PWA-ready build using Vite + vite-plugin-pwa

Quickstart

Prerequisites
- Node.js (recommend latest LTS; tested with Node 18+)
- npm (or yarn/pnpm)

Install dependencies

Open a terminal in the project root (C:/Users/JesusR/Documents/AIGen/json-tools) and run:

npm install

Development server

Start the dev server with Vite (hot reload):

npm run dev

Open the app at the URL printed by Vite (usually http://localhost:5173). The app uses HashRouter so links are stable when opening from the filesystem.

Build for production

npm run build

This runs TypeScript build (tsc -b) and then Vite build. The production output is emitted into the dist/ folder.

Preview production build

npm run preview

Testing

Run unit tests with Vitest:

npm run test

Run tests in watch mode:

npm run test:watch

Generate coverage:

npm run test:coverage

Linting and formatting

Check and run linters/formatters:

- Lint: npm run lint
- Format code: npm run format
- Check formatting: npm run format:check
- Type check: npm run typecheck

Project structure (highlighted)

- [package.json](C:/Users/JesusR/Documents/AIGen/json-tools/package.json) — scripts and dependencies
- index.html — app entry HTML
- src/ — main application source
  - [src/main.tsx](C:/Users/JesusR/Documents/AIGen/json-tools/src/main.tsx) — React entry
  - [src/App.tsx](C:/Users/JesusR/Documents/AIGen/json-tools/src/App.tsx) — Main shell + routing
  - src/components/ — UI components (layout, dialogs, palette)
    - src/components/layout/Header.tsx
    - src/components/layout/Sidebar.tsx
    - src/components/layout/StatusBar.tsx
  - src/features/ — Tool components and feature modules (compare, convert, generate, query, restructure, schema, utilities, workspace)
  - src/core/ — Core JSON utilities and algorithms (converters, diff, jsonpath, masking, merge, schema helpers, transform, tree utilities). Example files: [src/core/diff.ts](C:/Users/JesusR/Documents/AIGen/json-tools/src/core/diff.ts), [src/core/jsonpath.ts](C:/Users/JesusR/Documents/AIGen/json-tools/src/core/jsonpath.ts)
  - src/services/ — Services (storage and worker bridge). See [src/services/worker.ts](C:/Users/JesusR/Documents/AIGen/json-tools/src/services/worker.ts)
  - src/stores/ — Zustand stores for settings, drafts, history, workspace (persistent state)
  - src/workers/ — web worker implementations (off-main-thread heavy work)
  - src/styles/ — Tailwind/CSS styles
  - src/types/ — shared TypeScript types
- public/ — static assets
- dist/ — production build output (after `npm run build`)

Architecture & important modules

1. UI & routing
   - React + React Router (HashRouter) for client-side routing. The top-level router is in [src/main.tsx](C:/Users/JesusR/Documents/AIGen/json-tools/src/main.tsx) and [src/App.tsx](C:/Users/JesusR/Documents/AIGen/json-tools/src/App.tsx).

2. Editor
   - Built on CodeMirror 6 (see dependencies in package.json). Editor components are used across tools to provide editing, syntax highlighting and autocomplete.

3. Core logic
   - src/core contains transformation, diff, merge, JSONPath, schema generation and masking utilities. These are pure JS/TS modules usable both in the main thread and inside web workers.

4. Workers
   - Heavy or potentially blocking tasks (formatting, minifying, computing diffs/stats) are executed inside a Web Worker via [src/services/worker.ts](C:/Users/JesusR/Documents/AIGen/json-tools/src/services/worker.ts).

5. Storage
   - IndexedDB (via Dexie) is used for local workspace storage, snippets, and drafts so data stays on the client.

6. State management
   - Lightweight global state via Zustand stores in src/stores (settingsStore, draftsStore, historyStore, workspaceStore, uiStore).

7. Validation
   - AJV + ajv-formats for JSON Schema validation and format checking.

Integrations and notable dependencies
- CodeMirror (editor) — UX for editing JSON/YAML/etc.
- AJV (validation)
- dexie (local storage)
- jsonpath-plus (querying)
- papaparse (CSV import/export)
- vite + vite-plugin-pwa (dev server, build, PWA support)
- vitest (testing)

Adding new tools or features
- Add a new tool component under src/features and export it via [src/features/ToolComponents.tsx](C:/Users/JesusR/Documents/AIGen/json-tools/src/features/ToolComponents.tsx) so the router can load it by id.
- Use the core/ utilities when possible to avoid duplicating parsing/transform logic.
- If a task is compute-heavy, prefer adding a worker implementation and call it through src/services/worker.ts.

Development tips
- Use the `CommandPalette` or keyboard shortcuts (configured in src/components/palette and settings) to quickly switch tools.
- To preserve drafts across reloads, drafts are persisted in the workspace store; use the Save Snippet dialog to store reusable snippets.
- When modifying UI, run `npm run format` and `npm run lint` before committing.

Testing guidance
- Unit tests live near implementation modules under src/**/__tests__ or src/**/test and are executed via Vitest (see `npm run test`).
- When adding tests, aim for focused units for pure functions in src/core and component-level tests for important behaviors using @testing-library/react.

Build & deployment
- The build pipeline uses TypeScript project references (tsc -b) followed by `vite build`.
- Deployment is the static contents of the `dist/` folder after build. The app uses HashRouter so it works when hosted on static file hosting without special server configuration.

Security & privacy
- This project is designed to run entirely in the browser. No server calls are required for the core features (unless you integrate optional remote features later).
- Validate any third-party libraries before adding them; heavy parsing and evaluation (e.g., executing untrusted JS) must be avoided.

Troubleshooting & FAQ
- "Root element #root not found." — Ensure your `index.html` contains an element with id `root`. See [src/main.tsx](C:/Users/JesusR/Documents/AIGen/json-tools/src/main.tsx) where the root is required.
- Worker unavailable errors — On some environments (older browsers / restricted contexts), Web Workers may be disabled. The worker bridge in [src/services/worker.ts](C:/Users/JesusR/Documents/AIGen/json-tools/src/services/worker.ts) falls back gracefully and surfaces an error when tasks cannot be run.
- If types fail on build, run `npm run typecheck` to see the list of TypeScript errors.

Contributing
- Fork the repository and open a pull request with changes.
- Follow the existing style: TypeScript, Tailwind classes (where relevant), Prettier formatting and ESLint rules.
- Add tests for new features or bug fixes and ensure `npm run test` passes locally.
- When opening PRs, include a short summary of the change, the motivation, and any migration notes.


