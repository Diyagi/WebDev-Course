import * as dbUser from "./soupabase/user.js";

const loginForm = document.querySelector("#login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const passwordToggle = document.querySelector("#password-toggle");
const credentialsAlert = document.querySelector("#credentials-alert");

// Hides the invalid credentials message.
function hideCredentialsError() {
  credentialsAlert.classList.add("d-none");
  emailInput.classList.remove("is-invalid");
  passwordInput.classList.remove("is-invalid");
}

// Displays the invalid credentials message.
function showCredentialsError() {
  credentialsAlert.classList.remove("d-none");
  emailInput.classList.add("is-invalid");
  passwordInput.classList.add("is-invalid");
  credentialsAlert.focus();
}

// Toggles password visibility in the login field.
function setPasswordVisibility() {
  const passwordIsVisible = passwordInput.type === "text";
  passwordInput.type = passwordIsVisible ? "password" : "text";
  passwordToggle.innerHTML = passwordIsVisible
    ? '<i class="fa-solid fa-eye" aria-hidden="true"></i>'
    : '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>';
  passwordToggle.setAttribute(
    "aria-label",
    passwordIsVisible ? "Mostrar senha" : "Ocultar senha",
  );
  passwordToggle.setAttribute("aria-pressed", String(!passwordIsVisible));
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideCredentialsError();

  const formData = new FormData(event.target);
  const dataObj = Object.fromEntries(formData.entries());

  if (!dataObj.email || !dataObj.password) {
    showCredentialsError();
    return;
  }

  const { data, error } = await dbUser.authUser(
    emailInput.value,
    passwordInput.value,
  );

  if (error) {
    showCredentialsError();
  }

  console.log(data);

  if (data.user && data.session) {
    window.location.replace("/menu");
  }
});

emailInput.addEventListener("input", hideCredentialsError);
passwordInput.addEventListener("input", hideCredentialsError);
passwordToggle.addEventListener("click", setPasswordVisibility);
