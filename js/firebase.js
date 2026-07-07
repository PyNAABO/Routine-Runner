import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  initializeFirestore,
  persistentLocalCache,
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { FIREBASE_CONFIG } from "./config.js";
import { appState, fb, display, inputs } from "./state.js";
import { showSyncStatus, showScreen } from "./utils.js";
import { applySettings } from "./settings.js";
import { saveStateToCloud } from "./cloud.js";
import {
  selectRoutineForToday,
  migrateToMultipleRoutines,
  getActiveRoutine,
  updateActiveRoutineDisplay,
} from "./routines.js";
import { parseAndRender } from "./renderer.js";
import { requestWakeLock } from "./media.js";

export { signInWithPopup, GoogleAuthProvider, signOut };

export function initFirebase(config) {
  try {
    fb.app = initializeApp(config);
    fb.auth = getAuth(fb.app);

    fb.db = initializeFirestore(fb.app, {
      localCache: persistentLocalCache(),
    });

    onAuthStateChanged(fb.auth, (u) => {
      if (u) {
        fb.user = u;
        document.getElementById("user-avatar").src = u.photoURL;
        display.userId.innerText = u.uid.substring(0, 8) + "...";
        initFirestoreListener();
        requestWakeLock();
      } else {
        showScreen("login");
      }
    });
  } catch (e) {
    console.error("Firebase init error", e);
    alert("Error initializing Firebase. Please check your configuration.");
  }
}

function initFirestoreListener() {
  if (!fb.user) return;
  const docRef = doc(fb.db, "users", fb.user.uid);
  showSyncStatus("Connecting...", "yellow");

  onSnapshot(
    docRef,
    (docSnap) => {
      showSyncStatus("Synced", "emerald");
      if (document.getElementById("app-screen").classList.contains("hidden")) {
        showScreen("app");
      }
      if (fb.isSaving) return;
      if (docSnap.exists()) {
        const data = docSnap.data();

        if (data.routines && data.routines.length > 0) {
          appState.routines = data.routines;
          appState.activeRoutineId = data.activeRoutineId || selectRoutineForToday();
        } else if (data.rawRoutine) {
          migrateToMultipleRoutines(data.rawRoutine);
        }

        const activeRoutine = getActiveRoutine();
        appState.rawRoutine = activeRoutine ? activeRoutine.content : "";

        appState.currentTaskIndex = data.currentTaskIndex || 0;
        appState.currentSubRoutineIndex = data.currentSubRoutineIndex || 0;
        appState.history = data.history || {};

        if (data.settings) {
          const localPrefs = {
            darkMode: appState.settings.darkMode,
            wakeLock: appState.settings.wakeLock,
          };
          appState.settings = {
            darkMode: localPrefs.darkMode,
            wakeLock: localPrefs.wakeLock,
            autoAdvance: false,
            prayerLocation: { latitude: null, longitude: null },
            ...data.settings,
          };
          applySettings();
          localStorage.setItem("rr_settings", JSON.stringify(appState.settings));
        }

        if (document.activeElement !== inputs.routine)
          inputs.routine.value = appState.rawRoutine;

        updateActiveRoutineDisplay();
        parseAndRender();
      } else if (appState.routines.length === 0) {
        migrateToMultipleRoutines("");
        document.getElementById("edit-view").classList.remove("translate-x-full");
      }
    },
    (error) => {
      showSyncStatus("Error!", "red");
    },
  );
}
