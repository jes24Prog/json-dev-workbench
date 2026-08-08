import { Modal } from './Modal';
import { useUiStore } from '../../stores/uiStore';

export function AboutDialog() {
  const open = useUiStore((s) => s.aboutOpen);
  const setOpen = useUiStore((s) => s.setAboutOpen);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="About JSON Developer Workbench" width="max-w-md">
      <div className="space-y-3 text-xs text-ink">
        <p>
          <strong>JSON Developer Workbench</strong> is a comprehensive toolkit for software
          engineers who work with JSON every day: formatting, validation, diffing, merging,
          querying, schema generation, mock data, converters, code generators, and more.
        </p>
        <p>
          Version 1.0.0 — built with React, TypeScript, Vite, Tailwind CSS and CodeMirror.
        </p>
        <div className="rounded-md border border-emerald-600/40 bg-emerald-600/10 p-3">
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
            Privacy by design
          </p>
          <p className="mt-1 text-muted">
            Everything runs locally in your browser. No data is uploaded, no analytics are
            collected, and no telemetry is transmitted. You can disconnect from the network
            and every tool keeps working.
          </p>
        </div>
        <p className="text-muted">
          Works offline · Installable as a PWA · Your snippets, projects and history are stored
          in your browser only and can be cleared from Settings.
        </p>
      </div>
    </Modal>
  );
}
