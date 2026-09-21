import * as dbQuote from "../../soupabase/quote.js";
import { showQuoteDetail } from "../../../../components/quoteDetailModal.js";
import { confirmModal, showConfirmationError } from "../../../../components/confirmationModal.js";
import { reloadCurrentView } from "../../router.js";
import { bindListSearch } from "../../listSearch.js";

let quotes = [];

export async function init() {
    document.querySelector("#quoteTableBody").addEventListener("click", onTableClick);
    document.querySelector("#quoteTableBody").addEventListener("keydown", onTableKeydown);
    quotes = [];
    await bindListSearch({ inputId: "quoteSearch", tableBodyId: "quoteTableBody", columnCount: 8, load: loadQuotes,
        filterIds: ["showExpiredQuotes", "showFinalizedQuotes"] });
}

async function loadQuotes(search, isCurrent, options) {
    const tableBody = document.querySelector("#quoteTableBody");
    quotes = [];
    const { data, error, nextCursor } = await dbQuote.getQuotes(search, {
        ...options,
        showExpired: document.querySelector("#showExpiredQuotes").checked,
        showFinalized: document.querySelector("#showFinalizedQuotes").checked
    });
    if (!isCurrent()) return;
    if (error) throw error;
    quotes = data ?? [];
    tableBody.removeAttribute("aria-busy");
    renderQuotes();
    return { nextCursor };
}

function renderQuotes() {
    const tableBody = document.querySelector("#quoteTableBody");
    if (tableBody.hasAttribute("aria-busy")) return;
    const visibleQuotes = quotes;

    tableBody.innerHTML = "";
    if (!visibleQuotes.length) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Nenhum orçamento encontrado para estes filtros.</td></tr>';
        return;
    }

    visibleQuotes.forEach((quote) => {
        const row = document.createElement("tr");
        const status = getStatus(quote);
        const reopenAction = isExpired(quote) && !quote.finalized_at
            ? `<li><button class="dropdown-item reopen-quote" type="button"><i class="bi bi-arrow-clockwise me-2"></i>Reabrir e recalcular</button></li>`
            : "";
        row.className = "quote-row";
        row.tabIndex = 0;
        row.dataset.id = quote.id;
        row.setAttribute("role", "button");
        row.setAttribute("aria-label", `Visualizar orçamento ${quote.id}`);
        row.innerHTML = `
            <td></td><td></td><td></td><td></td>
            <td><span class="badge ${status.className}"></span><small class="d-block mt-1 text-muted"></small></td>
            <td></td><td class="text-end fw-semibold"></td>
            <td class="text-end text-nowrap">
                <div class="dropdown quote-actions">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false" aria-label="Ações do orçamento ${quote.id}">
                        Ações
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><button class="dropdown-item view-quote" type="button"><i class="bi bi-eye me-2"></i>Visualizar</button></li>
                        <li><button class="dropdown-item edit-quote" type="button"><i class="bi bi-pencil me-2"></i>Editar</button></li>
                        ${reopenAction}
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item text-danger delete-quote" type="button"><i class="bi bi-trash me-2"></i>Excluir</button></li>
                    </ul>
                </div>
            </td>`;
        row.children[0].textContent = quote.id;
        row.children[1].textContent = quote.client?.name ?? `Cliente #${quote.clientid}`;
        row.children[2].textContent = quote.seller?.full_name || quote.seller?.username || shortId(quote.userid);
        row.children[3].textContent = formatDate(quote.created_at);
        row.querySelector(".badge").textContent = status.label;
        row.children[4].querySelector("small").textContent = `${quote.validity_days} dia${Number(quote.validity_days) === 1 ? "" : "s"}`;
        row.children[5].textContent = formatDate(quote.finalized_at);
        row.children[6].textContent = formatCurrency(quote.total_value);
        tableBody.appendChild(row);
    });
}

function onTableKeydown(event) {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches(".quote-row")) {
        event.preventDefault();
        openDetail(event.target.dataset.id);
    }
}

function onTableClick(event) {
    const row = event.target.closest(".quote-row");
    if (!row) return;
    const quote = quotes.find((item) => String(item.id) === row.dataset.id);
    if (event.target.closest(".view-quote")) {
        openDetail(row.dataset.id);
        return;
    }
    if (event.target.closest(".edit-quote")) {
        window.location.href = `/menu/quotes/edit?quoteId=${row.dataset.id}`;
        return;
    }
    if (event.target.closest(".reopen-quote")) {
        reopenQuote(quote);
        return;
    }
    if (event.target.closest(".delete-quote")) {
        deleteQuote(quote);
        return;
    }
    if (event.target.closest(".quote-actions")) return;
    openDetail(row.dataset.id);
}

function openDetail(id) {
    const quote = quotes.find((item) => String(item.id) === String(id));
    const tableBody = document.querySelector("#quoteTableBody");
    if (quote) showQuoteDetail(quote, {
        onFinalized: (updatedQuote) => {
            if (!tableBody.isConnected) return;
            const currentQuote = quotes.find((item) => String(item.id) === String(updatedQuote.id));
            if (currentQuote) currentQuote.finalized_at = updatedQuote.finalized_at;
            document.querySelector("#quoteSearch").dispatchEvent(new Event("input"));
        }
    }).catch(console.error);
}

function deleteQuote(quote) {
    confirmModal({
        title: "Deletar Orçamento",
        message: `Tem certeza que deseja deletar o orçamento <b>#${quote.id}</b> de <b>${escapeHtml(quote.client?.name ?? "cliente não identificado")}</b>?`,
        confirmText: "Deletar",
        loadingText: "Deletando",
        onConfirm: async () => {
            const { error } = await dbQuote.deleteQuote(quote.id);
            if (error) {
                console.error(error);
                showConfirmationError("Não foi possível excluir o orçamento. Tente novamente.");
                return false;
            }
            await reloadCurrentView();
        }
    });
}

function reopenQuote(quote) {
    confirmModal({
        title: "Reabrir Orçamento",
        message: `Os preços dos produtos do orçamento <b>#${quote.id}</b> serão atualizados para os valores atuais e a data de criação será redefinida. Deseja continuar?`,
        confirmText: "Reabrir",
        confirmClass: "btn-primary",
        loadingText: "Reabrindo",
        onConfirm: async () => {
            const { error } = await dbQuote.reopenExpiredQuote(quote.id);
            if (error) {
                console.error(error);
                showConfirmationError(error.code === "PRODUCT_NOT_FOUND"
                    ? "Um ou mais produtos deste orçamento não estão mais disponíveis."
                    : "Não foi possível reabrir o orçamento. Tente novamente.");
                return false;
            }
            await reloadCurrentView();
        }
    });
}

function getStatus(quote) {
    if (quote.finalized_at) return { label: "Finalizado", className: "text-bg-success" };
    if (isExpired(quote)) return { label: "Vencido", className: "text-bg-danger" };
    return { label: "Em aberto", className: "text-bg-primary" };
}

function isExpired(quote) {
    if (!quote.created_at) return false;
    const expiration = new Date(quote.created_at);
    expiration.setDate(expiration.getDate() + Number(quote.validity_days || 0));
    return expiration < new Date();
}

function shortId(value) {
    const text = String(value ?? "");
    return text ? `${text.slice(0, 8)}…` : "—";
}

function formatCurrency(value) {
    const number = Number(value);
    return Number.isFinite(number) ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(number) : "—";
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = value;
    return element.innerHTML;
}
