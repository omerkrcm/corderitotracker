// Each profile gets one of a fixed set of CSS classes (defined in
// globals.css as `.user-color-0`..`.user-color-3`), keyed off user id
// rather than list position so it doesn't shift if someone is renamed.
// Using classes (not inline hex styles) lets the light/dark palette
// swap in globals.css apply automatically.
const SLOT_COUNT = 4;

export function getUserColorClass(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return `user-color-${hash % SLOT_COUNT}`;
}

export function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}
