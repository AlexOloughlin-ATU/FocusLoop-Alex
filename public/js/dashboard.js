// public/js/dashboard.js

const token = localStorage.getItem("token");
if (!token) window.location.href = "/";

/* ============================= */
/* Helpers */
/* ============================= */

function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function renderProgress(totalXP) {
  const xpIntoLevel = totalXP % 100;
  const pct = clamp((xpIntoLevel / 100) * 100, 0, 100);
  const bar = document.getElementById("xpBar");
  if (bar) bar.style.width = `${pct}%`;

  const remaining = 100 - xpIntoLevel;
  setText("xpToNext", `${remaining} XP to next level`);
}

/* ============================= */
/* Toast */
/* ============================= */

let toastTimer;

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");
  void toast.offsetWidth;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 250);
  }, 1800);
}

/* ============================= */
/* Topbar */
/* ============================= */

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "/";
});

document.getElementById("refreshBtn")?.addEventListener("click", () => {
  init();
});

document.getElementById("refreshInsightsBtn")?.addEventListener("click", () => {
  loadWeeklyInsights();
});

/* ============================= */
/* Modal - Create Track */
/* ============================= */

const modal = document.getElementById("trackModal");

document.getElementById("newTrackBtn")?.addEventListener("click", () => {
  modal?.classList.remove("hidden");
});

document.getElementById("cancelTrack")?.addEventListener("click", () => {
  modal?.classList.add("hidden");
});

modal?.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.add("hidden");
});

async function createTrack() {
  const title = document.getElementById("trackTitle").value.trim();
  const target = Number(document.getElementById("trackTarget").value) || 3;
  const xp = Number(document.getElementById("trackXP").value) || 10;

  if (!title) {
    showToast("Title required");
    return;
  }

  const res = await authFetch("/api/tracks", {
    method: "POST",
    body: JSON.stringify({ title, targetPerWeek: target, xpPerSession: xp }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    showToast(data.message || `Create failed (${res.status})`);
    return;
  }

  document.getElementById("trackTitle").value = "";
  document.getElementById("trackTarget").value = "";
  document.getElementById("trackXP").value = "";

  modal.classList.add("hidden");

  showToast("Track created");

  await loadTracks();
  await loadStats();
  await loadWeeklyAnalytics();
  await loadWeeklyInsights();
}

document.getElementById("createTrack")?.addEventListener("click", createTrack);

/* ============================= */
/* Load Stats */
/* ============================= */

async function loadStats() {
  const res = await authFetch("/api/stats");

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/";
    return;
  }

  const data = await res.json().catch(() => ({}));
  const user = data.user || {};

  setText("userEmail", user.email || "—");
  setText("streakValue", user.currentStreak ?? 0);
  setText("lastActive", `Last active: ${user.lastActiveDate || "—"}`);
  setText("levelValue", user.level ?? 1);
  setText("xpValue", `XP: ${user.totalXP ?? 0}`);

  renderProgress(user.totalXP ?? 0);

  setText(
    "counts",
    `${data.tracksCount ?? 0} tracks • ${data.sessionsCount ?? 0} sessions`
  );
}

/* ============================= */
/* Weekly Analytics */
/* ============================= */

async function loadWeeklyAnalytics() {
  const container = document.getElementById("weeklyStats");
  if (!container) return;

  container.innerHTML = `<div class="small">Loading weekly stats…</div>`;

  const res = await authFetch("/api/analytics/weekly");

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/";
    return;
  }

  const data = await res.json().catch(() => ({}));

  container.innerHTML = `
    <div class="item">
      <div>
        <strong>${data.sessionsThisWeek || 0} sessions</strong>
        <span class="small">${data.totalMinutes || 0} minutes this week</span>
      </div>
      <span class="pill">Sessions</span>
    </div>

    <div class="item">
      <div>
        <strong>${data.totalXP || 0} XP</strong>
        <span class="small">Earned this week</span>
      </div>
      <span class="pill">XP</span>
    </div>

    <div class="item">
      <div>
        <strong>${data.mostActiveTrack || "—"}</strong>
        <span class="small">Most active track</span>
      </div>
      <span class="pill">Focus</span>
    </div>
  `;
}

/* ============================= */
/* Weekly Insights (Zero-cost AI) */
/* ============================= */

async function loadWeeklyInsights() {
  const container = document.getElementById("insightsCard");
  if (!container) return;

  container.innerHTML = `<div class="small">Loading reflection…</div>`;

  const res = await authFetch("/api/insights/weekly");

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/";
    return;
  }

  const data = await res.json().catch(() => ({}));

  const headline = data.headline || "Weekly reflection";
  const insights = Array.isArray(data.insights) ? data.insights : [];
  const recommendation = data.recommendation || "";

  const topInsights = insights.slice(0, 4).map((t) => {
    const safe = String(t).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    return `
      <div class="item">
        <div>
          <span class="small">${safe}</span>
        </div>
        <span class="pill">Insight</span>
      </div>
    `;
  }).join("");

  container.innerHTML = `
    <div class="item">
      <div>
        <strong>${headline}</strong>
        <span class="small">Generated from your weekly activity</span>
      </div>
      <span class="pill">FocusLoop</span>
    </div>

    ${topInsights || `<div class="small">No insights yet.</div>`}

    ${recommendation ? `
      <div class="item">
        <div>
          <strong>Next step</strong>
          <span class="small">${recommendation}</span>
        </div>
        <span class="pill">Action</span>
      </div>
    ` : ""}
  `;
}

/* ============================= */
/* Tracks */
/* ============================= */

function trackCard(track) {
  const div = document.createElement("div");
  div.className = "item";

  div.innerHTML = `
    <div>
      <strong>${track.title}</strong>
      <span class="small">${track.targetPerWeek} / week • ${track.xpPerSession} XP</span>
    </div>
    <div class="actions">
      <button class="btnSm logBtn" data-id="${track._id}" data-min="10">+10m</button>
      <button class="btnSm logBtn" data-id="${track._id}" data-min="20">+20m</button>
      <button class="btnSm logBtn" data-id="${track._id}" data-min="30">+30m</button>
      <button class="btnSm deleteBtn" data-id="${track._id}">Delete</button>
    </div>
  `;

  return div;
}

/* ============================= */
/* Dark Mode */
/* ============================= */

const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  if (theme === "dark") document.body.classList.add("dark");
  else document.body.classList.remove("dark");

  // swap icon
  if (themeToggle) themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

themeToggle?.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark");
  const newTheme = isDark ? "light" : "dark";
  localStorage.setItem("theme", newTheme);
  applyTheme(newTheme);
});

async function loadTracks() {
  const list = document.getElementById("tracksList");
  if (!list) return;

  list.innerHTML = `<div class="small">Loading tracks…</div>`;

  const res = await authFetch("/api/tracks");
  const tracks = await res.json().catch(() => []);

  if (!tracks.length) {
    list.innerHTML = `<div class="small">No tracks yet. Create one.</div>`;
    return;
  }

  list.innerHTML = "";
  tracks.forEach((t) => list.appendChild(trackCard(t)));

  document.querySelectorAll(".logBtn").forEach((btn) => {
    btn.addEventListener("click", () =>
      logSession(btn.dataset.id, Number(btn.dataset.min))
    );
  });

  document.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this track?")) return;
      const deleted = await deleteTrack(btn.dataset.id);
      if (deleted) {
        await loadTracks();
        await loadStats();
        await loadWeeklyAnalytics();
        await loadWeeklyInsights();
        await loadSessions();
      }
    });
  });
}

async function deleteTrack(trackId) {
  const res = await authFetch(`/api/tracks/${trackId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    showToast("Delete failed");
    return false;
  }

  showToast("Track deleted");
  return true;
}

/* ============================= */
/* Log Session */
/* ============================= */

async function logSession(trackId, minutes) {
  const res = await authFetch("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ trackId, duration: minutes }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    showToast(data.message || "Log failed");
    return;
  }

  if (data.bonusXP && data.bonusXP > 0) {
    showToast(`Milestone! +${data.bonusXP} XP 🎉`);
  } else {
    showToast(`Logged ${minutes}m ✅`);
  }

  await loadStats();
  await loadWeeklyAnalytics();
  await loadWeeklyInsights();
  await loadSessions();
}

/* ============================= */
/* Sessions History */
/* ============================= */

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function sessionRow(s) {
  const div = document.createElement("div");
  div.className = "item";

  div.innerHTML = `
    <div>
      <strong>${s.track?.title || "Unknown track"}</strong>
      <span class="small">${s.duration} min • ${formatDate(s.completedAt)}</span>
    </div>
    <span class="pill">Session</span>
  `;

  return div;
}

async function loadSessions() {
  const list = document.getElementById("sessionsList");
  if (!list) return;

  list.innerHTML = `<div class="small">Loading sessions…</div>`;

  const res = await authFetch("/api/sessions");
  const sessions = await res.json().catch(() => []);

  if (!sessions.length) {
    list.innerHTML = `<div class="small">No sessions yet.</div>`;
    return;
  }

  list.innerHTML = "";
  sessions.forEach((s) => list.appendChild(sessionRow(s)));
}

/* ============================= */
/* Init */
/* ============================= */

async function init() {
  await loadStats();
  await loadWeeklyAnalytics();
  await loadWeeklyInsights();
  await loadTracks();
  await loadSessions();
}

init();