// Escapes text for safe insertion into HTML content.
export function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}
