import * as dbProduct from "../../soupabase/product.js";
import { confirmModal, showConfirmationError } from "../../../../components/confirmationModal.js";
import { reloadCurrentView } from "../../router.js";
import { bindListSearch } from "../../listSearch.js";

export async function init() {
    document.querySelector("#productTableBody").addEventListener("click", onTableClick);
    await bindListSearch({ inputId: "productSearch", tableBodyId: "productTableBody", columnCount: 8, load: loadProducts });
}

async function loadProducts(search, isCurrent, options) {
    const tableBody = document.querySelector("#productTableBody");
    const { data: products, error, nextCursor } = await dbProduct.getProducts(search, options);
    if (!isCurrent()) return;

    if (error) { throw error; }

    tableBody.innerHTML = "";

    if (!products?.length) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Nenhum produto encontrado.</td></tr>';
        return { nextCursor };
    }

    products.forEach((product) => {
        const row = document.createElement("tr");
        const category = product.category?.description ?? "Sem categoria";
        const status = getStatus(product.status);

        row.innerHTML = `
            <td>${product.id}</td>
            <td></td>
            <td></td>
            <td></td>
            <td><span class="badge ${status.active ? "text-bg-success" : "text-bg-danger"}"></span></td>
            <td></td>
            <td></td>
            <td class="text-end text-nowrap">
                <div class="dropdown table-actions">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false" aria-label="Ações do produto ${product.id}">
                        Ações
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><button class="dropdown-item edit-product" type="button" data-id="${product.id}"><i class="bi bi-pencil me-2"></i>Editar</button></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item text-danger delete-product" type="button" data-id="${product.id}"><i class="bi bi-trash me-2"></i>Excluir</button></li>
                    </ul>
                </div>
            </td>
        `;

        row.children[1].textContent = product.description ?? "";
        row.children[2].textContent = category;
        row.children[3].textContent = formatPrice(product.price);
        row.querySelector(".badge").textContent = status.label;
        row.children[5].textContent = product.observation ?? "—";
        row.children[6].textContent = formatDate(product.created_at);
        row.querySelector(".delete-product").dataset.name = product.description ?? "este produto";
        tableBody.appendChild(row);
    });
    return { nextCursor };

}

function getStatus(status) {
    const value = String(status ?? "").toLowerCase();
    const active = value === "active" || value === "ativo";

    return { active, label: active ? "Ativo" : "Inativo" };
}

function formatPrice(price) {
    const value = Number(price);
    if (!Number.isFinite(value)) return "—";

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(value);
}

function formatDate(date) {
    if (!date) return "—";

    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return "—";

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(value);
}

function onTableClick(event) {
    const editButton = event.target.closest(".edit-product");
    if (editButton) {
        window.location.href = `/menu/products/edit?productId=${editButton.dataset.id}`;
        return;
    }

    const deleteButton = event.target.closest(".delete-product");
    if (!deleteButton) return;

    confirmModal({
        title: "Deletar Produto",
        message: `Tem certeza que deseja deletar o produto <b>${escapeHtml(deleteButton.dataset.name)}</b>?`,
        confirmText: "Deletar",
        loadingText: "Deletando",
        onConfirm: async () => {
            const { error } = await dbProduct.deleteProduct(deleteButton.dataset.id);
            if (error) {
                console.error(error);
                showConfirmationError(getDeleteErrorMessage(error));
                return false;
            }
            await reloadCurrentView();
        }
    });
}

function getDeleteErrorMessage(error) {
    return error?.code === "23503"
        ? "Este produto está em uso e não pode ser excluído até que os recursos relacionados sejam removidos."
        : "Não foi possível excluir o produto. Tente novamente.";
}

function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = value;
    return element.innerHTML;
}
