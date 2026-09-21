// Configures and opens the action confirmation modal.
export function confirmModal({
  title = "Confirmar ação",
  message = "Tem Certeza?",
  confirmText = "Confirmar",
  confirmClass = "btn-danger",
  loadingText = "",
  onConfirm,
}) {
  const modalElement = document.getElementById("confirmationModal");

  const titleElement = document.getElementById("confirmationModalTitle");

  const messageElement = document.getElementById("confirmationModalMessage");

  const confirmButton = document.getElementById("confirmationModalConfirm");

  titleElement.textContent = title;
  messageElement.innerHTML = message;

  confirmButton.textContent = confirmText;
  confirmButton.className = `btn ${confirmClass}`;

  // Remove the previous callback
  confirmButton.onclick = null;

  // Set the new callback
  confirmButton.onclick = async function () {
    confirmButton.disabled = true;
    const confirmBtnInner = confirmButton.innerHTML;

    if (loadingText) {
      confirmButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      			${loadingText}...`;
    }

    try {
      const shouldClose = await onConfirm?.();

      if (shouldClose !== false) {
        bootstrap.Modal.getInstance(modalElement).hide();
      }
    } finally {
      confirmButton.innerHTML = confirmBtnInner;
      confirmButton.disabled = false;
    }
  };

  bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

// Displays an error in the confirmation modal.
export function showConfirmationError(message) {
  const messageElement = document.getElementById("confirmationModalMessage");
  messageElement.querySelector(".confirmation-error")?.remove();

  messageElement.insertAdjacentHTML(
    "beforeend",
    `<div class="alert alert-danger mt-3 mb-0 confirmation-error" role="alert">${message}</div>`,
  );
}
