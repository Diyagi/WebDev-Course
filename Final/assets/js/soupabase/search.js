// Quote filter values so punctuation cannot change the PostgREST expression.
// Builds text search filters for the specified columns.
export function textSearchFilter(columns, search) {
  const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
  const value = `"${pattern.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  return columns.map((column) => `${column}.ilike.${value}`).join(",");
}

// Builds an ID filter when the search contains a valid identifier.
export function idSearchFilter(search) {
  // IDs use PostgreSQL serial (a positive signed 32-bit integer).
  return /^\d+$/.test(search) &&
    Number(search) > 0 &&
    Number(search) <= 2147483647
    ? `id.eq.${Number(search)}`
    : "";
}

// Applies search filters to the query.
export function applySearch(query, search, columns, relatedFilters = []) {
  const term = search.trim();
  if (!term) return query;
  return query.or(
    [textSearchFilter(columns, term), idSearchFilter(term), ...relatedFilters]
      .filter(Boolean)
      .join(","),
  );
}
