const token = localStorage.getItem("token");
if (!token) window.location.href = "/auth";

let toastTimer;
let editingTrackId = null;

const trackModal = document.getElementById("trackModal");
const settingsModal = document.getElementById("settingsModal");
const saveTrackBtn = document.getElementById("saveTrackBtn");

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

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
  document.getElementById("themeSelect").value = theme;
}

function initialFromName(name = "A") {
  return name.trim().charAt(0).toUpperCase() || "A";
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function progress(totalXP) {
  const xpIntoLevel = totalXP % 100;
  const pct = Math.max(0, Math.min((xpIntoLevel / 100) * 100, 100));
  document.getElementById("xpBar").style.width = `${pct}%`;
  setText("xpToNext", `${100 - xpIntoLevel} XP to next level`);
}

function openTrackModal(track = null) {
  editingTrackId = track?._id || null;
  document.getElementById("trackModalTitle").textContent = editingTrackId ? "Edit track" : "New track";
  saveTrackBtn.textContent = editingTrackId ? "Save changes" : "Save track";
  document.getElementById("trackTitle").value = track?.title || "";
  document.getElementById("trackTarget").value = track?.targetPerWeek || "";
  document.getElementById("trackXP").value = track?.xpPerSession || "";
  document.getElementById("trackAccent").value = track?.accent || "indigo";
  trackModal.classList.remove("hidden");
}

function closeTrackModal() {
  editingTrackId = null;
  trackModal.classList.add("hidden");
}

function openSettings() {
  settingsModal.classList.remove("hidden");
}

function closeSettings() {
  settingsModal.classList.add("hidden");
}

async function loadProfile() {
  const res = await authFetch("/api/profile/me");
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/auth";
    return;
  }

  const user = await res.json();
  setText("profileName", user.displayName || "Alex");
  setText("profileEmail", user.email || "—");
  setText("profileInitial", initialFromName(user.displayName));
  setText("userEmail", user.email || "—");
  setText("welcomeTitle", `${user.displayName || "Alex"}, keep the streak alive.`);
  document.getElementById("displayNameInput").value = user.displayName || "";

  const preferredTheme = localStorage.getItem("theme") || user.theme || "light";
  applyTheme(preferredTheme);
}

async function loadStats() {
  const res = await authFetch("/api/stats");
  const data = await res.json().catch(() => ({}));
  const user = data.user || {};

  setText("streakValue", user.currentStreak ?? 0);
  setText("lastActive", `Last active: ${user.lastActiveDate || "—"}`);
  setText("levelValue", user.level ?? 1);
  setText("xpValue", `XP: ${user.totalXP ?? 0}`);
  setText("counts", `${data.tracksCount ?? 0} tracks • ${data.sessionsCount ?? 0} sessions`);
  progress(user.totalXP ?? 0);
}

async function loadWeeklyAnalytics() {
  const container = document.getElementById("weeklyStats");
  const res = await authFetch("/api/analytics/weekly");
  const data = await res.json().catch(() => ({}));

  setText("weeklyMinutes", data.totalMinutes || 0);
  setText("weeklySessions", data.sessionsThisWeek || 0);

  container.innerHTML = `
    <div class="rowCard">
      <div>
        <strong>${data.sessionsThisWeek || 0} sessions</strong>
        <div class="small">${data.totalMinutes || 0} minutes invested this week</div>
      </div>
      <span class="miniBadge">Sessions</span>
    </div>
    <div class="rowCard">
      <div>
        <strong>${data.totalXP || 0} XP earned</strong>
        <div class="small">Most active track: ${data.mostActiveTrack || "—"}</div>
      </div>
      <span class="miniBadge">Momentum</span>
    </div>
    <div class="rowCard">
      <div>
        <strong>${data.currentStreak || 0}-day streak</strong>
        <div class="small">Consistency compounds faster than intensity.</div>
      </div>
      <span class="miniBadge">Streak</span>
    </div>
  `;
}

async function loadInsights() {
  const container = document.getElementById("insightsCard");
  const res = await authFetch("/api/insights/weekly");
  const data = await res.json().catch(() => ({}));

  const insights = Array.isArray(data.insights) ? data.insights.slice(0, 4) : [];

  container.innerHTML = `
    <div class="rowCard">
      <div>
        <strong>${data.headline || "Weekly reflection"}</strong>
        <div class="small">Generated from your current activity pattern.</div>
      </div>
      <span class="miniBadge">Insight</span>
    </div>
    ${insights.map((item) => `
      <div class="rowCard">
        <div class="small">${item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
        <span class="miniBadge">Note</span>
      </div>
    `).join("")}
    <div class="rowCard">
      <div>
        <strong>Next step</strong>
        <div class="small">${data.recommendation || "Keep tomorrow friction-light with one easy session."}</div>
      </div>
      <span class="miniBadge">Action</span>
    </div>
  `;
}

function accentColor(accent) {
  switch (accent) {
    case "emerald": return "#10b981";
    case "amber": return "#f59e0b";
    case "rose": return "#f43f5e";
    default: return "#6366f1";
  }
}

function trackRow(track) {
  const wrapper = document.createElement("div");
  wrapper.className = "rowCard";
  wrapper.innerHTML = `
    <div class="stack gap12">
      <div class="trackTitleRow">
        <span class="trackDot" style="background:${accentColor(track.accent)}"></span>
        <div>
          <strong>${track.title}</strong>
          <div class="small">A focused lane for steady progress.</div>
        </div>
      </div>
      <div class="trackMeta">
        <span class="miniBadge">${track.targetPerWeek}/week</span>
        <span class="miniBadge">${track.xpPerSession} XP</span>
      </div>
    </div>
    <div class="trackActions">
      <button class="actionChip logBtn" data-id="${track._id}" data-min="10">+10m</button>
      <button class="actionChip logBtn" data-id="${track._id}" data-min="20">+20m</button>
      <button class="actionChip logBtn" data-id="${track._id}" data-min="30">+30m</button>
      <button class="actionChip editBtn" data-id="${track._id}">Edit</button>
      <button class="actionChip actionDanger deleteBtn" data-id="${track._id}">Delete</button>
    </div>
  `;
  return wrapper;
}

async function loadTracks() {
  const list = document.getElementById("tracksList");
  const res = await authFetch("/api/tracks");
  const tracks = await res.json().catch(() => []);

  if (!tracks.length) {
    list.innerHTML = `<div class="rowCard"><div><strong>No tracks yet</strong><div class="small">Start with one habit lane and keep it lightweight.</div></div></div>`;
    return;
  }

  list.innerHTML = "";
  tracks.forEach((track) => list.appendChild(trackRow(track)));

  document.querySelectorAll(".logBtn").forEach((button) => {
    button.addEventListener("click", () => logSession(button.dataset.id, Number(button.dataset.min)));
  });

  document.querySelectorAll(".editBtn").forEach((button) => {
    button.addEventListener("click", () => {
      const track = tracks.find((item) => item._id === button.dataset.id);
      if (track) openTrackModal(track);
    });
  });

  document.querySelectorAll(".deleteBtn").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Delete this track?")) return;
      const resDelete = await authFetch(`/api/tracks/${button.dataset.id}`, { method: "DELETE" });
      if (!resDelete.ok) {
        showToast("Delete failed");
        return;
      }
      showToast("Track deleted");
      await init();
    });
  });
}

function sessionRow(session) {
  const row = document.createElement("div");
  row.className = "rowCard";
  const date = new Date(session.completedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  row.innerHTML = `
    <div>
      <strong>${session.track?.title || "Unknown track"}</strong>
      <div class="small">${session.duration || 0} minutes • ${date}</div>
    </div>
    <span class="miniBadge">Session</span>
  `;
  return row;
}

async function loadSessions() {
  const list = document.getElementById("sessionsList");
  const res = await authFetch("/api/sessions");
  const sessions = await res.json().catch(() => []);

  if (!sessions.length) {
    list.innerHTML = `<div class="rowCard"><div><strong>No sessions yet</strong><div class="small">Log one session to activate the loop.</div></div></div>`;
    return;
  }

  list.innerHTML = "";
  sessions.forEach((session) => list.appendChild(sessionRow(session)));
}

async function logSession(trackId, minutes) {
  const res = await authFetch("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ trackId, duration: minutes }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    showToast(data.message || "Could not log session");
    return;
  }

  if (data.bonusXP && data.bonusXP > 0) {
    showToast(`Milestone! +${data.bonusXP} XP`);
  } else {
    showToast(`Logged ${minutes}m`);
  }

  await init();
}

async function saveTrack() {
  const title = document.getElementById("trackTitle").value.trim();
  const targetPerWeek = Number(document.getElementById("trackTarget").value) || 3;
  const xpPerSession = Number(document.getElementById("trackXP").value) || 10;
  const accent = document.getElementById("trackAccent").value;

  if (!title) {
    showToast("Track title required");
    return;
  }

  const url = editingTrackId ? `/api/tracks/${editingTrackId}` : "/api/tracks";
  const method = editingTrackId ? "PATCH" : "POST";

  const res = await authFetch(url, {
    method,
    body: JSON.stringify({ title, targetPerWeek, xpPerSession, accent }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    showToast(data.message || "Track save failed");
    return;
  }

  closeTrackModal();
  showToast(editingTrackId ? "Track updated" : "Track created");
  await init();
}

async function saveSettings() {
  const displayName = document.getElementById("displayNameInput").value.trim();
  const theme = document.getElementById("themeSelect").value;

  const res = await authFetch("/api/profile/me", {
    method: "PATCH",
    body: JSON.stringify({ displayName, theme }),
  });

  if (!res.ok) {
    showToast("Settings failed to save");
    return;
  }

  applyTheme(theme);
  closeSettings();
  showToast("Settings saved");
  await loadProfile();
}

async function init() {
  await loadProfile();
  await loadStats();
  await loadWeeklyAnalytics();
  await loadInsights();
  await loadTracks();
  await loadSessions();
}

document.getElementById("themeToggle")?.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(nextTheme);
  document.getElementById("themeSelect").value = nextTheme;
});

document.getElementById("newTrackBtn")?.addEventListener("click", () => openTrackModal());
document.getElementById("cancelTrack")?.addEventListener("click", closeTrackModal);
document.getElementById("saveTrackBtn")?.addEventListener("click", saveTrack);
document.getElementById("openSettingsBtn")?.addEventListener("click", openSettings);
document.getElementById("closeSettingsBtn")?.addEventListener("click", closeSettings);
document.getElementById("saveSettingsBtn")?.addEventListener("click", saveSettings);
document.getElementById("refreshBtn")?.addEventListener("click", init);
document.getElementById("refreshInsightsBtn")?.addEventListener("click", loadInsights);
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "/auth";
});

trackModal?.addEventListener("click", (event) => {
  if (event.target === trackModal) closeTrackModal();
});
settingsModal?.addEventListener("click", (event) => {
  if (event.target === settingsModal) closeSettings();
});

document.addEventListener("DOMContentLoaded", init);
