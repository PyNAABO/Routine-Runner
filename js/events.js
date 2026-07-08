import { appState, fb, views, inputs, display, toggles } from "./state.js";
import { triggerHaptic, isModalOpen } from "./utils.js";
import { saveStateToCloud } from "./cloud.js";
import { applySettings } from "./settings.js";
import { signInWithPopup, signInAnonymously, GoogleAuthProvider, signOut } from "./firebase.js";
import {
  renderRoutineList,
  openRoutineEditor,
  closeRoutineEditor,
  saveRoutineFromEditor,
  deleteRoutine,
  getActiveRoutine,
  getEditingRoutineId,
  showConditionSelector,
  loadExampleRoutine,
} from "./routines.js";
import { parseAndRender, logTask } from "./renderer.js";
import { fetchPrayerTimes, validatePrayerName, savePrayerLocation } from "./prayer.js";
import { setControlsState, clearTimer, togglePause } from "./timer.js";
import { stopAlarm, requestWakeLock, releaseWakeLock } from "./media.js";
import {
  getCurrentTask,
  completeCurrentTask,
  skipCurrentTask,
  undoLastTask,
  snoozeTask,
  rescheduleToDate,
  resetQueue,
  openQueuePanel,
  closeQueuePanel,
  showQuickAddForm,
  hideQuickAddForm,
  submitQuickAdd,
  showRescheduleDialog,
  hideRescheduleDialog,
  renderQueueList,
  getPendingTasks,
} from "./queue.js";

const onClick = (id, fn) => {
  const el = document.getElementById(id);
  if (el) {
    el.onclick = (e) => {
      triggerHaptic("light");
      fn(e);
    };
  }
};

export function setupEventListeners() {
  // NAV
  onClick("settings-btn", () => views.settings.classList.remove("translate-x-full"));
  onClick("close-settings-btn", () => views.settings.classList.add("translate-x-full"));
  onClick("home-logo-btn", () => {
    views.settings.classList.add("translate-x-full");
    views.edit.classList.add("translate-x-full");
  });

  // EDIT ROUTINE
  onClick("edit-routine-btn", () => {
    views.settings.classList.add("translate-x-full");
    views.edit.classList.remove("translate-x-full");
  });
  onClick("close-edit-btn", () => views.edit.classList.add("translate-x-full"));

  // MANAGE ROUTINES
  onClick("manage-routines-btn", () => {
    views.settings.classList.add("translate-x-full");
    renderRoutineList();
    document.getElementById("manage-routines-view").classList.remove("translate-x-full");
  });
  onClick("close-manage-routines-btn", () => {
    document.getElementById("manage-routines-view").classList.add("translate-x-full");
  });
        onClick("add-routine-btn", () => openRoutineEditor(null));
        onClick("load-example-btn", () => { loadExampleRoutine(); triggerHaptic("success"); });

  // ROUTINE EDITOR
  onClick("close-routine-editor-btn", closeRoutineEditor);
  onClick("cancel-routine-editor-btn", closeRoutineEditor);
  onClick("save-routine-editor-btn", saveRoutineFromEditor);
  onClick("delete-routine-btn", () => {
    const id = getEditingRoutineId();
    if (id && confirm("Are you sure you want to delete this routine?")) {
      deleteRoutine(id);
    }
  });

  // Condition type change
  const conditionTypeSelect = document.getElementById("routine-condition-type");
  if (conditionTypeSelect) {
    conditionTypeSelect.onchange = (e) => showConditionSelector(e.target.value);
  }

  // KEYBOARD SHORTCUTS
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      if (e.key === "Escape") e.target.blur();
      return;
    }
    if (e.key === "Escape") {
      views.settings.classList.add("translate-x-full");
      views.edit.classList.add("translate-x-full");
      views.manageRoutines.classList.add("translate-x-full");
      views.routineEditor.classList.add("hidden");
      views.logs.classList.add("hidden");
      document.getElementById("quick-edit-modal").classList.add("hidden");
      document.getElementById("quick-add-modal").classList.add("hidden");
      document.getElementById("reschedule-modal").classList.add("hidden");
      closeQueuePanel();
      return;
    }
    if (isModalOpen()) return;
    switch (e.key.toLowerCase()) {
      case " ": e.preventDefault(); document.getElementById("done-btn")?.click(); break;
      case "s": e.preventDefault(); document.getElementById("skip-btn")?.click(); break;
      case "u": e.preventDefault(); document.getElementById("undo-btn")?.click(); break;
      case "p": e.preventDefault(); document.getElementById("pause-btn")?.click(); break;
    }
  });

  // Weekday buttons toggle
  document.querySelectorAll(".weekday-btn").forEach((btn) => {
    btn.onclick = () => {
      btn.classList.toggle("bg-blue-600");
      btn.classList.toggle("bg-slate-700");
    };
  });

  // LOGS
  onClick("manage-logs-btn", () => {
    inputs.logs.value = JSON.stringify(appState.history, null, 2);
    views.logs.classList.remove("hidden");
  });
  onClick("close-logs-btn", () => views.logs.classList.add("hidden"));
  onClick("copy-logs-btn", () => {
    navigator.clipboard.writeText(inputs.logs.value);
    alert("Logs copied to clipboard!");
  });
  onClick("download-logs-btn", () => {
    const blob = new Blob([inputs.logs.value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rr-logs-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  });
  onClick("save-logs-btn", () => {
    try {
      appState.history = JSON.parse(inputs.logs.value);
      saveStateToCloud();
      views.logs.classList.add("hidden");
    } catch (e) {
      alert("Invalid JSON format. Cannot save.");
    }
  });

  // ACTIONS
  onClick("save-routine-btn", () => {
    appState.rawRoutine = inputs.routine.value;

    const prayerMatches = appState.rawRoutine.matchAll(/\[(@|=>)Prayer:(\w+)\]/gi);
    const invalidPrayers = [];
    for (const match of prayerMatches) {
      if (!validatePrayerName(match[2])) invalidPrayers.push(match[2]);
    }
    if (invalidPrayers.length > 0) {
      const uniqueInvalid = [...new Set(invalidPrayers)];
      if (!confirm(`Invalid prayer name(s): ${uniqueInvalid.join(", ")}\n\nValid prayer names: Fajr, Dhuhr, Asr, Maghrib, Isha\n\nDo you want to save anyway?`)) return;
    }

    const activeRoutine = getActiveRoutine();
    if (activeRoutine) activeRoutine.content = appState.rawRoutine;

    appState.currentTaskIndex = 0;
    appState.currentSubRoutineIndex = 0;
    appState.currentQueueIndex = 0;
    appState.celebrationShown = false;
    appState.queue = [];
    saveStateToCloud();
    views.edit.classList.add("translate-x-full");
    parseAndRender();
  });

  onClick("done-btn", () => {
    logTask("done");
    triggerHaptic("medium");
    completeCurrentTask();
    parseAndRender();
  });

  onClick("skip-btn", () => {
    const task = getCurrentTask();
    if (task && task.source === "quick") {
      showRescheduleDialog();
      return;
    }
    logTask("skipped");
    triggerHaptic("medium");
    skipCurrentTask();
    parseAndRender();
  });

  onClick("undo-btn", () => {
    const task = getCurrentTask();
    if (task && task.isSubRoutineParent && task.subRoutines.length > 0 && appState.currentSubRoutineIndex > 0 && task.source === "routine") {
      appState.currentSubRoutineIndex--;
    } else if (appState.currentQueueIndex > 0) {
      undoLastTask();
    }
    parseAndRender();
  });

  onClick("refresh-btn", () => location.reload());
  onClick("reset-day-btn", () => {
    if (confirm("Restart day?")) {
      appState.currentTaskIndex = 0;
      appState.currentSubRoutineIndex = 0;
      appState.celebrationShown = false;
      resetQueue();
      parseAndRender();
      views.settings.classList.add("translate-x-full");
    }
  });
  onClick("force-start-btn", () => {
    display.waitOverlay.classList.add("hidden");
    setControlsState(true);
    stopAlarm();
    clearTimer();
  });
  onClick("pause-btn", togglePause);

  // SETTINGS
  toggles.theme.addEventListener("change", (e) => {
    appState.settings.darkMode = e.target.checked;
    applySettings();
    saveStateToCloud();
  });
  toggles.autoAdvance.addEventListener("change", (e) => {
    appState.settings.autoAdvance = e.target.checked;
    saveStateToCloud();
  });
  toggles.wakeLock.addEventListener("change", (e) => {
    appState.settings.wakeLock = e.target.checked;
    if (appState.settings.wakeLock) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    saveStateToCloud();
  });

  // PRAYER SETTINGS
  onClick("save-prayer-location-btn", () => {
    const latInput = document.getElementById("prayer-latitude");
    const lonInput = document.getElementById("prayer-longitude");
    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);

    if (isNaN(lat) || isNaN(lon)) { alert("Please enter valid latitude and longitude values."); return; }
    if (lat < -90 || lat > 90) { alert("Latitude must be between -90 and 90."); return; }
    if (lon < -180 || lon > 180) { alert("Longitude must be between -180 and 180."); return; }

    appState.settings.prayerLocation = { latitude: lat, longitude: lon };
    savePrayerLocation();
    appState.prayerTimes = null;
    appState.prayerTimesDate = null;
    fetchPrayerTimes()
      .then(() => alert("Prayer location saved! Prayer times updated."))
      .catch(() => alert("Location saved, but failed to fetch prayer times. Please check your internet connection."));
  });

  onClick("get-location-btn", async () => {
    if (!navigator.geolocation) { alert("Geolocation is not supported by your browser."); return; }
    const btn = document.getElementById("get-location-btn");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true });
      });
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      document.getElementById("prayer-latitude").value = lat.toFixed(7);
      document.getElementById("prayer-longitude").value = lon.toFixed(7);
      appState.settings.prayerLocation = { latitude: lat, longitude: lon };
      savePrayerLocation();
      appState.prayerTimes = null;
      appState.prayerTimesDate = null;
      await fetchPrayerTimes();
      alert("Location obtained from GPS! Prayer times updated.");
    } catch (error) {
      alert("Failed to get location: " + (error.message || "Permission denied or timeout"));
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });

  // AUTH
  const disconnectHandler = () => {
    if (confirm("Sign out?")) {
      signOut(fb.auth).then(() => location.reload());
    }
  };
  onClick("login-reset-btn", disconnectHandler);
  onClick("settings-disconnect-btn", disconnectHandler);
  onClick("google-login-btn", () =>
    signInWithPopup(fb.auth, new GoogleAuthProvider()).catch((e) => alert(e.message)),
  );
  onClick("guest-login-btn", async () => {
    const btn = document.getElementById("guest-login-btn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    try {
      await signInAnonymously(fb.auth);
    } catch (e) {
      if (e.code === "auth/operation-not-allowed") {
        alert("Anonymous auth is not enabled. Go to Firebase Console → Authentication → Sign-in method → enable Anonymous.");
      } else {
        alert(e.message);
      }
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-secret text-amber-400"></i> Continue as Guest';
    }
  });
  onClick("settings-logout-btn", () => {
    if (confirm("Sign out?")) signOut(fb.auth);
  });

  // QUICK EDIT
  onClick("quick-edit-btn", () => {
    const task = getCurrentTask();
    if (task && task.source === "routine") {
      document.getElementById("quick-edit-input").value = task.raw;
      const isConditional = /^IF:/i.test(task.raw.trim());
      document.getElementById("quick-edit-warning").classList.toggle("hidden", !isConditional);
      document.getElementById("quick-edit-modal").classList.remove("hidden");
    }
  });
  onClick("cancel-quick-edit", () =>
    document.getElementById("quick-edit-modal").classList.add("hidden"),
  );
  onClick("save-quick-edit", () => {
    const newVal = document.getElementById("quick-edit-input").value;
    const task = getCurrentTask();
    if (!task || task.source !== "routine") return;
    const taskID = task.id;
    const lines = appState.rawRoutine.split("\n");
    const routineIdx = parseInt(taskID.replace("routine-", ""));
    if (!isNaN(routineIdx) && lines[routineIdx] !== undefined) {
      lines[routineIdx] = newVal;
      appState.rawRoutine = lines.join("\n");
      const activeRoutine = getActiveRoutine();
      if (activeRoutine) activeRoutine.content = appState.rawRoutine;
      appState.queue = [];
      saveStateToCloud();
      document.getElementById("quick-edit-modal").classList.add("hidden");
      parseAndRender();
    }
  });

  // QUEUE PANEL
  onClick("queue-btn", openQueuePanel);
  onClick("queue-overlay", closeQueuePanel);
  onClick("close-queue-btn", closeQueuePanel);

  // QUICK ADD
  onClick("quick-add-open-btn", showQuickAddForm);
  onClick("cancel-quick-add-btn", hideQuickAddForm);
  onClick("submit-quick-add-btn", submitQuickAdd);

  // RESCHEDULE DIALOG
  onClick("cancel-reschedule-btn", hideRescheduleDialog);
  onClick("reschedule-snooze-15", () => {
    snoozeTask(Date.now() + 15 * 60 * 1000);
    hideRescheduleDialog();
    parseAndRender();
  });
  onClick("reschedule-snooze-30", () => {
    snoozeTask(Date.now() + 30 * 60 * 1000);
    hideRescheduleDialog();
    parseAndRender();
  });
  onClick("reschedule-snooze-60", () => {
    snoozeTask(Date.now() + 60 * 60 * 1000);
    hideRescheduleDialog();
    parseAndRender();
  });
  onClick("reschedule-tomorrow", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.getFullYear() + "-" +
      String(tomorrow.getMonth() + 1).padStart(2, "0") + "-" +
      String(tomorrow.getDate()).padStart(2, "0");
    rescheduleToDate(dateStr);
    hideRescheduleDialog();
    parseAndRender();
  });
  onClick("reschedule-at-time-btn", () => {
    const timeInput = document.getElementById("reschedule-time-input");
    if (!timeInput || !timeInput.value) return;
    const parts = timeInput.value.split(":");
    if (parts.length !== 2) return;
    const h = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    if (isNaN(h) || isNaN(m)) return;
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= new Date()) target.setDate(target.getDate() + 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    if (target >= tomorrow) {
      const dateStr = target.getFullYear() + "-" +
        String(target.getMonth() + 1).padStart(2, "0") + "-" +
        String(target.getDate()).padStart(2, "0");
      rescheduleToDate(dateStr);
    } else {
      snoozeTask(target.getTime());
    }
    hideRescheduleDialog();
    parseAndRender();
  });

  // RESET QUEUE
  onClick("reset-queue-btn", () => {
    if (confirm("Remove all quick tasks and reset to original routine order?")) {
      resetQueue();
      parseAndRender();
      closeQueuePanel();
    }
  });
}
