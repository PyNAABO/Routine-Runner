import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { appState, fb } from "./state.js";
import { showSyncStatus } from "./utils.js";

export async function saveStateToCloud() {
  localStorage.setItem("rr_settings", JSON.stringify(appState.settings));
  if (!fb.user) return;
  fb.isSaving = true;
  showSyncStatus("Saving...", "blue");
  try {
    const data = {
      routines: appState.routines,
      activeRoutineId: appState.activeRoutineId,
      rawRoutine: appState.rawRoutine,
      currentTaskIndex: appState.currentTaskIndex,
      currentSubRoutineIndex: appState.currentSubRoutineIndex,
      history: appState.history,
      settings: appState.settings,
      queue: appState.queue,
      quickTasks: appState.quickTasks,
      currentQueueIndex: appState.currentQueueIndex,
      queueLastBuiltDate: appState.queueLastBuiltDate,
      lastUpdated: Date.now(),
    };
    await setDoc(doc(fb.db, "users", fb.user.uid), data, { merge: true });
    showSyncStatus("Synced", "emerald");
  } catch (e) {
    showSyncStatus("Error!", "red");
  } finally {
    fb.isSaving = false;
  }
}
