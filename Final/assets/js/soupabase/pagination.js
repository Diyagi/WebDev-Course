export const PAGE_SIZE = 25;

function quoteValue(value) {
    return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// Nulls are always last; id makes every ordering unique, including tied values.
export function seek(query, cursor, { key = "id", direction = "asc", related } = {}) {
    const ascending = direction === "asc";
    const operator = ascending ? "gt" : "lt";
    if (related) {
        query = query.order(`${related.relation}(${related.column})`, { ascending, nullsFirst: false }).order("id", { ascending });
        if (!cursor) return query;
        query = query.not(`cursor_present.${related.column}`, "is", null);
        if (cursor.value == null) return query.or("cursor_present.is.null")[operator]("id", cursor.id);
        return query[operator](`cursor_after.${related.column}`, cursor.value)
            .eq(`cursor_equal.${related.column}`, cursor.value)
            .or(`cursor_after.not.is.null,and(cursor_equal.not.is.null,id.${operator}.${cursor.id}),cursor_present.is.null`);
    }
    query = query.order(key, { ascending, nullsFirst: false });
    if (key !== "id") query = query.order("id", { ascending });
    if (!cursor) return query;
    if (key === "id") return query[operator]("id", cursor.id);
    if (cursor.value == null) return query.is(key, null)[operator]("id", cursor.id);
    const value = quoteValue(cursor.value);
    return query.or(`${key}.${operator}.${value},and(${key}.eq.${value},id.${operator}.${cursor.id}),${key}.is.null`);
}

export async function readPage(makeQuery, { cursor = null, pageSize = PAGE_SIZE, sort = { key: "id", direction: "asc" }, isCurrent = () => true } = {}, include = () => true) {
    const size = Math.max(1, Math.min(100, Math.trunc(Number(pageSize)) || PAGE_SIZE));
    const rows = [];
    let after = cursor;
    const valueOf = (row) => sort.related ? row[sort.related.relation]?.[sort.related.column] ?? null : row[sort.key] ?? null;
    // Some existing filters (quote expiry) depend on per-row date arithmetic.
    // Scan bounded keyset batches until a full visible page plus lookahead exists.
    while (rows.length <= size && isCurrent()) {
        const { data, error } = await seek(makeQuery(), after, sort).limit(size + 1);
        if (error) return { data: null, error, nextCursor: null };
        const batch = data ?? [];
        rows.push(...batch.filter(include));
        if (batch.length < size + 1) break;
        const last = batch[batch.length - 1];
        after = { id: last.id, value: valueOf(last) };
    }
    const data = rows.slice(0, size);
    const last = data[data.length - 1];
    return {
        data,
        error: null,
        nextCursor: rows.length > size ? { id: last.id, value: valueOf(last) } : null
    };
}
