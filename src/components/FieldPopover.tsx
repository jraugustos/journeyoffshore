'use client';
import { useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export type FieldAnchor = { left: number; top: number; bottom: number; width: number };
export function fieldPanelId(type: string, id?: string, section?: string) {
  return ['oj-field', type, id, section].filter(Boolean).join('-');
}
export function fieldAnchor(element: HTMLElement): FieldAnchor {
  const { left, top, bottom, width } = element.getBoundingClientRect();
  return { left, top, bottom, width };
}
export default function FieldPopover({
  label,
  id: panelId,
  anchor,
  onClose,
  children,
}: {
  label: string;
  id?: string;
  anchor: FieldAnchor;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null),
    dismiss = useRef(onClose),
    id = useId();
  dismiss.current = onClose;
  useLayoutEffect(() => {
    const element = panel.current!;
    const previous = document.activeElement as HTMLElement | null;
    const position = () => {
      const width = Math.min(Math.max(anchor.width, 320), 420, window.innerWidth - 24);
      element.style.width = width + 'px';
      element.style.maxHeight = window.innerHeight - 24 + 'px';
      element.style.left =
        Math.max(12, Math.min(anchor.left, window.innerWidth - width - 12)) + 'px';
      const height = element.getBoundingClientRect().height;
      const below = window.innerHeight - anchor.bottom - 20;
      const top =
        below < Math.min(height, 220) && anchor.top > below
          ? anchor.top - height - 6
          : anchor.bottom + 6;
      element.style.top = Math.max(12, Math.min(top, window.innerHeight - height - 12)) + 'px';
    };
    const toggled = (event: Event) => {
      if ((event as ToggleEvent).newState === 'closed') dismiss.current();
    };
    const scrolled = (event: Event) => {
      if (event.target instanceof Node && !element.contains(event.target)) element.hidePopover();
    };
    element.showPopover();
    position();
    element.addEventListener('toggle', toggled);
    const resize = new ResizeObserver(position);
    resize.observe(element);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', scrolled, true);
    element.querySelector<HTMLElement>('input:not([type=checkbox]), textarea, select')?.focus();
    return () => {
      element.removeEventListener('toggle', toggled);
      resize.disconnect();
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', scrolled, true);
      const restore =
        element.contains(document.activeElement) || document.activeElement === document.body;
      element.hidePopover();
      if (restore && previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [anchor]);
  return (
    <div
      id={panelId}
      ref={panel}
      popover="auto"
      className="oj-field-popover"
      role="dialog"
      aria-labelledby={id}
    >
      <header>
        <h2 id={id}>{label}</h2>
        <button className="oj-icon" type="button" aria-label="Fechar seleção" onClick={onClose}>
          <X size={16} />
        </button>
      </header>
      {children}
    </div>
  );
}
