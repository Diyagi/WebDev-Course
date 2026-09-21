import { buildQuoteContent } from "./quoteContent.js";
import { finalizeQuote } from "../assets/js/soupabase/quote.js";

let componentPromise;
let detailRevision = 0;

// Displays the full quote and configures its actions.
export async function showQuoteDetail(quote, { onFinalized } = {}) {
  const modalElement = await ensureComponent();
  const currentRevision = ++detailRevision;
  const body = modalElement.querySelector("#quoteDetailModalBody");
  const editButton = modalElement.querySelector("#quoteDetailEditButton");
  const finalizeButton = modalElement.querySelector(
    "#quoteDetailFinalizeButton",
  );
  const feedback = modalElement.querySelector("#quoteDetailFeedback");
  const finalizeLabel = '<i class="bi bi-check-lg"></i> Finalizar orçamento';

  feedback.hidden = true;
  editButton.disabled = false;
  finalizeButton.disabled = false;
  finalizeButton.hidden = Boolean(quote.finalized_at);
  finalizeButton.innerHTML = finalizeLabel;

  modalElement.querySelector("#quoteDetailModalTitle").textContent =
    `Orçamento #${quote.id}`;
  body.replaceChildren(buildQuoteContent(quote));
  modalElement.querySelector("#quoteDetailPrintButton").href =
    `/views/quotes/quotePrint.html?quoteId=${encodeURIComponent(quote.id)}`;
  editButton.onclick = () => {
    bootstrap.Modal.getInstance(modalElement)?.hide();
    window.location.href = `/menu/quotes/edit?quoteId=${quote.id}`;
  };

  finalizeButton.onclick = async () => {
    if (finalizeButton.disabled || quote.finalized_at) return;
    finalizeButton.disabled = true;
    editButton.disabled = true;
    feedback.hidden = true;
    finalizeButton.innerHTML =
      '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Finalizando...';

    try {
      const { data, error } = await finalizeQuote(quote.id);
      if (error || !data?.finalized_at)
        throw error || new Error("Quote was not finalized.");

      quote.finalized_at = data.finalized_at;
      onFinalized?.(quote);
      if (currentRevision !== detailRevision) return;

      body.replaceChildren(buildQuoteContent(quote));
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
      feedback.textContent =
        "Não foi possível finalizar o orçamento. Tente novamente.";
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

// Loads the modal HTML if it is not already on the page.
async function ensureComponent() {
  const existing = document.querySelector("#quoteDetailModal");
  if (existing) return existing;

  if (!componentPromise) {
    componentPromise = fetch("/components/quoteDetailModal.html")
      .then((response) => {
        if (!response.ok)
          throw new Error("Não foi possível carregar o modal do orçamento.");
        return response.text();
      })
      .then((html) => {
        document.body.insertAdjacentHTML("beforeend", html);
        return document.querySelector("#quoteDetailModal");
      });
  }

  return componentPromise;
}
