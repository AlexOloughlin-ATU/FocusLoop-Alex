const token = localStorage.getItem("token");
if (token && window.location.pathname === "/") {
  const cta = document.querySelector('.heroActions a[href="/auth"]');
  if (cta) {
    cta.href = "/app";
    cta.textContent = "Open dashboard";
  }
}
