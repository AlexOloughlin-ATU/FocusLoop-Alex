const form = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

function setError(msg){
  errorMessage.textContent = msg || "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setError("");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.message || "Login failed.");
      return;
    }

    localStorage.setItem("token", data.token);
    window.location.href = "dashboard.html";
  } catch (err) {
    setError("Could not reach server. Is it running?");
  }
});