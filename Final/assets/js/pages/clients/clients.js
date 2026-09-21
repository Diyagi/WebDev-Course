import {
  formatClientType,
  formatDocument,
  formatPhone,
} from "../../utils/format.js";
import { escapeHtml } from "../../utils/html.js";
import * as dbClient from "../../soupabase/client.js";
import {
  confirmModal,
  showConfirmationError,
} from "../../../../components/confirmationModal.js";
import { reloadCurrentView } from "../../router.js";
import { bindListSearch } from "../../listSearch.js";

// Sets up page events and loads the initial data.
export async function init() {
  document
    .querySelector("#clientTableBody")
    .addEventListener("click", onTableClick);
  await bindListSearch({
    inputId: "clientSearch",
    tableBodyId: "clientTableBody",
    columnCount: 8,
    load: loadClients,
  });
}

// Fetches clients and fills the page list.
async function loadClients(search, isCurrent, options) {
  const tableBody = document.querySelector("#clientTableBody");
  const {
    data: clients,
    error,
    nextCursor,
  } = await dbClient.getClients(search, options);
  if (!isCurrent()) return;

  if (error) {
    throw error;
  }

  tableBody.innerHTML = "";

  if (!clients?.length) {
    tableBody.innerHTML =
      '<tr><td colspan="8" class="text-center text-muted">Nenhum cliente encontrado.</td></tr>';
    return { nextCursor };
  }

  clients.forEach((client) => {
    const row = document.createElement("tr");
    const name = client.name ?? "";

    row.innerHTML = `
            <td>${client.id}</td>
            <td></td>
            <td></td>
            <td><span class="badge text-bg-secondary"></span></td>
            <td></td>
            <td></td>
            <td></td>
            <td class="text-end text-nowrap">
                <div class="dropdown table-actions">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false" aria-label="Ações do cliente ${client.id}">
                        Ações
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><button class="dropdown-item edit-client" type="button" data-id="${client.id}"><i class="bi bi-pencil me-2"></i>Editar</button></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item text-danger delete-client" type="button" data-id="${client.id}"><i class="bi bi-trash me-2"></i>Excluir</button></li>
                    </ul>
                </div>
            </td>
        `;

    row.children[1].textContent = name;
    row.children[2].textContent = formatDocument(client.cpf_cnpj);
    row.querySelector(".badge").textContent = formatClientType(
      client.clienttype,
      "Pessoa Física",
    );
    row.children[4].textContent = formatPhone(client.phone);
    row.children[5].textContent = client.email ?? "—";
    row.children[6].textContent = client.delivery_address || "—";
    row.querySelector(".delete-client").dataset.name = name || "este cliente";
    tableBody.appendChild(row);
  });
  return { nextCursor };
}

// Handles the action selected in the table.
function onTableClick(event) {
  const editButton = event.target.closest(".edit-client");
  if (editButton) {
    window.location.href = `/menu/clients/edit?clientId=${editButton.dataset.id}`;
    return;
  }

  const deleteButton = event.target.closest(".delete-client");
  if (!deleteButton) return;

  confirmModal({
    title: "Deletar Cliente",
    message: `Tem certeza que deseja deletar o cliente <b>${escapeHtml(deleteButton.dataset.name)}</b>?`,
    confirmText: "Deletar",
    loadingText: "Deletando",
    onConfirm: async () => {
      const { error } = await dbClient.deleteClient(deleteButton.dataset.id);
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
    ? "Este cliente está em uso e não pode ser excluído até que os recursos relacionados sejam removidos."
    : "Não foi possível excluir o cliente. Tente novamente.";
}
