import * as dbClient from "../../soupabase/client.js";
import * as dbProduct from "../../soupabase/product.js";
import * as dbQuote from "../../soupabase/quote.js";
import * as dbUser from "../../soupabase/user.js";
import * as formFeedback from "../../../../components/formFeedback.js";
import { openProductPicker } from "../../../../components/productPickerModal.js";
import { openRecordPicker } from "../../../../components/recordPickerModal.js";

let editMode = false;
let quoteData;
let sellers = [];
let items = [];
let loggedUser;
let form;
let clientSelect;
let sellerSelect;
let clientPicker;
let sellerPicker;
let validityInput;
let finalizedCheckbox;
let itemsBody;
let submitButton;

export async function init() {
    editMode = window.location.pathname.includes("quotes/edit");
    quoteData = undefined;
    sellers = [];
    items = [];
    loggedUser = undefined;
    form = document.querySelector("#quoteForm");
    clientSelect = document.querySelector("#quoteClient");
    sellerSelect = document.querySelector("#quoteSeller");
    clientPicker = document.querySelector("#quoteClientPicker");
    sellerPicker = document.querySelector("#quoteSellerPicker");
    validityInput = document.querySelector("#quoteValidity");
    finalizedCheckbox = document.querySelector("#quoteFinalized");
    itemsBody = document.querySelector("#quoteItemsBody");
    submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", onSubmit);
    form.addEventListener("input", onFormInput);
    form.addEventListener("change", () => validateForm());
    finalizedCheckbox.addEventListener("change", updateFinalizedHelp);
    clientPicker.addEventListener("click", showClientPicker);
    sellerPicker.addEventListener("click", showSellerPicker);
    itemsBody.addEventListener("click", onItemsClick);
    document.querySelector("#addQuoteProduct").addEventListener("click", showProductPicker);

    await loadSellers();
    if (editMode) await loadQuote();
    else renderItems();
    updateFinalizedHelp();

    submitButton.innerHTML = editMode
        ? '<i class="bi bi-check-lg"></i> Salvar Alterações'
        : '<i class="bi bi-check-lg"></i> Criar Orçamento';
    validateForm();
}

async function loadSellers() {
    const [{ data, error }, loggedUserResult] = await Promise.all([
        dbUser.getUsers(),
        dbUser.getLoggedUser()
    ]);
    const users = data?.users ?? [];
    sellers = users.map(normalizeSeller);

    loggedUser = loggedUserResult.user;
    if (loggedUser) {
        const currentSeller = normalizeSeller(loggedUser);
        if (!sellers.some((seller) => String(seller.id) === String(currentSeller.id))) sellers.push(currentSeller);
        setSeller(currentSeller);
        if (editMode && !canEditSeller()) sellerPicker.disabled = true;
    }

    if ((editMode || !users.length) && !loggedUser) {
        console.error(error || loggedUserResult.error);
        document.querySelector("#quoteSellerLabel").textContent = editMode ? "Não foi possível identificar o usuário conectado" : "Não foi possível carregar os vendedores";
        sellerPicker.disabled = true;
    }
}

async function loadQuote() {
    const quoteId = new URLSearchParams(window.location.search).get("quoteId");
    if (!quoteId) return disableForm("Orçamento não encontrado.");

    const { data, error } = await dbQuote.getQuote(quoteId);
    if (error || !data) {
        console.error(error);
        return disableForm("Não foi possível carregar o orçamento.");
    }

    quoteData = data;
    document.querySelector("#quoteId").textContent = `ID do Orçamento: ${data.id}`;
    const selectedClient = { ...data.client, id: data.clientid, name: data.client?.name || `Cliente #${data.clientid}` };
    setClient(selectedClient);

    const selectedSeller = sellers.find((seller) => String(seller.id) === String(data.userid))
        || normalizeSeller({ id: data.userid, profile: data.seller });
    if (!sellers.some((seller) => String(seller.id) === String(selectedSeller.id))) sellers.push(selectedSeller);
    setSeller(selectedSeller);
    sellerPicker.disabled = !canEditSeller();
    updateSellerHelp();
    validityInput.value = data.validity_days;
    finalizedCheckbox.checked = Boolean(data.finalized_at);
    updateFinalizedHelp();
    items = (data.items ?? []).map((item) => ({
        id: item.id,
        productid: item.productid,
        productName: item.product?.description ?? `Produto #${item.productid}`,
        description: item.description ?? "",
        amount: Number(item.amount),
        product_value: Number(item.product_value)
    }));
    renderItems();
    if (!loggedUser) disableForm("Não foi possível identificar o usuário conectado para editar este orçamento.");
}

function showClientPicker() {
    openRecordPicker({
        title: "Selecionar cliente",
        kicker: "Clientes",
        searchPlaceholder: "Busque por ID, nome, CPF/CNPJ, telefone ou email",
        loadRecords: (search, options) => dbClient.getClients(search, options),
        initialSort: { key: "name", direction: "asc" },
        noResultsMessage: "Nenhum cliente encontrado.",
        tableColumns: [
            { key: "id", label: "ID", numeric: true },
            { key: "name", label: "Nome" },
            { key: "cpf_cnpj", label: "CPF/CNPJ", value: (client) => formatDocument(client.cpf_cnpj) },
            { key: "phone", label: "Telefone", value: (client) => formatPhone(client.phone) },
            { key: "email", label: "Email", value: (client) => client.email || "—" }
        ],
        onSelect: (client) => {
            setClient(client);
            validateForm();
        }
    }).catch(showPickerError);
}

function showSellerPicker() {
    openRecordPicker({
        title: "Selecionar vendedor",
        kicker: "Usuários",
        searchPlaceholder: "Busque por nome, usuário, email ou função",
        availableRecords: sellers,
        initialSort: { key: "name", direction: "asc" },
        noResultsMessage: "Nenhum vendedor encontrado.",
        tableColumns: [
            { key: "name", label: "Nome" },
            { key: "username", label: "Usuário" },
            { key: "email", label: "Email" },
            { key: "role", label: "Função", value: (seller) => formatRole(seller.role) }
        ],
        onSelect: (seller) => {
            setSeller(seller);
            validateForm();
        }
    }).catch(showPickerError);
}

function showPickerError(error) {
    console.error(error);
    formFeedback.showMessage("danger", "Não foi possível abrir o seletor.");
}

function showProductPicker() {
    const selectedIds = new Set(items.map((item) => String(item.productid)));
    openProductPicker({
        loadProducts: (search, options) => dbProduct.getProducts(search, {
            ...options, activeOnly: true, excludeIds: [...selectedIds]
        }),
        onSelect: addProduct
    }).catch((error) => {
        console.error(error);
        formFeedback.showMessage("danger", "Não foi possível abrir o seletor de produtos.");
    });
}

function addProduct(product) {
    items.push({
        productid: product.id,
        productName: product.description,
        description: product.description ?? "",
        amount: 1,
        product_value: Number(product.price) || 0
    });
    renderItems();
    validateForm();
}

function renderItems() {
    itemsBody.innerHTML = "";
    if (!items.length) {
        itemsBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhum produto adicionado.</td></tr>';
        updateTotal();
        return;
    }

    items.forEach((item, index) => {
        const row = document.createElement("tr");
        row.dataset.index = index;
        row.innerHTML = `
            <td class="quote-item-name"></td>
            <td><input type="text" class="form-control form-control-sm item-description" aria-label="Descrição do item"></td>
            <td><input type="number" min="1" step="1" class="form-control form-control-sm item-amount" aria-label="Quantidade"></td>
            <td><input type="number" min="0" step="0.01" class="form-control form-control-sm item-value" aria-label="Valor unitário"></td>
            <td class="text-end fw-semibold item-total"></td>
            <td class="text-end"><button type="button" class="btn btn-sm btn-outline-danger remove-item" title="Remover" aria-label="Remover produto"><i class="bi bi-x-lg"></i></button></td>`;
        row.querySelector(".quote-item-name").textContent = item.productName;
        row.querySelector(".item-description").value = item.description;
        row.querySelector(".item-amount").value = item.amount;
        row.querySelector(".item-value").value = Number(item.product_value).toFixed(2);
        row.querySelector(".item-total").textContent = formatCurrency(item.amount * item.product_value);
        itemsBody.appendChild(row);
    });
    updateTotal();
}

function onFormInput(event) {
    const row = event.target.closest("tr[data-index]");
    if (row) {
        const item = items[Number(row.dataset.index)];
        if (event.target.matches(".item-description")) item.description = event.target.value;
        if (event.target.matches(".item-amount")) item.amount = event.target.value === "" ? null : Number(event.target.value);
        if (event.target.matches(".item-value")) item.product_value = event.target.value === "" ? null : Number(event.target.value);
        row.querySelector(".item-total").textContent = formatCurrency(item.amount * item.product_value);
        updateTotal();
    }
    validateForm();
}

function onItemsClick(event) {
    const button = event.target.closest(".remove-item");
    if (!button) return;
    items.splice(Number(button.closest("tr").dataset.index), 1);
    renderItems();
    validateForm();
}

async function onSubmit(event) {
    event.preventDefault();
    document.querySelector("#formMessage").innerHTML = "";
    if (!validateForm(true)) return;

    const quote = {
        clientid: Number(clientSelect.value),
        userid: sellerSelect.value,
        validity_days: Number(validityInput.value),
        finalized_at: finalizedCheckbox.checked
            ? (quoteData?.finalized_at || new Date().toISOString())
            : null,
        total_value: getTotal()
    };
    const quoteItems = items.map((item) => ({
        ...(item.id ? { id: item.id } : {}),
        productid: Number(item.productid),
        description: item.description.trim() || null,
        amount: Number(item.amount),
        product_value: Number(item.product_value),
        total_value: roundMoney(item.amount * item.product_value)
    }));
    const oldButtonContent = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Processando...';
    const { error } = editMode
        ? await dbQuote.updateQuote(quoteData.id, quote, quoteItems)
        : await dbQuote.createQuote(quote, quoteItems);

    if (!error) {
        window.location.href = "/menu/quotes";
        return;
    }
    console.error(error);
    formFeedback.showMessage("danger", error.message || "Não foi possível salvar o orçamento.");
    submitButton.innerHTML = oldButtonContent;
    validateForm();
}

function validateForm(showErrors = false) {
    if (!submitButton) return false;
    [clientPicker, sellerPicker, validityInput].forEach((field) => formFeedback.clearValidation(field));
    const clientValid = Boolean(clientSelect.value) && !clientPicker.disabled;
    const sellerValid = Boolean(sellerSelect.value) && (!sellerPicker.disabled || (editMode && Boolean(loggedUser)));
    const validityValid = Number.isInteger(Number(validityInput.value)) && Number(validityInput.value) > 0;
    const itemsValid = items.length > 0 && items.every((item) => item.amount !== null
        && Number.isInteger(Number(item.amount))
        && item.amount > 0
        && item.product_value !== null
        && Number.isFinite(Number(item.product_value))
        && item.product_value >= 0);

    if (showErrors && !clientValid) formFeedback.setInvalid(clientPicker, "Selecione um cliente.");
    if (showErrors && !sellerValid) formFeedback.setInvalid(sellerPicker, "Selecione um vendedor.");
    if (showErrors && !validityValid) formFeedback.setInvalid(validityInput, "Informe uma validade maior que zero.");
    document.querySelector("#quoteItemsError").textContent = showErrors && !itemsValid ? "Adicione ao menos um produto e informe quantidade e valor válidos." : "";

    const valid = clientValid && sellerValid && validityValid && itemsValid && (!editMode || quoteData);
    submitButton.disabled = !valid;
    return valid;
}

function updateTotal() {
    document.querySelector("#quoteTotal").textContent = formatCurrency(getTotal());
}

function getTotal() {
    return roundMoney(items.reduce((total, item) => total + (Number(item.amount) || 0) * (Number(item.product_value) || 0), 0));
}

function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function setClient(client) {
    clientSelect.value = client.id;
    const label = document.querySelector("#quoteClientLabel");
    label.textContent = `${client.name || `Cliente #${client.id}`} · ${formatDocument(client.cpf_cnpj)}`;
    label.classList.remove("text-muted");
}

function setSeller(seller) {
    sellerSelect.value = seller.id;
    const label = document.querySelector("#quoteSellerLabel");
    label.textContent = seller.name;
    label.classList.remove("text-muted");
}

function normalizeSeller(user) {
    const profile = user.profile ?? {};
    const username = profile.username || user.username || "";
    const name = profile.full_name || user.fullname || username || user.email || `Usuário ${String(user.id).slice(0, 8)}`;
    return {
        id: user.id,
        name,
        username,
        email: user.email || "",
        role: profile.user_role || user.role || ""
    };
}

function disableForm(message) {
    formFeedback.showMessage("danger", message);
    [...form.elements].forEach((element) => { element.disabled = true; });
}

function updateFinalizedHelp() {
    const help = document.querySelector("#quoteFinalizedHelp");
    if (quoteData?.finalized_at && finalizedCheckbox.checked) {
        const date = new Date(quoteData.finalized_at);
        help.textContent = `Finalizado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date)}.`;
        return;
    }
    help.textContent = finalizedCheckbox.checked
        ? "A data atual será registrada como data de finalização ao salvar."
        : "Marque esta opção para finalizar o orçamento ao salvar.";
}

function canEditSeller() {
    return editMode && ["owner", "admin"].includes(loggedUser?.role);
}

function updateSellerHelp() {
    const help = document.querySelector("#quoteSellerHelp");
    if (!editMode) {
        help.textContent = "";
        return;
    }
    help.textContent = canEditSeller()
        ? "Como administrador, você pode alterar o vendedor deste orçamento."
        : "O vendedor atual não pode ser alterado com o seu nível de acesso.";
}

function formatRole(role) {
    switch (role) {
        case "owner": return "Dono";
        case "admin": return "Administrador";
        case "user": return "Usuário";
        default: return "—";
    }
}

function formatDocument(value) {
    const digits = String(value ?? "").replace(/\D/g, "");
    if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return value || "Sem documento";
}

function formatPhone(value) {
    const digits = String(value ?? "").replace(/\D/g, "");
    if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    return value || "—";
}

function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
}
