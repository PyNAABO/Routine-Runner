import { appState, display } from "./state.js";
import { ALARM_FILE } from "./config.js";

let wakeLock;
let audioUnlocked = false;

const alarmAudio = new Audio(ALARM_FILE);
alarmAudio.loop = true;
alarmAudio.volume = 1.0;

export { alarmAudio };

export function startAlarmLoop() {
  alarmAudio.currentTime = 0;
  alarmAudio.play().catch((e) => {
    console.warn("Alarm play failed:", e.message);
    display.timerVal.classList.add("alarm-pulse");
  });
}

export function stopAlarm() {
  alarmAudio.pause();
  alarmAudio.currentTime = 0;
  display.timerVal.classList.remove("alarm-pulse");
}

export function unlockAudio() {
  if (audioUnlocked) return;
  alarmAudio
    .play()
    .then(() => {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
      audioUnlocked = true;
      console.log("Audio unlocked successfully");
    })
    .catch((e) => {
      console.warn("Audio unlock failed:", e.message);
    });
}

export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
}

export function sendNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "assets/RR.png" });
    } catch (e) {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.showNotification(title, {
              body,
              icon: "assets/RR.png",
              vibrate: [200, 100, 200],
            });
          })
          .catch(() => {});
      }
    }
  }
}

const wakeLockHandler = async () => {
  if (
    document.visibilityState === "visible" &&
    appState.settings.wakeLock &&
    (!wakeLock || wakeLock.released)
  ) {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
    } catch (err) {}
  }
};

export async function requestWakeLock() {
  if (!appState.settings.wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    document.addEventListener("visibilitychange", wakeLockHandler);
  } catch (err) {}
}

export async function releaseWakeLock() {
  document.removeEventListener("visibilitychange", wakeLockHandler);
  if (wakeLock && typeof wakeLock.release === "function") {
    try {
      await wakeLock.release();
      wakeLock = null;
    } catch (err) {
      console.warn("Wake Lock release failed:", err.message);
    }
  }
}
