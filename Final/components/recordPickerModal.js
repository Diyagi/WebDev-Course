import { bindPickerSearch } from "./pickerSearch.js";

let componentPromise;
let loadRemoteRecords;
let disposeSearch;
let records = [];
let filteredRecords = [];
let columns = [];
let onSelectRecord;
let emptyMessage = "Nenhum registro encontrado.";
let sort = { key: "", direction: "asc" };

export async function openRecordPicker({ title, kicker = "Seleção", searchPlaceholder = "Buscar", availableRecords = [], loadRecords, tableColumns = [], initialSort, noResultsMessage, onSelect }) {
    const modalElement = await ensureComponent();
    disposeSearch?.();
    loadRemoteRecords = loadRecords;
    records = availableRecords;
    columns = tableColumns;
    onSelectRecord = onSelect;
    emptyMessage = noResultsMessage || "Nenhum registro encontrado.";
    sort = initialSort || { key: columns[0]?.key || "", direction: "asc" };

    modalElement.querySelector("#recordPickerModalTitle").textContent = title;
    modalElement.querySelector("#recordPickerModalKicker").textContent = kicker;
    const search = modalElement.querySelector("#recordPickerSearch");
    search.placeholder = searchPlaceholder;
    search.value = "";
    renderHeader(modalElement);
    renderRecords(modalElement);

    if (loadRemoteRecords) {
        disposeSearch = bindPickerSearch({
            modal: modalElement,
            input: search,
            body: modalElement.querySelector("#recordPickerTableBody"),
            columnCount: columns.length + 1,
            load: loadRemoteRecords,
            getSort: () => sort,
            onPending: () => { records = []; filteredRecords = []; },
            onResults: (data) => { records = data; renderRecords(modalElement); }
        });
    }

    bootstrap.Modal.getOrCreateInstance(modalElement).show();
    modalElement.addEventListener("shown.bs.modal", () => search.focus(), { once: true });
}

async function ensureComponent() {
    const existing = document.querySelector("#recordPickerModal");
    if (existing) return existing;

    if (!componentPromise) {
        componentPromise = fetch("/components/recordPickerModal.html")
            .then((response) => {
                if (!response.ok) throw new Error("Não foi possível carregar o seletor.");
                return response.text();
            })
            .then((html) => {
                document.body.insertAdjacentHTML("beforeend", html);
                const modal = document.querySelector("#recordPickerModal");
                modal.querySelector("#recordPickerSearch").addEventListener("input", () => {
                    if (!loadRemoteRecords) renderRecords(modal);
                });
                modal.querySelector("#recordPickerSearch").addEventListener("keydown", onSearchKeydown);
                modal.querySelector("#recordPickerTableHead").addEventListener("click", onSortClick);
                modal.querySelector("#recordPickerTableBody").addEventListener("click", onRecordClick);
                return modal;
            });
    }
    return componentPromise;
}

function renderHeader(modalElement) {
    const header = modalElement.querySelector("#recordPickerTableHead");
    header.innerHTML = "";
    columns.forEach((column) => {
        const cell = document.createElement("th");
        if (column.align === "end") cell.classList.add("text-end");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sort-button";
        button.dataset.sort = column.key;
        button.textContent = `${column.label} `;
        button.insertAdjacentHTML("beforeend", '<i class="bi bi-arrow-down-up"></i>');
        cell.appendChild(button);
        header.appendChild(cell);
    });
    const actionCell = document.createElement("th");
    actionCell.className = "text-end";
    actionCell.textContent = "Ação";
    header.appendChild(actionCell);
}

function renderRecords(modalElement) {
    if (modalElement.querySelector("#recordPickerTableBody").hasAttribute("aria-busy")) return;
    const query = normalize(modalElement.querySelector("#recordPickerSearch").value);
    filteredRecords = loadRemoteRecords ? [...records] : records
        .filter((record) => normalize(columns.map((column) => getColumnValue(column, record)).join(" ")).includes(query))
        .sort(compareRecords);

    modalElement.querySelectorAll(".sort-button").forEach((button) => {
        const active = button.dataset.sort === sort.key;
        button.classList.toggle("active", active);
        button.querySelector("i").className = `bi ${active ? (sort.direction === "asc" ? "bi-sort-up" : "bi-sort-down") : "bi-arrow-down-up"}`;
    });

    const body = modalElement.querySelector("#recordPickerTableBody");
    body.innerHTML = "";
    if (!filteredRecords.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = columns.length + 1;
        cell.className = "text-center text-muted";
        cell.textContent = emptyMessage;
        row.appendChild(cell);
        body.appendChild(row);
        return;
    }

    filteredRecords.forEach((record, index) => {
        const row = document.createElement("tr");
        if (index === 0) row.classList.add("product-picker-first");
        columns.forEach((column) => {
            const cell = document.createElement("td");
            if (column.align === "end") cell.classList.add("text-end");
            cell.textContent = getColumnValue(column, record) || "—";
            row.appendChild(cell);
        });
        const actionCell = document.createElement("td");
        actionCell.className = "text-end";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-sm btn-primary select-record";
        button.dataset.id = record.id;
        button.textContent = "Selecionar";
        actionCell.appendChild(button);
        row.appendChild(actionCell);
        body.appendChild(row);
    });
}

function onSearchKeydown(event) {
    if (event.key !== "Enter" || !filteredRecords.length) return;
    event.preventDefault();
    selectRecord(filteredRecords[0]);
}

function onSortClick(event) {
    const button = event.target.closest(".sort-button");
    if (!button) return;
    sort = sort.key === button.dataset.sort
        ? { key: sort.key, direction: sort.direction === "asc" ? "desc" : "asc" }
        : { key: button.dataset.sort, direction: "asc" };
    if (loadRemoteRecords) disposeSearch.reset();
    else renderRecords(document.querySelector("#recordPickerModal"));
}

function onRecordClick(event) {
    const button = event.target.closest(".select-record");
    if (!button) return;
    selectRecord(records.find((record) => String(record.id) === button.dataset.id));
}

function selectRecord(record) {
    if (!record) return;
    onSelectRecord?.(record);
    bootstrap.Modal.getInstance(document.querySelector("#recordPickerModal"))?.hide();
}

function compareRecords(left, right) {
    const column = columns.find((item) => item.key === sort.key);
    if (!column) return 0;
    const leftValue = column.sortValue?.(left) ?? getColumnValue(column, left);
    const rightValue = column.sortValue?.(right) ?? getColumnValue(column, right);
    const direction = sort.direction === "asc" ? 1 : -1;
    if (column.numeric) return (Number(leftValue) - Number(rightValue)) * direction;
    return String(leftValue ?? "").localeCompare(String(rightValue ?? ""), "pt-BR", { sensitivity: "base" }) * direction;
}

function getColumnValue(column, record) {
    return column.value ? column.value(record) : record[column.key];
}

function normalize(value) {
    return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
