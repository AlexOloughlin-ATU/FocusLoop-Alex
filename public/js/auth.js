const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authMessage = document.getElementById("authMessage");

function setMode(mode) {
  const isRegister = mode === "register";
  loginTab.classList.toggle("active", !isRegister);
  registerTab.classList.toggle("active", isRegister);
  loginForm.classList.toggle("hidden", isRegister);
  registerForm.classList.toggle("hidden", !isRegister);
  authMessage.textContent = "";
}

loginTab.addEventListener("click", () => setMode("login"));
registerTab.addEventListener("click", () => setMode("register"));

const params = new URLSearchParams(window.location.search);
setMode(params.get("mode") === "register" ? "register" : "login");

function setMessage(message, isError = true) {
  authMessage.textContent = message;
  authMessage.style.color = isError ? "var(--danger)" : "var(--success)";
}

async function handleAuth(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    setMessage(data.message || "Something went wrong.");
    return;
  }

  localStorage.setItem("token", data.token);
  if (data.user?.theme) {
    localStorage.setItem("theme", data.user.theme);
  }
  window.location.href = "/app";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  await handleAuth("/api/auth/login", { email, password });
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const displayName = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  await handleAuth("/api/auth/register", { displayName, email, password });
});
