import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export interface ToolPageProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ToolPage({ title, description, icon: Icon, actions, children, className }: ToolPageProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-edge px-4 py-2.5">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold leading-tight text-ink">{title}</h1>
          <p className="truncate text-[11px] text-muted">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <main className={clsx('min-h-0 flex-1 overflow-hidden', className)}>{children}</main>
    </div>
  );
}
