import { formatCurrency } from "../assets/js/utils/format.js";
import { bindPickerSearch } from "./pickerSearch.js";

let componentPromise;
let disposeSearch;
let products = [];
let filteredProducts = [];
let onSelectProduct;
let sort = { key: "description", direction: "asc" };

// Opens the product picker with search and sorting.
export async function openProductPicker({ loadProducts, onSelect }) {
  const modalElement = await ensureComponent();
  disposeSearch?.();
  products = [];
  onSelectProduct = onSelect;
  sort = { key: "description", direction: "asc" };

  const search = modalElement.querySelector("#productPickerSearch");
  search.value = "";
  renderProducts(modalElement);
  disposeSearch = bindPickerSearch({
    modal: modalElement,
    input: search,
    body: modalElement.querySelector("#productPickerTableBody"),
    columnCount: 5,
    load: loadProducts,
    getSort: () => sort,
    onPending: () => {
      products = [];
      filteredProducts = [];
    },
    onResults: (data) => {
      products = data;
      renderProducts(modalElement);
    },
  });

  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
  modal.show();
  modalElement.addEventListener("shown.bs.modal", () => search.focus(), {
    once: true,
  });
}

// Loads the modal HTML if it is not already on the page.
async function ensureComponent() {
  const existing = document.querySelector("#productPickerModal");
  if (existing) return existing;

  if (!componentPromise) {
    componentPromise = fetch("/components/productPickerModal.html")
      .then((response) => {
        if (!response.ok)
          throw new Error("Não foi possível carregar o seletor de produtos.");
        return response.text();
      })
      .then((html) => {
        document.body.insertAdjacentHTML("beforeend", html);
        const modal = document.querySelector("#productPickerModal");
        modal
          .querySelector("#productPickerSearch")
          .addEventListener("keydown", onSearchKeydown);
        modal.querySelector("thead").addEventListener("click", onSortClick);
        modal
          .querySelector("#productPickerTableBody")
          .addEventListener("click", onProductClick);
        return modal;
      });
  }

  return componentPromise;
}

// Fills the picker table with available products.
function renderProducts(modalElement) {
  if (
    modalElement
      .querySelector("#productPickerTableBody")
      .hasAttribute("aria-busy")
  )
    return;
  filteredProducts = [...products];

  modalElement.querySelectorAll(".sort-button").forEach((button) => {
    const active = button.dataset.sort === sort.key;
    button.classList.toggle("active", active);
    button.querySelector("i").className =
      `bi ${active ? (sort.direction === "asc" ? "bi-sort-up" : "bi-sort-down") : "bi-arrow-down-up"}`;
  });

  const tableBody = modalElement.querySelector("#productPickerTableBody");
  tableBody.innerHTML = "";
  if (!filteredProducts.length) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted">Nenhum produto encontrado.</td></tr>';
    return;
  }

  filteredProducts.forEach((product, index) => {
    const row = document.createElement("tr");
    row.dataset.productId = product.id;
    if (index === 0) row.classList.add("product-picker-first");
    row.innerHTML = `
            <td></td><td></td><td></td><td class="text-end"></td>
            <td class="text-end"><button type="button" class="btn btn-sm btn-primary select-product" data-id="${product.id}">Selecionar</button></td>
        `;
    row.children[0].textContent = product.id;
    row.children[1].textContent = product.description ?? "";
    row.children[2].textContent =
      product.category?.description ?? "Sem categoria";
    row.children[3].textContent = formatCurrency(product.price, {
      coerceInvalidToZero: true,
    });
    tableBody.appendChild(row);
  });
}

// Selects the first result when Enter is pressed.
function onSearchKeydown(event) {
  if (event.key !== "Enter" || !filteredProducts.length) return;
  event.preventDefault();
  selectProduct(filteredProducts[0]);
}

// Changes the result ordering for the selected column.
function onSortClick(event) {
  const button = event.target.closest(".sort-button");
  if (!button) return;
  sort =
    sort.key === button.dataset.sort
      ? { key: sort.key, direction: sort.direction === "asc" ? "desc" : "asc" }
      : { key: button.dataset.sort, direction: "asc" };
  disposeSearch.reset();
}

// Finds and selects the clicked product.
function onProductClick(event) {
  const button = event.target.closest(".select-product");
  if (!button) return;
  selectProduct(
    products.find((product) => String(product.id) === button.dataset.id),
  );
}

// Returns the selected product through the callback and closes the modal.
function selectProduct(product) {
  if (!product) return;
  onSelectProduct?.(product);
  bootstrap.Modal.getInstance(
    document.querySelector("#productPickerModal"),
  )?.hide();
}
