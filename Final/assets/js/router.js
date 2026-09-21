const routes = {
  quotes: {
    path: "quotes",
    html: "./views/quotes/quotes.html",
    js: "./pages/quotes/quotes.js",
  },
  quotesedit: {
    path: "quotes/edit",
    html: "./views/quotes/quoteForm.html",
    js: "./pages/quotes/quoteForm.js",
  },
  quotesadd: {
    path: "quotes/add",
    html: "./views/quotes/quoteForm.html",
    js: "./pages/quotes/quoteForm.js",
  },
  categories: {
    path: "categories",
    html: "./views/categories/categories.html",
    js: "./pages/categories/categories.js",
  },
  categoriesedit: {
    path: "categories/edit",
    html: "./views/categories/categoryForm.html",
    js: "./pages/categories/categoryForm.js",
  },
  categoriesadd: {
    path: "categories/add",
    html: "./views/categories/categoryForm.html",
    js: "./pages/categories/categoryForm.js",
  },
  products: {
    path: "products",
    html: "./views/products/products.html",
    js: "./pages/products/products.js",
  },
  productsedit: {
    path: "products/edit",
    html: "./views/products/productForm.html",
    js: "./pages/products/productForm.js",
  },
  productsadd: {
    path: "products/add",
    html: "./views/products/productForm.html",
    js: "./pages/products/productForm.js",
  },
  users: {
    path: "users",
    html: "./views/users/users.html",
    js: "./pages/users/users.js",
  },
  useredit: {
    path: "users/edit",
    html: "./views/users/userForm.html",
    js: "./pages/users/userForm.js",
  },
  useradd: {
    path: "users/add",
    html: "./views/users/userForm.html",
    js: "./pages/users/userForm.js",
  },
  clients: {
    path: "clients",
    html: "./views/clients/clients.html",
    js: "./pages/clients/clients.js",
  },
  clientsedit: {
    path: "clients/edit",
    html: "./views/clients/clientForm.html",
    js: "./pages/clients/clientForm.js",
  },
  clientsadd: {
    path: "clients/add",
    html: "./views/clients/clientForm.html",
    js: "./pages/clients/clientForm.js",
  },
};

const DEFAULT_ROUTE = "quotes";
let navigationId = 0;

// Gets the application base path from the current URL.
function getAppBasePath() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const menuPath = pathname.match(/^(.*\/menu)(?:\.html)?(?:\/.*)?$/);

  // Tambem funciona quando o sistema esta em uma subpasta, como /sistema/menu.
  if (menuPath) return menuPath[1] || "/menu";

  return pathname === "/" ? "" : pathname.replace(/\/[^/]*$/, "");
}

const appBasePath = getAppBasePath();
const applicationPath = appBasePath.replace(/\/menu$/, "");

// Finds the route matching the current URL.
function getRouteFromLocation() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const menuPath = pathname.match(/^(.*\/menu)(?:\.html)?(?:\/(.*))?$/);
  const routePath = menuPath?.[2] || "";

  return (
    Object.entries(routes).find(
      ([, config]) => config.path === routePath,
    )?.[0] ?? (routePath === "quotes" ? DEFAULT_ROUTE : null)
  );
}

// Builds a route URL with its query parameters.
function getRouteUrl(route, query = {}) {
  const config = routes[route];
  const baseUrl =
    `${appBasePath}${config.path ? `/${config.path}` : ""}` || "/";
  const searchParams = new URLSearchParams(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
  const search = searchParams.toString();

  return `${baseUrl}${search ? `?${search}` : ""}`;
}

// Resolves the HTML path for a page.
function getViewUrl(viewPath) {
  return `${applicationPath}/${viewPath.replace(/^\.\//, "")}`;
}

// Updates navigation links with their route URLs.
function syncNavigationLinks() {
  document.querySelectorAll("a[data-route]").forEach((link) => {
    const route = link.dataset.route;
    if (routes[route]) link.href = getRouteUrl(route);
  });
}

// Displays a page loading error.
function showRouteError() {
  document.querySelector("#viewContent").innerHTML =
    '<div class="alert alert-danger" role="alert">Não foi possível carregar esta página.</div>';
}

// Loads the route view and initializes its JavaScript module.
export async function navigate(
  route,
  { query = {}, replace = false, updateHistory = true } = {},
) {
  const routeName = routes[route] ? route : DEFAULT_ROUTE;
  const config = routes[routeName];
  const app = document.querySelector("#viewContent");
  const currentNavigation = ++navigationId;

  if (updateHistory) {
    history[replace ? "replaceState" : "pushState"](
      { route: routeName },
      "",
      getRouteUrl(routeName, query),
    );
  }

  app.setAttribute("aria-busy", "true");
  app.classList.add("is-loading");

  try {
    const response = await fetch(getViewUrl(config.html));
    if (!response.ok) throw new Error(`Failed to load view: ${config.html}`);

    const html = await response.text();
    // Ignora uma resposta antiga quando o usuario navega rapidamente.
    if (currentNavigation !== navigationId) return;

    app.innerHTML = html;

    if (config.js) {
      const module = await import(config.js);
      if (currentNavigation !== navigationId) return;
      await module.init?.();
    }

    window.scrollTo(0, 0);
    document.dispatchEvent(
      new CustomEvent("routechange", { detail: { route: routeName } }),
    );
  } catch (error) {
    console.error(error);
    if (currentNavigation === navigationId) showRouteError();
  } finally {
    if (currentNavigation === navigationId) {
      app.removeAttribute("aria-busy");
      app.classList.remove("is-loading");
    }
  }
}

// Reloads the current route while keeping its query parameters.
export function reloadCurrentView() {
  const route = getRouteFromLocation() || DEFAULT_ROUTE;
  const query = Object.fromEntries(new URLSearchParams(window.location.search));

  return navigate(route, { query, updateHistory: false });
}

// Sets up navigation and loads the initial route.
export function initRouter() {
  syncNavigationLinks();

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-route]");
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;

    const route = link.dataset.route;
    if (!routes[route] || link.target === "_blank") return;

    event.preventDefault();
    navigate(route).catch(console.error);
  });

  window.addEventListener("popstate", () => {
    const route = getRouteFromLocation() || DEFAULT_ROUTE;
    navigate(route, {
      query: Object.fromEntries(new URLSearchParams(window.location.search)),
      updateHistory: false,
    }).catch(console.error);
  });

  // Converte links antigos, como /menu#users, para a nova URL sem hash.
  const legacyRoute = window.location.hash.slice(1);
  const currentRoute = getRouteFromLocation();
  const route = routes[legacyRoute]
    ? legacyRoute
    : currentRoute || DEFAULT_ROUTE;

  navigate(route, {
    query: Object.fromEntries(new URLSearchParams(window.location.search)),
    replace: Boolean(legacyRoute) || !currentRoute,
    updateHistory: Boolean(legacyRoute) || !currentRoute,
  }).catch(console.error);
}
