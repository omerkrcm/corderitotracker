// Small fixed palette so each profile gets a consistent, visually distinct
// color. Keyed off user id (not list position) so it doesn't shift if
// someone is renamed or the API's name-sort order changes.
const PALETTE = [
  { bg: "#dbeafe", fg: "#1d4ed8", solid: "#2563eb" }, // blue
  { bg: "#fce7f3", fg: "#be185d", solid: "#db2777" }, // pink
  { bg: "#dcfce7", fg: "#15803d", solid: "#16a34a" }, // green
  { bg: "#fef3c7", fg: "#b45309", solid: "#d97706" }, // amber
];

export function getUserColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}
