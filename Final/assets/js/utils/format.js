// Formats a value in Brazilian reais with the selected fallback behavior.
export function formatCurrency(value, { coerceInvalidToZero = false } = {}) {
  const number = coerceInvalidToZero ? Number(value) || 0 : Number(value);
  return coerceInvalidToZero || Number.isFinite(number)
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(number)
    : "—";
}

// Formats a date and time using the Brazilian locale.
export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}

// Returns the display name for a client type.
export function formatClientType(value, fallback = "—") {
  if (!value) return fallback;
  return String(value).toUpperCase() === "PJ"
    ? "Pessoa Jurídica"
    : "Pessoa Física";
}

// Formats a CPF or CNPJ based on its digit count.
export function formatDocument(value, fallback = "—") {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 11)
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (digits.length === 14)
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  return value || fallback;
}

// Formats a Brazilian phone number with its area code.
export function formatPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 10)
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  if (digits.length === 11)
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return value || "—";
}

// Returns the display name for an access role.
export function formatRole(
  role,
  { adminLabel = "Administrador", fallback = "—" } = {},
) {
  switch (role) {
    case "owner":
      return "Dono";
    case "admin":
      return adminLabel;
    case "user":
      return "Usuário";
    default:
      return fallback;
  }
}
