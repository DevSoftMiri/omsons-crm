import type { SortDirection } from "./sort-menu";

export function sortRecords<T>(records: T[], key: string, direction: SortDirection, getValue: (record: T, key: string) => unknown): T[] {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...records].sort((left, right) => {
    const a = getValue(left, key); const b = getValue(right, key);
    if (a == null && b == null) return 0; if (a == null) return 1; if (b == null) return -1;
    if (typeof a === "number" && typeof b === "number") return (a - b) * multiplier;
    const leftDate = typeof a === "string" && !Number.isNaN(Date.parse(a)) ? Date.parse(a) : null;
    const rightDate = typeof b === "string" && !Number.isNaN(Date.parse(b)) ? Date.parse(b) : null;
    if (leftDate !== null && rightDate !== null) return (leftDate - rightDate) * multiplier;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" }) * multiplier;
  });
}
