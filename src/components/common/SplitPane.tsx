import { useCallback, useRef, useState, type ReactNode, type KeyboardEvent } from 'react';

export interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  initialRatio?: number;
  minLeft?: number;
  minRight?: number;
  orientation?: 'horizontal' | 'vertical';
  leftLabel?: string;
  rightLabel?: string;
}

export function SplitPane({
  left,
  right,
  initialRatio = 0.5,
  minLeft = 120,
  minRight = 120,
  orientation = 'horizontal',
  leftLabel,
  rightLabel,
}: SplitPaneProps) {
  const [ratio, setRatio] = useState(initialRatio);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const horizontal = orientation === 'horizontal';

  const updateRatio = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const size = horizontal ? rect.width : rect.height;
      if (size === 0) return;
      const position = horizontal ? clientX - rect.left : clientY - rect.top;
      const minRatio = minLeft / size;
      const maxRatio = 1 - minRight / size;
      setRatio(Math.min(Math.max(position / size, minRatio), maxRatio));
    },
    [horizontal, minLeft, minRight],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      draggingRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      updateRatio(e.clientX, e.clientY);
    },
    [updateRatio],
  );

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const delta = e.shiftKey ? 20 : 5;
      const dir =
        e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -delta
          : e.key === 'ArrowRight' || e.key === 'ArrowDown'
            ? delta
            : 0;
      if (dir === 0) return;
      e.preventDefault();
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      updateRatio(
        horizontal ? rect.left + rect.width * ratio + dir : rect.left,
        horizontal ? rect.top : rect.top + rect.height * ratio + dir,
      );
    },
    [horizontal, ratio, updateRatio],
  );

  const label = (text?: string) =>
    text ? (
      <span className="absolute left-2 top-1.5 z-10 rounded bg-surface-2/90 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
        {text}
      </span>
    ) : null;

  const flexBasis = `${ratio * 100}%`;

  return (
    <div
      ref={containerRef}
      className={horizontal ? 'flex h-full min-h-0 w-full' : 'flex h-full min-h-0 w-full flex-col'}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="relative min-w-0" style={horizontal ? { width: flexBasis } : { height: flexBasis }}>
        {label(leftLabel)}
        {left}
      </div>
      <div
        role="separator"
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        className={
          horizontal
            ? 'h-full w-[5px] shrink-0 cursor-col-resize touch-none border-x border-edge bg-edge hover:bg-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent'
            : 'h-[5px] w-full shrink-0 cursor-row-resize touch-none border-y border-edge bg-edge hover:bg-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent'
        }
      />
      <div className="relative min-w-0 flex-1">
        {label(rightLabel)}
        {right}
      </div>
    </div>
  );
}
