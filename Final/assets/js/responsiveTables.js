export function initResponsiveTables() {
    const selector = ".table-responsive > table";

    function prepareTable(table) {
        const headerRow = table.tHead?.rows[0];
        if (!headerRow) return;
        const headers = Array.from(headerRow.cells);
        const labels = headers.map((cell) => cell.textContent.trim());

        table.classList.add("mobile-list-table");
        table.parentElement.classList.add("mobile-list-container");
        table.classList.toggle("mobile-list-sortable", Boolean(headerRow.querySelector("button")));
        // Keep table semantics when CSS changes its visual layout.
        table.setAttribute("role", "table");
        table.tHead.setAttribute("role", "rowgroup");
        headerRow.setAttribute("role", "row");
        headers.forEach((cell) => {
            cell.setAttribute("scope", "col");
            cell.setAttribute("role", "columnheader");
        });

        for (const body of table.tBodies) {
            body.setAttribute("role", "rowgroup");
            for (const row of body.rows) {
                if (!row.hasAttribute("role")) row.setAttribute("role", "row");
                Array.from(row.cells).forEach((cell, index) => {
                    cell.setAttribute("role", "cell");
                    // Loading, error and empty states span the entire record.
                    if (cell.colSpan > 1) delete cell.dataset.label;
                    else cell.dataset.label = labels[index] || "";
                });
            }
        }
    }

    document.querySelectorAll(selector).forEach(prepareTable);

    // Views, search results and modal tables are inserted dynamically.
    const observer = new MutationObserver((mutations) => {
        const tables = new Set();
        for (const mutation of mutations) {
            const parent = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
            const table = parent?.closest(selector);
            if (table) tables.add(table);
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (node.matches(selector)) tables.add(node);
                node.querySelectorAll(selector).forEach((addedTable) => tables.add(addedTable));
            }
        }
        tables.forEach((table) => {
            if (table.isConnected) prepareTable(table);
        });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
}
