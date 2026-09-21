import { formatRole } from "../../utils/format.js";
import { escapeHtml } from "../../utils/html.js";
import * as dbUser from "../../soupabase/user.js";
import {
  confirmModal,
  showConfirmationError,
} from "../../../../components/confirmationModal.js";
import { reloadCurrentView } from "../../router.js";

// Sets up page events and loads the initial data.
export async function init() {
  document
    .querySelector("#usersTableBody")
    .addEventListener("click", onTableClick);
  await loadUsers();
}

// Fetches users and fills the page list.
async function loadUsers() {
  const tableBody = document.querySelector("#usersTableBody");
  const { data, error } = await dbUser.getUsers();
  const users = data?.users;

  if (error) {
    console.error(error);
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-danger">Não foi possível carregar os usuários.</td></tr>';
    return;
  }

  tableBody.innerHTML = "";

  if (!users?.length) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted">Nenhum usuário cadastrado.</td></tr>';
    return;
  }

  users.forEach((user) => {
    const row = document.createElement("tr");
    const profile = user.profile ?? {};
    const name = profile.full_name ?? "";

    row.innerHTML = `
            <td></td>
            <td></td>
            <td></td>
            <td><span class="badge text-bg-secondary"></span></td>
            <td class="text-end text-nowrap">
                <div class="dropdown table-actions">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false" aria-label="Ações do usuário ${user.id}">
                        Ações
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><button class="dropdown-item edit-user" type="button" data-id="${user.id}"><i class="bi bi-pencil me-2"></i>Editar</button></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item text-danger delete-user" type="button" data-id="${user.id}"><i class="bi bi-trash me-2"></i>Excluir</button></li>
                    </ul>
                </div>
            </td>
        `;

    row.children[0].textContent = user.email ?? "";
    row.children[1].textContent = profile.username ?? "";
    row.children[2].textContent = name;
    row.querySelector(".badge").textContent = formatRole(profile.user_role, {
      adminLabel: "Admin",
    });
    row.querySelector(".delete-user").dataset.name = name || "este usuário";
    tableBody.appendChild(row);
  });
}

// Handles the action selected in the table.
function onTableClick(event) {
  const editButton = event.target.closest(".edit-user");
  if (editButton) {
    window.location.href = `/menu/users/edit?userId=${editButton.dataset.id}`;
    return;
  }

  const deleteButton = event.target.closest(".delete-user");
  if (!deleteButton) return;

  confirmModal({
    title: "Deletar Usuário",
    message: `Tem certeza que deseja deletar o usuário <b>${escapeHtml(deleteButton.dataset.name)}</b>?`,
    confirmText: "Deletar",
    loadingText: "Deletando",
    onConfirm: async () => {
      const { error } = await dbUser.deleteUser(deleteButton.dataset.id);
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
    ? "Este usuário está em uso e não pode ser excluído até que os recursos relacionados sejam removidos."
    : "Não foi possível excluir o usuário. Tente novamente.";
}
