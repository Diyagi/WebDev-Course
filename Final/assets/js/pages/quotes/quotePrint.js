import "../../authGuard.js";
import { getQuote } from "../../soupabase/quote.js";
import { buildQuoteContent } from "../../../../components/quoteContent.js";

const button = document.querySelector("#printQuote");
const feedback = document.querySelector("#printFeedback");
button.addEventListener("click", () => window.print());

// Loads the quote and prepares the page for printing.
async function loadQuote() {
  const id = new URLSearchParams(window.location.search).get("quoteId");
  if (!id || !/^\d+$/.test(id)) {
    feedback.setAttribute("role", "alert");
    feedback.textContent =
      "Orçamento inválido. Volte à lista e selecione um orçamento.";
    return;
  }

  try {
    const { data, error } = await getQuote(id);
    if (error || !data) throw error || new Error("Quote not found");
    document.querySelector("#quoteTitle").textContent = `Orçamento #${data.id}`;
    document.title = `Orçamento ${data.id} — SaberTI`;
    document
      .querySelector("#printContent")
      .replaceChildren(buildQuoteContent(data));
    feedback.hidden = true;
    button.disabled = false;
  } catch (error) {
    console.error(error);
    feedback.setAttribute("role", "alert");
    feedback.textContent =
      "Não foi possível carregar o orçamento. Atualize a página para tentar novamente ou volte à lista.";
  }
}

loadQuote();
