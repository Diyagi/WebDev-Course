import { initRouter } from "./router.js";
import { initResponsiveTables } from "./responsiveTables.js";
import * as dbUser from "./soupabase/user.js";

initResponsiveTables();

const appShell = document.querySelector("#app-shell");
const sidebarTrigger = document.querySelector("#sidebar-trigger");
const pageTitle = document.querySelector("#page-title");
const sidebarLinks = document.querySelectorAll(".sidebar-link");
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
  users: "Usuários"
};

function isMobileLayout() {
  return window.matchMedia("(max-width: 767.98px)").matches;
}

function updateSidebarButton() {
  const isOpen = isMobileLayout()
    ? appShell.classList.contains("sidebar-open")
    : !appShell.classList.contains("sidebar-collapsed");

  sidebarTrigger.setAttribute("aria-expanded", String(isOpen));
  sidebarTrigger.setAttribute("aria-label", isOpen ? "Recolher menu lateral" : "Expandir menu lateral");
}

function toggleSidebar() {
  appShell.classList.toggle(isMobileLayout() ? "sidebar-open" : "sidebar-collapsed");
  updateSidebarButton();
}

function updateNavigation(route) {
  pageTitle.textContent = routeTitles[route] || "SaberTI";

  sidebarLinks.forEach((link) => {
    const isActive = link.dataset.route === route;
    link.classList.toggle("active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

function getSavedTheme() {
  try {
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    return theme === "light" || theme === "dark" ? theme : null;
  } catch (_) {
    return null;
  }
}

function applyTheme(theme, { persist = false } = {}) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  themeToggleIcon.className = `bi ${theme === "dark" ? "bi-moon-stars-fill" : "bi-sun-fill"}`;
  themeToggle.setAttribute("aria-checked", String(theme === "dark"));
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro");

  if (!persist) return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (_) {
    // The theme continues to work for this session when storage is unavailable.
  }
}

async function loadSidebarUser() {
  const { user, error } = await dbUser.getLoggedUser();
  if (error || !user) {
    sidebarUserName.textContent = "Usuário";
    return;
  }

  const name = user.fullname || user.username || user.email;
  sidebarUserName.textContent = name;
  sidebarUserRole.textContent = formatRole(user.role);
  sidebarUserAvatar.textContent = name.charAt(0).toUpperCase();
}

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

function formatRole(role) {
  switch (role) {
    case "owner": return "Dono";
    case "admin": return "Administrador";
    case "user": return "Usuário";
    default: return "";
  }
}

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

    const confirmButton =
        document.getElementById("confirmationModalConfirm");

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
document.addEventListener("routechange", (event) => updateNavigation(event.detail.route));

applyTheme(getSavedTheme() || document.documentElement.getAttribute("data-bs-theme") || "light");
updateSidebarButton();
initRouter();
loadConfirmationModal();
loadSidebarUser();
