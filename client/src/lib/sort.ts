export interface SortField {
  field: string;
  order: "asc" | "desc";
}

// Excel-like header click: first click sorts by this column, next click flips the order.
// Only the primary sort is replaced so any secondary sort the page keeps stays in place.
export function applyHeaderSort(
  sorts: SortField[],
  field: string,
  defaultOrder: "asc" | "desc" = "asc",
): SortField[] {
  const [first, ...rest] = sorts;
  if (first?.field === field) {
    return [{ field, order: first.order === "asc" ? "desc" : "asc" }, ...rest];
  }
  return [
    { field, order: defaultOrder },
    ...rest.filter((s) => s.field !== field),
  ];
}
