import { useState } from 'react';
import { Modal } from './Modal';
import { useSettingsStore } from '../../stores/settingsStore';
import { clearAllData } from '../../services/storage/db';
import { useUiStore } from '../../stores/uiStore';
import { useHistoryStore } from '../../stores/historyStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useDraftsStore } from '../../stores/draftsStore';
import type { ThemeMode } from '../../services/storage/settings';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, hint, control }: { label: string; hint?: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-ink">{label}</p>
        {hint && <p className="text-[11px] text-muted">{hint}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-surface-3 border border-edge'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
          checked ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <select
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SettingsDialog() {
  const open = useUiStore((s) => s.settingsOpen);
  const setOpen = useUiStore((s) => s.setSettingsOpen);
  const toast = useUiStore((s) => s.toast);
  const { settings, update, reset } = useSettingsStore();
  const [confirmClear, setConfirmClear] = useState(false);

  const clearData = async () => {
    await clearAllData();
    await useHistoryStore.getState().clear();
    await useWorkspaceStore.getState().load();
    await useDraftsStore.getState().discardAll();
    toast('All local data cleared', 'info');
    setConfirmClear(false);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Settings" width="max-w-xl">
      <div className="max-h-[65vh] overflow-y-auto pr-1">
        <Section title="Editor">
          <Row
            label="Font size"
            control={
              <input
                type="number"
                min={9}
                max={28}
                value={settings.fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="input w-20"
                aria-label="Font size"
              />
            }
          />
          <Row
            label="Tab size"
            control={
              <input
                type="number"
                min={1}
                max={8}
                value={settings.tabSize}
                onChange={(e) => update({ tabSize: Number(e.target.value) })}
                className="input w-20"
                aria-label="Tab size"
              />
            }
          />
          <Row label="Word wrap" control={<Toggle checked={settings.wordWrap} onChange={(v) => update({ wordWrap: v })} label="Word wrap" />} />
          <Row label="Minimap" control={<Toggle checked={settings.showMinimap} onChange={(v) => update({ showMinimap: v })} label="Minimap" />} />
          <Row label="Line numbers" control={<Toggle checked={settings.showLineNumbers} onChange={(v) => update({ showLineNumbers: v })} label="Line numbers" />} />
        </Section>

        <Section title="Formatting">
          <Row
            label="Default indentation"
            control={
              <Select
                value={settings.indent}
                onChange={(v) => update({ indent: v as '2' | '4' | 'tab' })}
                options={[
                  { value: '2', label: '2 spaces' },
                  { value: '4', label: '4 spaces' },
                  { value: 'tab', label: 'Tabs' },
                ]}
                label="Default indentation"
              />
            }
          />
          <Row label="Sort keys by default" control={<Toggle checked={settings.sortKeys} onChange={(v) => update({ sortKeys: v })} label="Sort keys" />} />
          <Row label="Escape unicode by default" control={<Toggle checked={settings.escapeUnicode} onChange={(v) => update({ escapeUnicode: v })} label="Escape unicode" />} />
        </Section>

        <Section title="Application">
          <Row
            label="Theme"
            control={
              <Select
                value={settings.theme}
                onChange={(v) => update({ theme: v as ThemeMode })}
                options={[
                  { value: 'system', label: 'System' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                ]}
                label="Theme"
              />
            }
          />
          <Row label="Confirm destructive actions" control={<Toggle checked={settings.confirmDestructive} onChange={(v) => update({ confirmDestructive: v })} label="Confirm destructive actions" />} />
        </Section>

        <Section title="Privacy">
          <Row label="Save operation history locally" control={<Toggle checked={settings.saveHistory} onChange={(v) => update({ saveHistory: v })} label="Save history" />} />
          <Row label="Save workspace locally" control={<Toggle checked={settings.saveWorkspace} onChange={(v) => update({ saveWorkspace: v })} label="Save workspace" />} />
          <Row
            label="Web Worker processing"
            hint="Keeps the UI responsive for large documents"
            control={<Toggle checked={settings.workerProcessing} onChange={(v) => update({ workerProcessing: v })} label="Worker processing" />}
          />
          {!confirmClear ? (
            <div>
              <button type="button" className="btn btn-danger" onClick={() => setConfirmClear(true)}>
                Clear all local data
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded border border-red-600/40 bg-red-600/5 p-2">
              <span className="flex-1 text-xs text-red-600">Delete all snippets, projects, history and drafts?</span>
              <button type="button" className="btn btn-danger" onClick={() => void clearData()}>
                Confirm
              </button>
              <button type="button" className="btn" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
            </div>
          )}
        </Section>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn" onClick={() => { reset(); toast('Settings restored to defaults', 'info'); }}>
          Reset to defaults
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
          Done
        </button>
      </div>
    </Modal>
  );
}
