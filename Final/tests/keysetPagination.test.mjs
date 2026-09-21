// Run with: node --experimental-default-type=module tests/keysetPagination.test.mjs
import { readPage, seek } from "../assets/js/soupabase/pagination.js";
import { createPagination } from "../assets/js/pagination.js";

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function split(expression) {
    let depth = 0;
    let quoted = false;
    let escaped = false;
    let start = 0;
    const parts = [];
    for (let index = 0; index < expression.length; index++) {
        const char = expression[index];
        if (escaped) { escaped = false; continue; }
        if (char === "\\" && quoted) { escaped = true; continue; }
        if (char === '"') quoted = !quoted;
        if (quoted) continue;
        if (char === "(") depth++;
        if (char === ")") depth--;
        if (char === "," && !depth) { parts.push(expression.slice(start, index)); start = index + 1; }
    }
    parts.push(expression.slice(start));
    return parts;
}

function matches(row, expression) {
    if (expression.startsWith("and(")) return split(expression.slice(4, -1)).every((part) => matches(row, part));
    const [, key, operator, raw] = expression.match(/^([^.]+)\.(eq|gt|lt|is)\.(.*)$/) || [];
    if (!key) throw new Error(`Unsupported test filter: ${expression}`);
    const value = raw === "null" ? null : raw.startsWith('"') ? JSON.parse(raw) : Number(raw);
    if (operator === "is") return row[key] == null;
    if (row[key] == null) return false;
    if (operator === "eq") return row[key] === value;
    return operator === "gt" ? row[key] > value : row[key] < value;
}

function makeQuery(rows, calls, failure) {
    const filters = [];
    const order = [];
    const query = {
        order(key, options) { order.push({ key, ...options }); return this; },
        gt(key, value) { filters.push((row) => row[key] != null && row[key] > value); return this; },
        lt(key, value) { filters.push((row) => row[key] != null && row[key] < value); return this; },
        is(key) { filters.push((row) => row[key] == null); return this; },
        or(expression) { filters.push((row) => split(expression).some((part) => matches(row, part))); return this; },
        async limit(size) {
            calls.push({ size, order });
            if (failure) return { data: null, error: failure };
            const data = rows.filter((row) => filters.every((filter) => filter(row))).sort((a, b) => {
                for (const { key, ascending } of order) {
                    if (a[key] === b[key]) continue;
                    if (a[key] == null) return 1;
                    if (b[key] == null) return -1;
                    return (a[key] < b[key] ? -1 : 1) * (ascending ? 1 : -1);
                }
                return 0;
            });
            return { data: data.slice(0, size), error: null };
        }
    };
    return query;
}

export async function runTests() {
    let checks = 0;
    const check = (condition, message) => { assert(condition, message); checks++; };
    const rows = Array.from({ length: 63 }, (_, index) => ({ id: index + 1 }));
    const calls = [];
    let cursor = null;
    const collected = [];
    do {
        const result = await readPage(() => makeQuery(rows, calls), { cursor });
        check(result.data.length <= 25, "Page exceeds size");
        collected.push(...result.data.map((row) => row.id));
        cursor = result.nextCursor;
    } while (cursor);
    check(collected.join() === rows.map((row) => row.id).join(), "Missing/duplicate IDs across pages");
    check(calls.every((call) => call.size === 26), "Requests must use bounded lookahead");

    for (const length of [0, 25, 26, 50]) {
        const result = await readPage(() => makeQuery(rows.slice(0, length), []));
        check(Boolean(result.nextCursor) === (length > 25), `Wrong next-page state for ${length} rows`);
    }

    const tied = [
        { id: 1, name: 'A, "quoted" \\ name' }, { id: 2, name: 'A, "quoted" \\ name' },
        { id: 3, name: "B" }, { id: 4, name: "B" },
        { id: 5, name: null }, { id: 6, name: null }, { id: 7, name: null }
    ];
    for (const direction of ["asc", "desc"]) {
        const actual = [];
        let after = null;
        do {
            const result = await readPage(() => makeQuery(tied, []), { cursor: after, pageSize: 1, sort: { key: "name", direction } });
            actual.push(...result.data.map((row) => row.id));
            after = result.nextCursor;
        } while (after);
        const expected = direction === "asc" ? [1, 2, 3, 4, 5, 6, 7] : [4, 3, 2, 1, 7, 6, 5];
        check(actual.join() === expected.join(), `Ties, escaped strings or nulls skipped (${direction})`);
    }

    const filtered = await readPage(() => makeQuery(rows, []), { pageSize: 3 }, (row) => row.id % 10 === 0);
    check(filtered.data.map((row) => row.id).join() === "10,20,30", "Residual filters must fill a visible page");
    const filteredNext = await readPage(() => makeQuery(rows, []), { pageSize: 3, cursor: filtered.nextCursor }, (row) => row.id % 10 === 0);
    check(filteredNext.data.map((row) => row.id).join() === "40,50,60" && !filteredNext.nextCursor, "Lookahead must not skip residual matches");
    const none = await readPage(() => makeQuery(rows, []), {}, () => false);
    check(!none.data.length && !none.nextCursor, "All-filtered result must terminate");

    const original = await readPage(() => makeQuery(rows, []));
    const changed = [{ id: 0 }, ...rows.filter((row) => row.id !== 2)];
    const second = await readPage(() => makeQuery(changed, []), { cursor: original.nextCursor });
    check(second.data[0].id === 26, "Insert/delete before cursor shifted the next page");
    const error = { message: "offline" };
    check((await readPage(() => makeQuery(rows, [], error))).error === error, "Query errors must propagate");
    let queried = false;
    await readPage(() => { queried = true; return makeQuery(rows, []); }, { isCurrent: () => false });
    check(!queried, "Superseded scans should stop");

    const relatedCalls = [];
    const relatedQuery = new Proxy({}, { get: (_, method) => (...args) => { relatedCalls.push([method, ...args]); return relatedQuery; } });
    seek(relatedQuery, { id: 42, value: "Tools" }, { key: "category", direction: "asc", related: { relation: "category", column: "description" } });
    check(relatedCalls[0][1] === "category(description)", "Category sorting must order the parent rows");
    check(relatedCalls.some((call) => call[0] === "gt" && call[1] === "cursor_after.description"), "Category cursor requires a related value filter");
    check(relatedCalls.some((call) => call[0] === "or" && call[1].includes("id.gt.42")), "Category cursor must break ties by product ID");

    const oldDocument = globalThis.document;
    const elements = [];
    const element = () => ({
        listeners: {}, children: [], disabled: false,
        setAttribute() {}, append(...children) { this.children.push(...children); },
        appendChild(child) { this.children.push(child); }, remove() { this.removed = true; },
        addEventListener(event, callback) { this.listeners[event] = callback; }
    });
    globalThis.document = { createElement() { const item = element(); elements.push(item); return item; } };
    try {
        let changedPage = 0;
        const pagination = createPagination({ closest: () => ({ after() {} }) }, () => changedPage++);
        const [previous, next, retry] = elements.filter((item) => item.className === "btn btn-sm btn-outline-secondary");
        check(previous.disabled && next.disabled, "Initial navigation state");
        pagination.complete({ nextCursor: { id: 25 } });
        next.listeners.click();
        check(pagination.cursor.id === 25 && changedPage === 1, "Next must use the response cursor");
        pagination.loading();
        check(previous.disabled && next.disabled, "Disable navigation during requests");
        pagination.complete({ nextCursor: { id: 50 } });
        previous.listeners.click();
        check(pagination.cursor === null, "Previous must restore the saved cursor");
        pagination.error();
        check(!retry.hidden && next.disabled, "Failed requests must be retryable");
        pagination.reset();
        check(pagination.cursor === null && previous.disabled && next.disabled, "Reset must discard cursor history");
        pagination.destroy();
        check(elements[0].removed, "Modal disposal must remove pagination controls");
    } finally {
        globalThis.document = oldDocument;
    }
    return checks;
}

console.log(`Passed ${await runTests()} keyset pagination checks.`);
