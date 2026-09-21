// Run with: node --experimental-default-type=module tests/paginationSearch.test.mjs
import { bindPickerSearch } from "../components/pickerSearch.js";
import { bindListSearch } from "../assets/js/listSearch.js";

export async function runSearchTests() {
    const original = { document: globalThis.document, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout };
    const timers = new Map();
    let timerId = 0;
    let checks = 0;
    const check = (value, message) => { if (!value) throw new Error(message); checks++; };
    function element() {
        return {
            value: "", isConnected: true, attributes: new Map(), listeners: {}, children: [],
            setAttribute(key, value) { this.attributes.set(key, value); },
            removeAttribute(key) { this.attributes.delete(key); },
            addEventListener(key, fn) { this.listeners[key] = fn; },
            removeEventListener(key, fn) { if (this.listeners[key] === fn) delete this.listeners[key]; },
            append(...children) { this.children.push(...children); },
            appendChild(child) { this.children.push(child); },
            replaceChildren(...children) { this.children = children; },
            closest() { return this; }, after(nav) { this.nav = nav; },
            remove() { this.removed = true; }
        };
    }
    const input = element(), body = element(), modal = element(), filter = element();
    globalThis.document = { createElement: element, getElementById: (id) => ({ input, body, filter })[id] };
    globalThis.setTimeout = (callback) => { timers.set(++timerId, callback); return timerId; };
    globalThis.clearTimeout = (id) => timers.delete(id);
    const fire = () => {
        const [id, callback] = timers.entries().next().value;
        timers.delete(id);
        return callback();
    };
    const requests = [], results = [];
    const load = (term, options) => new Promise((resolve) => requests.push({ term, options, resolve }));
    let sort = { key: "name", direction: "asc" };
    try {
        const dispose = bindPickerSearch({ modal, input, body, columnCount: 5, load,
            onPending() {}, onResults: (rows) => results.push(rows), getSort: () => sort });
        const initial = fire();
        input.value = "old"; input.listeners.input();
        input.value = "new"; input.listeners.input();
        check(timers.size === 1, "Search must debounce");
        requests[0].resolve({ data: ["stale"], nextCursor: { id: 99 } });
        await initial;
        check(results.length === 0, "Stale response changed the table");
        const search = fire();
        check(requests[1].term === "new" && requests[1].options.cursor === null, "Search must reset the cursor");
        requests[1].resolve({ data: ["match"], nextCursor: { id: 25 } });
        await search;
        const next = body.nav.children[1].children[1];
        next.listeners.click();
        const page = fire();
        check(requests[2].options.cursor.id === 25 && requests[2].term === "new", "Next must retain the query");
        requests[2].resolve({ data: ["page2"], nextCursor: null });
        await page;
        sort = { key: "id", direction: "desc" };
        dispose.reset();
        const sorted = fire();
        check(requests[3].options.cursor === null && requests[3].options.sort.direction === "desc", "Sorting must reset pagination");
        const nav = body.nav;
        modal.listeners["hide.bs.modal"]();
        requests[3].resolve({ data: ["closed"] });
        await sorted;
        check(results.length === 2 && nav.removed && !input.listeners.input, "Closing must discard responses and clean up");

        requests.length = 0;
        const ready = bindListSearch({ inputId: "input", tableBodyId: "body", columnCount: 3, filterIds: ["filter"],
            load: (term, isCurrent, options) => load(term, { ...options, isCurrent }) });
        requests[0].resolve({ nextCursor: { id: 25 } });
        await ready;
        body.nav.children[1].children[1].listeners.click();
        const listPage = fire();
        check(requests[1].options.cursor.id === 25, "List next must use its cursor");
        filter.listeners.change();
        check(!requests[1].options.isCurrent(), "Filter changes must invalidate previous requests immediately");
        requests[1].resolve({ nextCursor: { id: 50 } });
        await listPage;
        const filtered = fire();
        check(requests[2].options.cursor === null, "List filters must reset the page");
        requests[2].resolve({ nextCursor: null });
        await filtered;
        check(body.nav.children[1].children[1].disabled, "Final filtered page must disable next");
    } finally {
        Object.assign(globalThis, original);
    }
    return checks;
}

console.log(`Passed ${await runSearchTests()} pagination search lifecycle checks.`);
