import * as dbCategory from "../../soupabase/category.js";
import * as formFeedback from "../../../../components/formFeedback.js";

let editMode = false;
let categoryData;
let form;
let descriptionInput;
let submitButton;

// Sets up page events and loads the initial data.
export async function init() {
  editMode = window.location.pathname.includes("categories/edit");
  form = document.querySelector("#categoryForm");
  descriptionInput = document.querySelector("#categoryDesc");
  submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", onSubmit);
  descriptionInput.addEventListener("input", () =>
    validateField(checkDescription),
  );

  if (editMode) {
    await loadCategory();
    submitButton.innerHTML = '<i class="bi bi-check-lg"></i> Salvar Alterações';
  } else {
    submitButton.innerHTML = '<i class="bi bi-check-lg"></i> Criar Categoria';
  }

  validateForm();
}

// Loads the category details into the form.
async function loadCategory() {
  const categoryId = new URLSearchParams(window.location.search).get("catId");
  if (!categoryId) {
    formFeedback.showMessage("danger", "Categoria não encontrada.");
    return;
  }

  const { data, error } = await dbCategory.getCategory(categoryId);
  if (error || !data) {
    console.error(error);
    formFeedback.showMessage(
      "danger",
      "Não foi possível carregar a categoria.",
    );
    return;
  }

  categoryData = data;
  document.querySelector("#categoryId").textContent =
    `ID da Categoria: ${data.id}`;
  descriptionInput.value = data.description ?? "";
}

// Validates and saves the form data.
async function onSubmit(event) {
  event.preventDefault();
  formFeedback.clearAllValidations(form);
  document.querySelector("#formMessage").innerHTML = "";

  if (!validateForm(true)) return;

  const buttonContent = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processando...';

  const { error } = editMode
    ? await dbCategory.updateCategory(categoryData.id, {
        description: descriptionInput.value.trim(),
      })
    : await dbCategory.createCategory({
        description: descriptionInput.value.trim(),
      });

  if (!error) {
    window.location.href = "/menu/categories";
    return;
  }

  console.error(error);
  formFeedback.showMessage(
    "danger",
    error.message || "Não foi possível salvar a categoria.",
  );
  submitButton.innerHTML = buttonContent;
  validateForm();
}

// Validates the fields and updates the save button availability.
function validateForm(showErrors = false) {
  const isValid = checkDescription(showErrors);

  submitButton.disabled = !isValid || (editMode && !categoryData);
  return !submitButton.disabled;
}

// Runs field validation and updates the save button.
function validateField(validation) {
  validation(true);
  updateSubmitState();
}

// Updates the save button availability based on the fields.
function updateSubmitState() {
  const isValid = Boolean(descriptionInput.value.trim());
  submitButton.disabled = !isValid || (editMode && !categoryData);
}

// Validates the entered description.
function checkDescription(showErrors) {
  formFeedback.clearValidation(descriptionInput);
  const isValid = Boolean(descriptionInput.value.trim());

  if (!isValid) {
    if (showErrors)
      formFeedback.setInvalid(
        descriptionInput,
        "Informe a descrição da categoria.",
      );
    return false;
  }

  formFeedback.setValid(descriptionInput);
  return true;
}
