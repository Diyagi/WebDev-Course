// Marks a field as invalid and displays its error message.
export function setInvalid(element, message) {
  clearValidation(element);

  element.classList.add("is-invalid");

  const feedback = document.createElement("div");
  feedback.className = "invalid-feedback";
  feedback.textContent = message;

  element.parentElement.appendChild(feedback);
}

// Marks a field as valid and displays an optional message.
export function setValid(element, message) {
  clearValidation(element);

  element.classList.add("is-valid");

  if (message) {
    const feedback = document.createElement("div");
    feedback.className = "valid-feedback";
    feedback.textContent = message;

    element.parentElement.appendChild(feedback);
  }
}

// Removes validation states and messages from a field.
export function clearValidation(element) {
  element.classList.remove("is-invalid", "is-valid", "is-loading");

  const feedback = element.parentElement.querySelector(
    ".invalid-feedback, .valid-feedback",
  );

  if (feedback) {
    feedback.remove();
  }
}

// Removes validation states and messages from a form.
export function clearAllValidations(element) {
  if (!element) {
    return;
  }

  element
    .querySelectorAll(".is-invalid, .is-valid, .is-loading")
    .forEach((child) => {
      child.classList.remove("is-invalid", "is-valid", "is-loading");
    });

  element
    .querySelectorAll(".invalid-feedback, .valid-feedback")
    .forEach((feedback) => {
      feedback.remove();
    });
}

// Displays a message in the form.
export function showMessage(type, message) {
  const formMessage = document.querySelector("#formMessage");

  formMessage.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="alert"
                aria-label="Fechar"
            ></button>
        </div>
    `;
}
