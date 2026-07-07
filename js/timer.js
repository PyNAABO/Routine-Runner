import { appState, display } from "./state.js";
import { updateTimerDisplay, triggerHaptic } from "./utils.js";
import { stopAlarm, sendNotification } from "./media.js";

let timerInterval;

export function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

export function setTimerInterval(fn, ms) {
  clearTimer();
  timerInterval = setInterval(fn, ms);
  return timerInterval;
}

export function setControlsState(enabled) {
  const doneBtn = document.getElementById("done-btn");
  const skipBtn = document.getElementById("skip-btn");
  if (enabled) {
    doneBtn.disabled = false; skipBtn.disabled = false;
    doneBtn.classList.remove("opacity-50", "cursor-not-allowed", "pointer-events-none");
    skipBtn.classList.remove("opacity-50", "cursor-not-allowed", "pointer-events-none");
  } else {
    doneBtn.disabled = true; skipBtn.disabled = true;
    doneBtn.classList.add("opacity-50", "cursor-not-allowed", "pointer-events-none");
    skipBtn.classList.add("opacity-50", "cursor-not-allowed", "pointer-events-none");
  }
}

export function startCountDown(seconds, onComplete) {
  display.timerBox.classList.remove("hidden");
  document.getElementById("timer-controls").classList.remove("hidden");
  let remaining = seconds;
  updateTimerDisplay(remaining);
  display.timerVal.classList.add("timer-running");
  clearTimer();
  timerInterval = setInterval(() => {
    if (!appState.isPaused) {
      remaining--;
      updateTimerDisplay(remaining);
      if (remaining <= 0) {
        clearTimer();
        display.timerVal.classList.remove("timer-running");
        sendNotification("Timer Done", "Time is up!");
        if (onComplete) onComplete();
        triggerHaptic("heavy");
      }
    }
  }, 1000);
}

export function togglePause() {
  appState.isPaused = !appState.isPaused;
  updatePauseBtn();
}

export function updatePauseBtn() {
  const btn = document.getElementById("pause-btn");
  if (!btn) return;
  if (appState.isPaused) {
    btn.innerHTML = '<i class="fas fa-play"></i>';
    display.timerVal.classList.add("opacity-50");
    display.timerVal.classList.remove("timer-running");
  } else {
    btn.innerHTML = '<i class="fas fa-pause"></i>';
    display.timerVal.classList.remove("opacity-50");
    display.timerVal.classList.add("timer-running");
  }
}

export function adjustTimer(secs) {
  stopAlarm();
  const parts = display.timerVal.innerText.split(":");
  let currentSecs = parts.length === 3
    ? parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
    : parseInt(parts[0]) * 60 + parseInt(parts[1]);
  const newSecs = Math.max(0, currentSecs + secs);
  if (newSecs > 0) {
    startCountDown(newSecs);
  } else {
    updateTimerDisplay(0);
  }
}
