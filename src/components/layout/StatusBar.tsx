import { useLocation } from 'react-router-dom';
import { ShieldCheck, Workflow } from 'lucide-react';
import { toolLabelForPath } from '../../hooks/useGlobalShortcuts';
import { useSettingsStore } from '../../stores/settingsStore';

export function StatusBar() {
  const location = useLocation();
  const workerEnabled = useSettingsStore((s) => s.settings.workerProcessing);
  const tool = toolLabelForPath(location.pathname);

  return (
    <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-edge bg-surface-2 px-3 text-[10px] text-muted">
      <span className="font-medium text-ink">{tool}</span>
      <span className="hidden items-center gap-1 sm:flex">
        <ShieldCheck className="h-3 w-3 text-emerald-500" aria-hidden />
        All processing is local
      </span>
      <span className="hidden items-center gap-1 md:flex">
        <Workflow className="h-3 w-3" aria-hidden />
        {workerEnabled ? 'Worker: enabled' : 'Worker: inline'}
      </span>
      <span className="flex-1" />
      <span className="hidden lg:inline">Ctrl+Enter run · Ctrl+Shift+P palette</span>
    </footer>
  );
}
