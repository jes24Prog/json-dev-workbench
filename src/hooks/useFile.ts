import { useCallback } from 'react';

export type FileKind = 'json' | 'yaml' | 'xml' | 'csv' | 'text';

export interface ImportedFile {
  name: string;
  kind: FileKind;
  content: string;
  size: number;
}

const EXT_MAP: Record<string, FileKind> = {
  json: 'json',
  jsonc: 'json',
  json5: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  csv: 'csv',
  txt: 'text',
  text: 'text',
  log: 'text',
};

function detectKind(name: string): FileKind {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MAP[ext] ?? 'text';
}

export function useFileImport(): {
  openFilePicker: (accept?: string) => Promise<ImportedFile | null>;
  readFile: (file: File) => Promise<ImportedFile>;
} {
  const readFile = useCallback((file: File): Promise<ImportedFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          name: file.name,
          kind: detectKind(file.name),
          content: String(reader.result ?? ''),
          size: file.size,
        });
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });
  }, []);

  const openFilePicker = useCallback(
    (accept = '.json,.yaml,.yml,.xml,.csv,.txt,.jsonc,.json5'): Promise<ImportedFile | null> => {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          try {
            resolve(await readFile(file));
          } catch {
            resolve(null);
          }
        };
        input.click();
      });
    },
    [readFile],
  );

  return { openFilePicker, readFile };
}

export function useFileDownload(): (content: string, filename: string, mime?: string) => void {
  return useCallback((content, filename, mime = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, []);
}
