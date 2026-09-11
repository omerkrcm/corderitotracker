// Each profile gets one of a fixed set of colors (defined in globals.css
// as the --user-0-fg..--user-3-fg / --user-0-bg..--user-3-bg custom
// properties, and the .user-color-0..3 classes that pair them), keyed
// off user id rather than list position so it doesn't shift if someone
// is renamed.
const SLOT_COUNT = 4;

function getUserColorSlot(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % SLOT_COUNT;
}

// A class pairing background+foreground (for avatar badges etc). Using a
// class rather than inline hex styles lets the light/dark palette swap
// in globals.css apply automatically.
export function getUserColorClass(id: string): string {
  return `user-color-${getUserColorSlot(id)}`;
}

// A `var(--user-N-fg)` reference for contexts that need a raw color value
// (SVG fill/stroke, inline styles) rather than a class. Still fully
// theme-reactive: the browser resolves the var() at paint time against
// whichever light/dark value is currently cascaded.
export function getUserColorVar(id: string): string {
  return `var(--user-${getUserColorSlot(id)}-fg)`;
}

export function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}
