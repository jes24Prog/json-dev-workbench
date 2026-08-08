import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUiStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useDraftsStore } from '../stores/draftsStore';
import { findTool } from '../constants/tools';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '');

export function modLabel(shortcut: string): string {
  return shortcut.replace(/Ctrl/g, isMac ? '⌘' : 'Ctrl');
}

/** Opens the command palette. */
export function openCommandPalette(): void {
  useUiStore.getState().setCommandPalette(true);
}

/** Dispatches a "run" event that tool pages listen to (Ctrl+Enter). */
export function dispatchRun(): void {
  window.dispatchEvent(new CustomEvent('jsonwb:run'));
}

/** Dispatches an "open file" event (Ctrl+O). */
export function dispatchOpenFile(): void {
  window.dispatchEvent(new CustomEvent('jsonwb:open'));
}

export function useGlobalShortcuts(): void {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      const ui = useUiStore.getState();

      if (e.shiftKey && key === 'p') {
        e.preventDefault();
        ui.setCommandPalette(true);
        return;
      }
      if (e.shiftKey && key === 'f') {
        e.preventDefault();
        navigate('/tools/formatter');
        return;
      }
      if (e.shiftKey && key === 'm') {
        e.preventDefault();
        navigate('/tools/minifier');
        return;
      }
      if (e.shiftKey && key === 'v') {
        e.preventDefault();
        navigate('/tools/validator');
        return;
      }
      if (e.shiftKey && key === 'd') {
        e.preventDefault();
        navigate('/tools/diff');
        return;
      }
      if (e.shiftKey && key === 'l') {
        e.preventDefault();
        useSettingsStore.getState().toggleTheme();
        return;
      }
      if (key === 'enter') {
        e.preventDefault();
        dispatchRun();
        return;
      }
      if (key === 's') {
        e.preventDefault();
        const match = location.pathname.match(/^\/tools\/([^/]+)/);
        const toolId = match?.[1];
        const draft = useDraftsStore.getState().drafts[toolId ?? ''] ?? '';
        if (draft && toolId) {
          ui.setSaveSnippetOpen(true);
        } else {
          ui.toast('Nothing to save yet. Add input to the current tool first.', 'info');
        }
        return;
      }
      if (key === 'k') {
        e.preventDefault();
        const match = location.pathname.match(/^\/tools\/([^/]+)/);
        const toolId = match?.[1] ?? 'editor';
        void useDraftsStore.getState().clearDraft(toolId);
        ui.toast('Editor cleared', 'info');
        return;
      }
      if (key === 'o') {
        e.preventDefault();
        dispatchOpenFile();
        return;
      }
      if (key === ',') {
        e.preventDefault();
        ui.setSettingsOpen(true);
        return;
      }
      if (key === 'g' && !e.shiftKey) {
        e.preventDefault();
        ui.setGlobalSearchOpen(true);
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, location.pathname]);
}

/** Allows a tool page to react to the global "run" shortcut (Ctrl+Enter). */
export function useRunShortcut(handler: () => void): void {
  useEffect(() => {
    const listener = () => handler();
    window.addEventListener('jsonwb:run', listener);
    return () => window.removeEventListener('jsonwb:run', listener);
  }, [handler]);
}

/** Allows a page to react to the global "open file" shortcut (Ctrl+O). */
export function useOpenFileShortcut(handler: () => void): void {
  useEffect(() => {
    const listener = () => handler();
    window.addEventListener('jsonwb:open', listener);
    return () => window.removeEventListener('jsonwb:open', listener);
  }, [handler]);
}

export function toolLabelForPath(pathname: string): string {
  const match = pathname.match(/^\/tools\/([^/]+)/);
  if (!match) return 'JSON Editor';
  return findTool(match[1])?.label ?? match[1];
}
