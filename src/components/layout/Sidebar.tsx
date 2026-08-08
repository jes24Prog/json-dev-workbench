import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TOOL_CATEGORIES } from '../../constants/tools';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <nav
      aria-label="Tools"
      className="flex h-full w-56 shrink-0 flex-col overflow-y-auto border-r border-edge bg-surface-2 scrollbar-thin"
    >
      {TOOL_CATEGORIES.map((category) => {
        const isCollapsed = collapsed[category.id];
        return (
          <div key={category.id} className="border-b border-edge/60 py-1">
            <button
              type="button"
              onClick={() => setCollapsed((c) => ({ ...c, [category.id]: !c[category.id] }))}
              className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-ink"
              aria-expanded={!isCollapsed}
            >
              <span>{category.label}</span>
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3" aria-hidden />
              ) : (
                <ChevronDown className="h-3 w-3" aria-hidden />
              )}
            </button>
            {!isCollapsed && (
              <ul className="mt-0.5 space-y-px px-1.5">
                {category.tools.map((tool) => (
                  <li key={tool.id}>
                    <NavLink
                      to={`/tools/${tool.id}`}
                      title={tool.description}
                      className={({ isActive }) =>
                        `group flex items-center gap-2 rounded px-2 py-1 text-xs ${
                          isActive
                            ? 'bg-accent/10 font-medium text-accent'
                            : 'text-muted hover:bg-surface-3 hover:text-ink'
                        }`
                      }
                    >
                      <tool.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{tool.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
