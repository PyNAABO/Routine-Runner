import { appState, toggles } from "./state.js";
import { requestWakeLock, releaseWakeLock } from "./media.js";

export function applySettings() {
  if (appState.settings.darkMode) {
    document.body.classList.remove("light-mode");
    document.getElementById("theme-color-meta").content = "#0f172a";
  } else {
    document.body.classList.add("light-mode");
    document.getElementById("theme-color-meta").content = "#f0f4f8";
  }
  toggles.theme.checked = appState.settings.darkMode;
  toggles.autoAdvance.checked = appState.settings.autoAdvance;
  toggles.wakeLock.checked = appState.settings.wakeLock !== false;

  if (appState.settings.wakeLock !== false) {
    requestWakeLock();
  } else {
    releaseWakeLock();
  }
}
