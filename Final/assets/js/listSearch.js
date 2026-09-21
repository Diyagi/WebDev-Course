import { createPagination } from "./pagination.js";

export function bindListSearch({ inputId, tableBodyId, columnCount, load, filterIds = [] }) {
    const input = document.getElementById(inputId);
    const tableBody = document.getElementById(tableBodyId);
    let timer;
    let revision = 0;
    const pagination = createPagination(tableBody, () => schedule(0));

    const run = async (currentRevision) => {
        const isCurrent = () => currentRevision === revision && input.isConnected;
        if (!isCurrent()) return;
        tableBody.setAttribute("aria-busy", "true");
        tableBody.innerHTML = `<tr><td colspan="${columnCount}" class="text-center text-muted" role="status">Buscando...</td></tr>`;
        try {
            const result = await load(input.value.trim(), isCurrent, { cursor: pagination.cursor, isCurrent });
            if (isCurrent()) pagination.complete(result);
        } catch (error) {
            if (!isCurrent()) return;
            console.error(error);
            pagination.error();
            tableBody.innerHTML = `<tr><td colspan="${columnCount}" class="text-center text-danger" role="alert">Não foi possível realizar a busca. Tente novamente.</td></tr>`;
        } finally {
            if (isCurrent()) tableBody.removeAttribute("aria-busy");
        }
    };

    function schedule(delay = 300, reset = false) {
        clearTimeout(timer);
        if (reset) pagination.reset();
        pagination.loading();
        const currentRevision = ++revision;
        tableBody.setAttribute("aria-busy", "true");
        tableBody.innerHTML = `<tr><td colspan="${columnCount}" class="text-center text-muted" role="status">Buscando...</td></tr>`;
        timer = setTimeout(() => run(currentRevision), delay);
    }
    input.addEventListener("input", () => schedule(300, true));
    for (const id of filterIds) document.getElementById(id).addEventListener("change", () => schedule(0, true));

    pagination.loading();
    return run(++revision);
}
