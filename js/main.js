import { appState, fb } from "./state.js";
import { applySettings } from "./settings.js";
import { initFirebase } from "./firebase.js";
import { FIREBASE_CONFIG } from "./config.js";
import { loadPrayerLocation, fetchPrayerTimes } from "./prayer.js";
import { setupEventListeners } from "./events.js";
import { unlockAudio } from "./media.js";
import { adjustTimer } from "./timer.js";

function init() {
  if ("serviceWorker" in navigator &&
      (location.protocol === "http:" || location.protocol === "https:")) {
    navigator.serviceWorker.register("sw.js").then((reg) => {
      reg.update();
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        location.reload();
      });
    }).catch(console.error);
  }

  window.addEventListener("online", () => { fb.isOnline = true; });
  window.addEventListener("offline", () => { fb.isOnline = false; });

  const requestNotifOnce = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    document.removeEventListener("click", requestNotifOnce);
    document.removeEventListener("touchstart", requestNotifOnce);
    document.removeEventListener("keydown", requestNotifOnce);
  };
  document.addEventListener("click", requestNotifOnce, { once: true });
  document.addEventListener("touchstart", requestNotifOnce, { once: true });
  document.addEventListener("keydown", requestNotifOnce, { once: true });

  const savedSettings = localStorage.getItem("rr_settings");
  if (savedSettings) {
    try {
      appState.settings = { ...appState.settings, ...JSON.parse(savedSettings) };
    } catch (e) {
      console.error("Failed to parse local settings, using defaults:", e);
    }
  }
  applySettings();
  loadPrayerLocation();
  if (appState.settings.prayerLocation.latitude && appState.settings.prayerLocation.longitude) {
    fetchPrayerTimes();
  }

  initFirebase(FIREBASE_CONFIG);
  setupEventListeners();
}

// Audio unlock on first interaction
document.addEventListener("click", unlockAudio, { once: false });
document.addEventListener("touchstart", unlockAudio, { once: false });
document.addEventListener("keydown", unlockAudio, { once: false });

// Global adjustTimer for HTML onclick
window.adjustTimer = adjustTimer;

window.addEventListener("load", init);
