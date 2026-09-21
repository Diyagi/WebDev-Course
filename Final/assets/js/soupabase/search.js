// Quote filter values so punctuation cannot change the PostgREST expression.
export function textSearchFilter(columns, search) {
    const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    const value = `"${pattern.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    return columns.map((column) => `${column}.ilike.${value}`).join(",");
}

export function idSearchFilter(search) {
    // IDs use PostgreSQL serial (a positive signed 32-bit integer).
    return /^\d+$/.test(search) && Number(search) > 0 && Number(search) <= 2147483647
        ? `id.eq.${Number(search)}`
        : "";
}

export function applySearch(query, search, columns, relatedFilters = []) {
    const term = search.trim();
    if (!term) return query;
    return query.or([
        textSearchFilter(columns, term),
        idSearchFilter(term),
        ...relatedFilters
    ].filter(Boolean).join(","));
}
