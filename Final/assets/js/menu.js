import { formatRole } from "./utils/format.js";
import { initRouter } from "./router.js";
import { initResponsiveTables } from "./responsiveTables.js";
import * as dbUser from "./soupabase/user.js";

initResponsiveTables();

const appShell = document.querySelector("#app-shell");
const sidebarTrigger = document.querySelector("#sidebar-trigger");
const pageTitle = document.querySelector("#page-title");
const sidebarLinks = document.querySelectorAll(".sidebar-link");
const usersSidebarLink = document.querySelector(
  '.sidebar-link[data-route="users"]',
);
const themeToggle = document.querySelector("#theme-toggle");
const themeToggleIcon = document.querySelector("#theme-toggle-icon");
const sidebarUserAvatar = document.querySelector("#sidebar-user-avatar");
const sidebarUserName = document.querySelector("#sidebar-user-name");
const sidebarUserRole = document.querySelector("#sidebar-user-role");
const logoutButton = document.querySelector("#logout-button");
const THEME_STORAGE_KEY = "saberti-theme";

const routeTitles = {
  quotes: "Orçamentos",
  quotesedit: "Editar Orçamento",
  quotesadd: "Adicionar Orçamento",
  products: "Produtos",
  productsedit: "Editar Produto",
  productsadd: "Adicionar Produto",
  categories: "Categorias",
  categoriesedit: "Editar Categoria",
  categoriesadd: "Adicionar Categoria",
  clients: "Clientes",
  clientsedit: "Editar Cliente",
  clientsadd: "Adicionar Cliente",
  useredit: "Editar usuário",
  useradd: "Adicionar usuário",
  users: "Usuários",
};

// Checks whether the screen width uses the mobile layout.
function isMobileLayout() {
  return window.matchMedia("(max-width: 767.98px)").matches;
}

// Updates the button to reflect the sidebar state.
function updateSidebarButton() {
  const isOpen = isMobileLayout()
    ? appShell.classList.contains("sidebar-open")
    : !appShell.classList.contains("sidebar-collapsed");

  sidebarTrigger.setAttribute("aria-expanded", String(isOpen));
  sidebarTrigger.setAttribute(
    "aria-label",
    isOpen ? "Recolher menu lateral" : "Expandir menu lateral",
  );
}

// Toggles the sidebar visibility.
function toggleSidebar() {
  appShell.classList.toggle(
    isMobileLayout() ? "sidebar-open" : "sidebar-collapsed",
  );
  updateSidebarButton();
}

// Updates the page title and active navigation item.
function updateNavigation(route) {
  pageTitle.textContent = routeTitles[route] || "SaberTI";

  sidebarLinks.forEach((link) => {
    const isActive = link.dataset.route === route;
    link.classList.toggle("active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

// Reads the theme preference saved in the browser.
function getSavedTheme() {
  try {
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    return theme === "light" || theme === "dark" ? theme : null;
  } catch (_) {
    return null;
  }
}

// Applies the theme and optionally saves the preference.
function applyTheme(theme, { persist = false } = {}) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  themeToggleIcon.className = `bi ${theme === "dark" ? "bi-moon-stars-fill" : "bi-sun-fill"}`;
  themeToggle.setAttribute("aria-checked", String(theme === "dark"));
  themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro",
  );

  if (!persist) return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (_) {
    // The theme continues to work for this session when storage is unavailable.
  }
}

// Loads the user details displayed in the sidebar.
async function loadSidebarUser() {
  const { user, error } = await dbUser.getLoggedUser();
  usersSidebarLink.classList.toggle(
    "d-none",
    Boolean(error) || !["admin", "owner"].includes(user?.role),
  );
  if (error || !user) {
    sidebarUserName.textContent = "Usuário";
    return;
  }

  const name = user.fullname || user.username || user.email;
  sidebarUserName.textContent = name;
  sidebarUserRole.textContent = formatRole(user.role, { fallback: "" });
  sidebarUserAvatar.textContent = name.charAt(0).toUpperCase();
}

// Ends the session and redirects to login.
async function logout() {
  logoutButton.disabled = true;
  const { error } = await dbUser.logoutUser();

  if (error) {
    console.error(error);
    logoutButton.disabled = false;
    return;
  }

  window.location.href = "/login";
}

// Loads the confirmation modal into the page.
async function loadConfirmationModal() {
  const response = await fetch("/components/confirmationModal.html");

  if (!response.ok) {
    throw new Error("Failed to load confirmation modal");
  }

  const html = await response.text();

  document.body.insertAdjacentHTML("beforeend", html);
}

document.addEventListener("click", function (event) {
  const button = event.target.closest(".js-confirm");

  if (!button) {
    return;
  }

  event.preventDefault();

  const title = button.dataset.confirmTitle || "Confirm action";
  const message = button.dataset.confirmMessage || "Are you sure?";
  const confirmText = button.dataset.confirmText || "Confirm";
  const confirmClass = button.dataset.confirmClass || "btn-danger";

  const modalElement = document.getElementById("confirmationModal");

  document.getElementById("confirmationModalTitle").textContent = title;
  document.getElementById("confirmationModalMessage").textContent = message;

  const confirmButton = document.getElementById("confirmationModalConfirm");

  confirmButton.textContent = confirmText;
  confirmButton.className = `btn ${confirmClass}`;

  // Store what should happen when the user confirms
  confirmButton.onclick = function () {
    handleConfirmation(button);
  };

  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

  modal.show();
});

sidebarTrigger.addEventListener("click", toggleSidebar);
logoutButton.addEventListener("click", logout);

themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-bs-theme");
  applyTheme(currentTheme === "dark" ? "light" : "dark", { persist: true });
});

sidebarLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (isMobileLayout()) {
      appShell.classList.remove("sidebar-open");
      updateSidebarButton();
    }
  });
});

window.addEventListener("resize", updateSidebarButton);
document.addEventListener("routechange", (event) =>
  updateNavigation(event.detail.route),
);

applyTheme(
  getSavedTheme() ||
    document.documentElement.getAttribute("data-bs-theme") ||
    "light",
);
updateSidebarButton();
initRouter();
loadConfirmationModal();
loadSidebarUser();
