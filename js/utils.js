import { display, appState, screens, views } from "./state.js";

export function triggerHaptic(type) {
  if (!navigator.vibrate) return;
  switch (type) {
    case "light": navigator.vibrate(10); break;
    case "medium": navigator.vibrate(50); break;
    case "heavy": navigator.vibrate([200, 100, 200]); break;
    case "success": navigator.vibrate([50, 50, 50]); break;
  }
}

export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function safeAsync(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error("Error in async handler:", err);
      showSyncStatus("Error!", "red");
    }
  };
}

export function isModalOpen() {
  return (
    !views.settings.classList.contains("translate-x-full") ||
    !views.edit.classList.contains("translate-x-full") ||
    !views.manageRoutines.classList.contains("translate-x-full") ||
    !views.routineEditor.classList.contains("hidden") ||
    !views.logs.classList.contains("hidden") ||
    !document.getElementById("quick-edit-modal").classList.contains("hidden")
  );
}

export function showSyncStatus(msg, color) {
  display.syncStatus.innerText =
    msg === "Synced"
      ? `Synced ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : msg;
  display.syncIndicator.className = `w-2 h-2 rounded-full mr-2 transition-colors duration-300 ${
    color === "emerald" ? "bg-emerald-500"
    : color === "yellow" ? "bg-yellow-500"
    : color === "red" ? "bg-red-500"
    : "bg-blue-500"
  }`;
}

export function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export function getNextOccurrence(timeStr) {
  if (!timeStr || typeof timeStr !== "string") {
    console.warn("Invalid time string:", timeStr);
    return new Date();
  }
  const parts = timeStr.split(":");
  if (parts.length !== 2) {
    console.warn("Invalid time format:", timeStr);
    return new Date();
  }
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    console.warn("Invalid time values:", timeStr);
    return new Date();
  }
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export function updateTimerDisplay(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  display.timerVal.innerText = `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
