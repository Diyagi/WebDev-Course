import { escapeHtml } from "../../utils/html.js";
import * as dbCategory from "../../soupabase/category.js";
import {
  confirmModal,
  showConfirmationError,
} from "../../../../components/confirmationModal.js";
import { reloadCurrentView } from "../../router.js";
import { bindListSearch } from "../../listSearch.js";

// Sets up page events and loads the initial data.
export async function init() {
  document
    .querySelector("#catTableBody")
    .addEventListener("click", onTableClick);
  await bindListSearch({
    inputId: "categorySearch",
    tableBodyId: "catTableBody",
    columnCount: 3,
    load: loadCategories,
  });
}

// Fetches categories and fills the page list.
async function loadCategories(search, isCurrent, options) {
  const tableBody = document.querySelector("#catTableBody");
  const {
    data: categories,
    error,
    nextCursor,
  } = await dbCategory.getCategories(search, options);
  if (!isCurrent()) return;

  if (error) {
    throw error;
  }

  tableBody.innerHTML = "";

  if (!categories?.length) {
    tableBody.innerHTML =
      '<tr><td colspan="3" class="text-center text-muted">Nenhuma categoria encontrada.</td></tr>';
    return { nextCursor };
  }

  categories.forEach((category) => {
    const row = document.createElement("tr");
    const categoryId = category.id;
    const description = category.description ?? "";

    row.innerHTML = `
            <td>${categoryId}</td>
            <td></td>
            <td class="text-end text-nowrap">
                <div class="dropdown table-actions">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false" aria-label="Ações da categoria ${categoryId}">
                        Ações
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><button class="dropdown-item edit-category" type="button" data-id="${categoryId}"><i class="bi bi-pencil me-2"></i>Editar</button></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item text-danger delete-category" type="button" data-id="${categoryId}"><i class="bi bi-trash me-2"></i>Excluir</button></li>
                    </ul>
                </div>
            </td>
        `;

    row.children[1].textContent = description;
    row.querySelector(".delete-category").dataset.name =
      description || "esta categoria";
    tableBody.appendChild(row);
  });
  return { nextCursor };
}

// Handles the action selected in the table.
function onTableClick(event) {
  const editButton = event.target.closest(".edit-category");
  if (editButton) {
    window.location.href = `/menu/categories/edit?catId=${editButton.dataset.id}`;
    return;
  }

  const deleteButton = event.target.closest(".delete-category");
  if (!deleteButton) return;

  confirmModal({
    title: "Deletar Categoria",
    message: `Tem certeza que deseja deletar a categoria <b>${escapeHtml(deleteButton.dataset.name)}</b>?`,
    confirmText: "Deletar",
    loadingText: "Deletando",
    onConfirm: async () => {
      const { error } = await dbCategory.deleteCategory(
        deleteButton.dataset.id,
      );
      if (error) {
        console.error(error);
        showConfirmationError(getDeleteErrorMessage(error));
        return false;
      }
      await reloadCurrentView();
    },
  });
}

// Returns the deletion message for the received error.
function getDeleteErrorMessage(error) {
  return error?.code === "23503"
    ? "Esta categoria está em uso e não pode ser excluída até que os recursos relacionados sejam removidos."
    : "Não foi possível excluir a categoria. Tente novamente.";
}
