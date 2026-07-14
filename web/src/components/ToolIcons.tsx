// Small monochrome (currentColor) line icons, kept as plain inline SVG so the
// toolbar has zero icon-font/image dependencies.

export function FillIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 2 4 9l7 7a4.95 4.95 0 0 0 7-7l-7-7Z" />
      <path d="M4.5 12.5 2 15c-.5 1.5 0 3 2 3s2.5-1.5 2-3l-2.5-2.5Z" />
      <path d="M2.5 15h4" />
    </svg>
  );
}

export function EraserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13 9 22H5l-2-2a2 2 0 0 1 0-2.8L14.2 5a2 2 0 0 1 2.8 0l3.6 3.6a2 2 0 0 1 0 2.8L18 13Z" />
      <path d="M9 22H20" />
      <path d="m12 8 6 6" />
    </svg>
  );
}

export function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h9a6 6 0 0 1 0 12h-2" />
      <path d="M8 5 3 10l5 5" />
    </svg>
  );
}

export function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function PenIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
    </svg>
  );
}

export function ThumbUpIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 22V11l5-8 1 1v6h6.5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 18.3 22H7Z" />
      <path d="M7 11H3v11h4" />
    </svg>
  );
}

export function ThumbDownIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2v11l-5 8-1-1v-6H4.5a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 5.7 2H17Z" />
      <path d="M17 13h4V2h-4" />
    </svg>
  );
}
