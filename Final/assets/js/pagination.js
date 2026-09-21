export function createPagination(body, onChange) {
    const nav = document.createElement("nav");
    nav.className = "d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3";
    nav.setAttribute("aria-label", "Paginação");
    const label = document.createElement("span");
    label.className = "small text-muted";
    label.setAttribute("aria-live", "polite");
    const buttons = document.createElement("div");
    buttons.className = "d-flex gap-2";
    const previous = document.createElement("button");
    const next = document.createElement("button");
    const retry = document.createElement("button");
    for (const button of [previous, next, retry]) {
        button.type = "button";
        button.className = "btn btn-sm btn-outline-secondary";
        buttons.appendChild(button);
    }
    previous.textContent = "Anterior";
    next.textContent = "Próxima";
    retry.textContent = "Tentar novamente";
    nav.append(label, buttons);
    (body.closest(".table-responsive") || body.closest("table")).after(nav);
    let cursors = [null];
    let index = 0;
    let nextCursor = null;
    let busy = false;
    let failed = false;
    function render() {
        label.textContent = `Página ${index + 1} · 25 por página`;
        previous.disabled = busy || index === 0;
        next.disabled = busy || failed || !nextCursor;
        retry.hidden = !failed;
        retry.disabled = busy;
    }
    previous.addEventListener("click", () => {
        if (previous.disabled) return;
        index--;
        onChange();
    });
    next.addEventListener("click", () => {
        if (next.disabled) return;
        cursors = cursors.slice(0, index + 1);
        cursors.push(nextCursor);
        index++;
        onChange();
    });
    retry.addEventListener("click", () => onChange());
    render();
    return {
        get cursor() { return cursors[index]; },
        reset() { cursors = [null]; index = 0; nextCursor = null; failed = false; render(); },
        loading() { busy = true; failed = false; render(); },
        complete(result) { busy = false; failed = false; nextCursor = result?.nextCursor ?? null; render(); },
        error() { busy = false; failed = true; render(); },
        destroy() { nav.remove(); }
    };
}
