import {
  formatCurrency,
  formatDate,
  formatClientType,
  formatDocument,
  formatPhone,
} from "../assets/js/utils/format.js";
import { escapeHtml } from "../assets/js/utils/html.js";
// Builds the quote summary and product table.
export function buildQuoteContent(quote) {
  const content = document.createElement("div");
  const seller =
    quote.seller?.full_name || quote.seller?.username || quote.userid || "—";
  const client = quote.client?.name || quote.clientid || "—";
  const items = quote.items ?? [];

  content.innerHTML = `
        <div class="quote-detail-summary mb-4">
            <div class="quote-detail-line">
                <span class="quote-detail-section-label">Cliente</span>
                <div class="quote-detail-person">
                    <strong>${escapeHtml(client)}</strong>
                    <small>ID ${escapeHtml(String(quote.clientid))}</small>
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
                    <small>ID ${escapeHtml(String(quote.userid))}</small>
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
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted">Nenhum produto neste orçamento.</td></tr>';
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
      formatCurrency(item.total_value),
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

// Builds a labeled quote detail field.
function detailMeta(label, value, className = "") {
  return `<div class="quote-detail-meta-item ${className}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value ?? "—"))}</strong></div>`;
}
