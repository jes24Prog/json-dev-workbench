import { useEffect } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { Toaster } from './components/layout/Toaster';
import { CommandPalette } from './components/palette/CommandPalette';
import { SettingsDialog } from './components/dialogs/SettingsDialog';
import { ShortcutsDialog } from './components/dialogs/ShortcutsDialog';
import { AboutDialog } from './components/dialogs/AboutDialog';
import { SaveSnippetDialog } from './components/dialogs/SaveSnippetDialog';
import { RestoreSessionDialog } from './components/dialogs/RestoreSessionDialog';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useDraftsStore } from './stores/draftsStore';
import { useWorkspaceStore } from './stores/workspaceStore';
import { useHistoryStore } from './stores/historyStore';
import { useSettingsStore } from './stores/settingsStore';
import { getToolComponent } from './features/ToolComponents';

function ToolView() {
  const { toolId } = useParams<{ toolId: string }>();
  const Component = toolId ? getToolComponent(toolId) : undefined;
  if (!Component) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <div className="text-sm font-medium text-ink">Unknown tool</div>
          <div className="mt-1 text-xs text-muted">The tool “{toolId}” does not exist.</div>
          <a className="mt-4 inline-block text-xs text-accent hover:underline" href="#/tools/editor">
            Go to JSON Editor
          </a>
        </div>
      </div>
    );
  }
  return <Component />;
}

function WorkspaceView() {
  const { section } = useParams<{ section: string }>();
  const Component = section ? getToolComponent(section) : undefined;
  if (!Component) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted">
        Unknown workspace section.
      </div>
    );
  }
  return <Component />;
}

function Shell() {
  useGlobalShortcuts();

  useEffect(() => {
    void useDraftsStore.getState().load();
    void useWorkspaceStore.getState().load();
    void useHistoryStore.getState().load();
  }, []);

  const resolvedTheme = useSettingsStore((s) => s.resolvedTheme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    document.documentElement.classList.toggle('light', resolvedTheme === 'light');
  }, [resolvedTheme]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-app text-ink">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/tools/editor" replace />} />
            <Route path="/tools/:toolId" element={<ToolView />} />
            <Route path="/workspace/:section" element={<WorkspaceView />} />
            <Route path="*" element={<Navigate to="/tools/editor" replace />} />
          </Routes>
        </main>
      </div>
      <StatusBar />
      <CommandPalette />
      <SettingsDialog />
      <ShortcutsDialog />
      <AboutDialog />
      <SaveSnippetDialog />
      <RestoreSessionDialog />
      <Toaster />
    </div>
  );
}

export default function App() {
  return <Shell />;
}
