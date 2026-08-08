import { memo, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { xml } from '@codemirror/lang-xml';
import { sql } from '@codemirror/lang-sql';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { bracketMatching } from '@codemirror/language';
import { closeBrackets } from '@codemirror/autocomplete';
import { useSettingsStore } from '../../stores/settingsStore';

export type EditorLanguage = 'json' | 'yaml' | 'xml' | 'sql' | 'markdown' | 'text';

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: EditorLanguage;
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
}

function extensionsFor(language: EditorLanguage): ReturnType<typeof json>[] {
  const base = [
    EditorView.lineWrapping,
    bracketMatching(),
    closeBrackets(),
  ] as ReturnType<typeof json>[];
  switch (language) {
    case 'json':
      return [...base, json()];
    case 'yaml':
      return [...base, yaml()];
    case 'xml':
      return [...base, xml()];
    case 'sql':
      return [...base, sql()];
    case 'markdown':
      return [...base, markdown()];
    case 'text':
    default:
      return base;
  }
}

export const CodeEditor = memo(function CodeEditor({
  value,
  onChange,
  language = 'json',
  readOnly = false,
  placeholder,
  minHeight,
  ariaLabel,
  autoFocus,
}: CodeEditorProps) {
  const settings = useSettingsStore((s) => s.settings);
  const isDark = useSettingsStore((s) => s.resolvedTheme === 'dark');

  const extensions = useMemo(
    () => extensionsFor(language),
    [language],
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      height="100%"
      style={{
        minHeight,
        fontSize: settings.fontSize,
        height: '100%',
      }}
      extensions={extensions}
      editable={!readOnly}
      readOnly={readOnly}
      placeholder={placeholder}
      theme={isDark ? 'dark' : 'light'}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      basicSetup={{
        lineNumbers: settings.showLineNumbers,
        foldGutter: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: false,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: false,
        searchKeymap: true,
      }}
      className="h-full"
    />
  );
});
