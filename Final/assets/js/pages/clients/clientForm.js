import * as dbClient from "../../soupabase/client.js";
import * as formFeedback from "../../../../components/formFeedback.js";

let editMode = false;
let clientData;
let form;
let nameInput;
let typeSelect;
let documentInput;
let phoneInput;
let emailInput;
let addressInput;
let submitButton;

// Sets up page events and loads the initial data.
export async function init() {
  editMode = window.location.pathname.includes("clients/edit");
  form = document.querySelector("#clientForm");
  nameInput = document.querySelector("#clientName");
  typeSelect = document.querySelector("#clientType");
  documentInput = document.querySelector("#clientDocument");
  phoneInput = document.querySelector("#clientPhone");
  emailInput = document.querySelector("#clientEmail");
  addressInput = document.querySelector("#clientAddress");
  submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", onSubmit);
  nameInput.addEventListener("input", () => validateField(validateName));
  typeSelect.addEventListener("change", () => {
    formatDocumentInput();
    validateField(validateType);
  });
  documentInput.addEventListener("input", () => {
    formatDocumentInput();
    validateField(validateDocument);
  });
  phoneInput.addEventListener("input", () => {
    formatPhoneInput();
    validateField(validatePhone);
  });
  emailInput.addEventListener("input", () => validateField(validateEmail));

  if (editMode) {
    await loadClient();
    submitButton.innerHTML = '<i class="bi bi-check-lg"></i> Salvar Alterações';
  } else {
    submitButton.innerHTML = '<i class="bi bi-check-lg"></i> Criar Cliente';
  }

  validateForm();
}

// Loads the client details into the form.
async function loadClient() {
  const clientId = new URLSearchParams(window.location.search).get("clientId");
  if (!clientId) {
    formFeedback.showMessage("danger", "Cliente não encontrado.");
    return;
  }

  const { data, error } = await dbClient.getClient(clientId);
  if (error || !data) {
    console.error(error);
    formFeedback.showMessage("danger", "Não foi possível carregar o cliente.");
    return;
  }

  clientData = data;
  document.querySelector("#clientId").textContent = `ID do Cliente: ${data.id}`;
  nameInput.value = data.name ?? "";
  typeSelect.value = String(data.clienttype ?? "").toUpperCase();
  documentInput.value = data.cpf_cnpj ?? "";
  phoneInput.value = data.phone ?? "";
  emailInput.value = data.email ?? "";
  addressInput.value = data.delivery_address ?? "";
  formatDocumentInput();
  formatPhoneInput();
}

// Validates and saves the form data.
async function onSubmit(event) {
  event.preventDefault();
  formFeedback.clearAllValidations(form);
  document.querySelector("#formMessage").innerHTML = "";

  if (!validateForm(true)) return;

  const client = {
    name: nameInput.value.trim(),
    clienttype: typeSelect.value,
    cpf_cnpj: getDigits(documentInput),
    phone: getDigits(phoneInput) || null,
    email: emailInput.value.trim() || null,
    delivery_address: addressInput.value.trim() || null,
  };
  const buttonContent = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processando...';

  const { error } = editMode
    ? await dbClient.updateClient(clientData.id, client)
    : await dbClient.createClient(client);

  if (!error) {
    window.location.href = "/menu/clients";
    return;
  }

  console.error(error);
  formFeedback.showMessage(
    "danger",
    error.message || "Não foi possível salvar o cliente.",
  );
  submitButton.innerHTML = buttonContent;
  validateForm();
}

// Validates the fields and updates the save button availability.
function validateForm(showErrors = false) {
  const isValid = [
    validateName(showErrors),
    validateType(showErrors),
    validateDocument(showErrors),
    validatePhone(showErrors),
    validateEmail(showErrors),
  ].every(Boolean);

  submitButton.disabled = !isValid || (editMode && !clientData);
  return !submitButton.disabled;
}

// Runs field validation and updates the save button.
function validateField(validation) {
  validation(true);
  updateSubmitState();
}

// Updates the save button availability based on the fields.
function updateSubmitState() {
  const documentLength = getDigits(documentInput).length;
  const phoneLength = getDigits(phoneInput).length;
  const isValid =
    Boolean(nameInput.value.trim()) &&
    Boolean(typeSelect.value) &&
    documentLength === (typeSelect.value === "PJ" ? 14 : 11) &&
    (!phoneLength || phoneLength === 10 || phoneLength === 11) &&
    (!emailInput.value || emailInput.checkValidity());

  submitButton.disabled = !isValid || (editMode && !clientData);
}

// Validates the client name.
function validateName(showErrors) {
  formFeedback.clearValidation(nameInput);
  if (!nameInput.value.trim()) {
    if (showErrors)
      formFeedback.setInvalid(nameInput, "Informe o nome do cliente.");
    return false;
  }
  formFeedback.setValid(nameInput);
  return true;
}

// Validates the selected client type.
function validateType(showErrors) {
  formFeedback.clearValidation(typeSelect);
  if (!typeSelect.value) {
    if (showErrors)
      formFeedback.setInvalid(typeSelect, "Selecione o tipo de cliente.");
    return false;
  }
  formFeedback.setValid(typeSelect);
  return true;
}

// Validates the CPF or CNPJ digit count.
function validateDocument(showErrors) {
  formFeedback.clearValidation(documentInput);
  const expectedLength = typeSelect.value === "PJ" ? 14 : 11;
  if (getDigits(documentInput).length !== expectedLength) {
    if (showErrors)
      formFeedback.setInvalid(
        documentInput,
        `Informe um ${typeSelect.value === "PJ" ? "CNPJ" : "CPF"} válido.`,
      );
    return false;
  }
  formFeedback.setValid(documentInput);
  return true;
}

// Validates the phone number when provided.
function validatePhone(showErrors) {
  formFeedback.clearValidation(phoneInput);
  const length = getDigits(phoneInput).length;
  if (length && length !== 10 && length !== 11) {
    if (showErrors)
      formFeedback.setInvalid(phoneInput, "Informe um telefone válido.");
    return false;
  }
  if (length) formFeedback.setValid(phoneInput);
  return true;
}

// Validates the email when provided.
function validateEmail(showErrors) {
  formFeedback.clearValidation(emailInput);
  if (emailInput.value && !emailInput.checkValidity()) {
    if (showErrors)
      formFeedback.setInvalid(emailInput, "Informe um email válido.");
    return false;
  }
  if (emailInput.value) formFeedback.setValid(emailInput);
  return true;
}

// Applies the CPF or CNPJ mask to the entered document.
function formatDocumentInput() {
  const digits = getDigits(documentInput).slice(
    0,
    typeSelect.value === "PJ" ? 14 : 11,
  );
  documentInput.value =
    typeSelect.value === "PJ"
      ? digits.replace(
          /(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/,
          "$1.$2.$3/$4-$5",
        )
      : digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
}

// Applies the phone mask to the entered number.
function formatPhoneInput() {
  const digits = getDigits(phoneInput).slice(0, 11);
  phoneInput.value =
    digits.length <= 10
      ? digits.replace(/(\d{2})(\d{0,4})(\d{0,4})/, "($1) $2-$3")
      : digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

// Returns only the digits from the specified field.
function getDigits(input) {
  return input.value.replace(/\D/g, "");
}
