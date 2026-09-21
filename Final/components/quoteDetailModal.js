import { finalizeQuote } from "../assets/js/soupabase/quote.js";

let componentPromise;
let detailRevision = 0;

export async function showQuoteDetail(quote, { onFinalized } = {}) {
    const modalElement = await ensureComponent();
    const currentRevision = ++detailRevision;
    const body = modalElement.querySelector("#quoteDetailModalBody");
    const editButton = modalElement.querySelector("#quoteDetailEditButton");
    const finalizeButton = modalElement.querySelector("#quoteDetailFinalizeButton");
    const feedback = modalElement.querySelector("#quoteDetailFeedback");
    const finalizeLabel = '<i class="bi bi-check-lg"></i> Finalizar orçamento';

    feedback.hidden = true;
    editButton.disabled = false;
    finalizeButton.disabled = false;
    finalizeButton.hidden = Boolean(quote.finalized_at);
    finalizeButton.innerHTML = finalizeLabel;

    modalElement.querySelector("#quoteDetailModalTitle").textContent = `Orçamento #${quote.id}`;
    body.replaceChildren(buildContent(quote));
    editButton.onclick = () => {
        bootstrap.Modal.getInstance(modalElement)?.hide();
        window.location.href = `/menu/quotes/edit?quoteId=${quote.id}`;
    };

    finalizeButton.onclick = async () => {
        if (finalizeButton.disabled || quote.finalized_at) return;
        finalizeButton.disabled = true;
        editButton.disabled = true;
        feedback.hidden = true;
        finalizeButton.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Finalizando...';

        try {
            const { data, error } = await finalizeQuote(quote.id);
            if (error || !data?.finalized_at) throw error || new Error("Quote was not finalized.");

            quote.finalized_at = data.finalized_at;
            onFinalized?.(quote);
            if (currentRevision !== detailRevision) return;

            body.replaceChildren(buildContent(quote));
            finalizeButton.hidden = true;
            feedback.className = "alert alert-success w-100 mb-2";
            feedback.setAttribute("role", "status");
            feedback.textContent = "Orçamento finalizado com sucesso.";
            feedback.hidden = false;
        } catch (error) {
            console.error(error);
            if (currentRevision !== detailRevision) return;
            feedback.className = "alert alert-danger w-100 mb-2";
            feedback.setAttribute("role", "alert");
            feedback.textContent = "Não foi possível finalizar o orçamento. Tente novamente.";
            feedback.hidden = false;
        } finally {
            if (currentRevision === detailRevision) {
                finalizeButton.disabled = false;
                editButton.disabled = false;
                finalizeButton.innerHTML = finalizeLabel;
            }
        }
    };

    bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

async function ensureComponent() {
    const existing = document.querySelector("#quoteDetailModal");
    if (existing) return existing;

    if (!componentPromise) {
        componentPromise = fetch("/components/quoteDetailModal.html")
            .then((response) => {
                if (!response.ok) throw new Error("Não foi possível carregar o modal do orçamento.");
                return response.text();
            })
            .then((html) => {
                document.body.insertAdjacentHTML("beforeend", html);
                return document.querySelector("#quoteDetailModal");
            });
    }

    return componentPromise;
}

function buildContent(quote) {
    const content = document.createElement("div");
    const seller = quote.seller?.full_name || quote.seller?.username || quote.userid || "—";
    const client = quote.client?.name || quote.clientid || "—";
    const items = quote.items ?? [];

    content.innerHTML = `
        <div class="quote-detail-summary mb-4">
            <div class="quote-detail-line">
                <span class="quote-detail-section-label">Cliente</span>
                <div class="quote-detail-person">
                    <strong>${escapeHtml(client)}</strong>
                    <small>ID ${escapeHtml(quote.clientid)}</small>
                </div>
                <div class="quote-client-meta">
                    <span><i class="bi bi-person-vcard" aria-hidden="true"></i> ${escapeHtml(formatClientType(quote.client?.clienttype))}</span>
                    <span><i class="bi bi-card-text" aria-hidden="true"></i> ${escapeHtml(formatDocument(quote.client?.cpf_cnpj))}</span>
                    <span><i class="bi bi-telephone" aria-hidden="true"></i> ${escapeHtml(formatPhone(quote.client?.phone))}</span>
                    <span><i class="bi bi-envelope" aria-hidden="true"></i> ${escapeHtml(quote.client?.email || "—")}</span>
                </div>
            </div>
            <div class="quote-detail-line">
                <span class="quote-detail-section-label">Vendedor</span>
                <div class="quote-detail-person">
                    <strong>${escapeHtml(seller)}</strong>
                    <small>ID ${escapeHtml(quote.userid)}</small>
                </div>
            </div>
            <div class="quote-detail-line">
                <span class="quote-detail-section-label">Informações do orçamento</span>
                <div class="quote-detail-meta">
                    ${detailMeta("Criado em", formatDate(quote.created_at))}
                    ${detailMeta("Validade", `${quote.validity_days} dia${Number(quote.validity_days) === 1 ? "" : "s"}`)}
                    ${detailMeta("Finalizado em", formatDate(quote.finalized_at))}
                    ${detailMeta("Valor total", formatCurrency(quote.total_value), "quote-detail-total")}
                </div>
            </div>
        </div>
        <h3 class="h6 mb-3">Produtos do orçamento</h3>
        <div class="table-responsive view-card">
            <table class="table table-striped align-middle">
                <thead><tr><th>Produto ID</th><th>Produto</th><th>Descrição</th><th class="text-end">Qtd.</th><th class="text-end">Valor unit.</th><th class="text-end">Total</th></tr></thead>
                <tbody id="quoteDetailItems"></tbody>
            </table>
        </div>
    `;

    const tbody = content.querySelector("#quoteDetailItems");
    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum produto neste orçamento.</td></tr>';
        return content;
    }

    items.forEach((item) => {
        const row = document.createElement("tr");
        const values = [
            item.productid,
            item.product?.description ?? "Produto indisponível",
            item.description ?? "—",
            item.amount,
            formatCurrency(item.product_value),
            formatCurrency(item.total_value)
        ];
        values.forEach((value, index) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            if (index >= 3) cell.classList.add("text-end");
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });

    return content;
}

function detailMeta(label, value, className = "") {
    return `<div class="quote-detail-meta-item ${className}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value ?? "—")}</strong></div>`;
}

function formatCurrency(value) {
    const number = Number(value);
    return Number.isFinite(number)
        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(number)
        : "—";
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "—"
        : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function formatClientType(value) {
    if (!value) return "—";
    return String(value).toUpperCase() === "PJ" ? "Pessoa Jurídica" : "Pessoa Física";
}

function formatDocument(value) {
    const digits = String(value ?? "").replace(/\D/g, "");
    if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return value || "—";
}

function formatPhone(value) {
    const digits = String(value ?? "").replace(/\D/g, "");
    if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    return value || "—";
}

function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = String(value);
    return element.innerHTML;
}
