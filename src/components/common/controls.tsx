import type { ReactNode } from 'react';

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="text-[10px] text-muted">{hint}</span>}
    </label>
  );
}

export function Select<T extends string | number>({
  value,
  onChange,
  options,
  label,
  compact = false,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label?: string;
  compact?: boolean;
}) {
  return (
    <label className="flex items-center gap-1.5">
      {label && <span className="text-[11px] font-medium text-muted">{label}</span>}
      <select
        className={`input ${compact ? 'py-0.5 text-[11px]' : 'py-1 text-xs'}`}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  className = '',
  spellCheck = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  spellCheck?: boolean;
}) {
  return (
    <input
      className={`input py-1 text-xs ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={spellCheck}
    />
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  className = '',
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <input
      type="number"
      className={`input w-20 py-1 text-xs ${className}`}
      value={Number.isFinite(value) ? value : 0}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const n = Number(e.target.value);
        onChange(Number.isFinite(n) ? n : 0);
      }}
    />
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-1.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`relative h-4 w-7 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-surface-3'}`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${checked ? 'left-3.5' : 'left-0.5'}`}
        />
      </button>
      <span className="text-xs text-ink">{label}</span>
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {label && <span className="text-[11px] font-medium text-muted">{label}</span>}
      <div className="inline-flex items-center rounded-md border border-edge bg-surface-2 p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
              value === o.value
                ? 'bg-accent text-white'
                : 'text-muted hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function OptionsBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-edge bg-surface px-4 py-2">
      {children}
    </div>
  );
}
