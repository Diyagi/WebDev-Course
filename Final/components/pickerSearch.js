import { createPagination } from "../assets/js/pagination.js";

// Connects modal search to pagination and result loading.
export function bindPickerSearch({
  modal,
  input,
  body,
  columnCount,
  load,
  onPending,
  onResults,
  getSort,
}) {
  let timer;
  let revision = 0;
  let disposed = false;
  const pagination = createPagination(body, () => schedule(0));

  // Displays a status or error message in the picker table.
  function showMessage(message, error = false) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = columnCount;
    cell.className = `text-center ${error ? "text-danger" : "text-muted"}`;
    cell.setAttribute("role", error ? "alert" : "status");
    cell.textContent = message;

    row.appendChild(cell);
    body.replaceChildren(row);
  }

  // Schedules a search and invalidates earlier search responses.
  function schedule(delay = 300) {
    clearTimeout(timer);

    const currentRevision = ++revision;
    const term = input.value.trim();
    const cursor = pagination.cursor;
    const sort = getSort?.();

    pagination.loading();
    onPending();
    body.setAttribute("aria-busy", "true");
    showMessage("Buscando...");

    timer = setTimeout(async () => {
      const isCurrent = () =>
        !disposed && currentRevision === revision && modal.isConnected;
      try {
        const result = await load(term, { cursor, sort, isCurrent });
        const { data, error } = result;

        if (!isCurrent()) return;
        if (error) throw error;

        body.removeAttribute("aria-busy");
        pagination.complete(result);
        onResults(data ?? []);
      } catch (error) {
        if (!isCurrent()) return;

        console.error(error);
        pagination.error();
        showMessage(
          "Não foi possível realizar a busca. Tente novamente.",
          true,
        );
      } finally {
        if (isCurrent()) body.removeAttribute("aria-busy");
      }
    }, delay);
  }

  const onInput = () => {
    pagination.reset();
    schedule();
  };

  // Cancels pending searches and removes modal listeners and pagination.
  function dispose() {
    if (disposed) return;

    disposed = true;
    ++revision;
    clearTimeout(timer);

    input.removeEventListener("input", onInput);
    modal.removeEventListener("hide.bs.modal", dispose);
    body.removeAttribute("aria-busy");

    pagination.destroy();
  }

  input.addEventListener("input", onInput);
  modal.addEventListener("hide.bs.modal", dispose);
  schedule(0);

  dispose.reset = () => {
    pagination.reset();
    schedule(0);
  };

  return dispose;
}
