export const fb = {
  app: null,
  auth: null,
  db: null,
  user: null,
  isSaving: false,
  isOnline: navigator.onLine,
};

export const screens = {
  login: document.getElementById("login-screen"),
  app: document.getElementById("app-screen"),
  skeleton: document.getElementById("skeleton-loader"),
};

export const views = {
  edit: document.getElementById("edit-view"),
  run: document.getElementById("run-view"),
  settings: document.getElementById("settings-view"),
  logs: document.getElementById("log-manager-modal"),
  manageRoutines: document.getElementById("manage-routines-view"),
  routineEditor: document.getElementById("routine-editor-modal"),
};

export const inputs = {
  routine: document.getElementById("routine-input"),
  logs: document.getElementById("logs-input"),
};

export const display = {
  taskCard: document.getElementById("task-card"),
  taskText: document.getElementById("task-text"),
  taskIcon: document.getElementById("task-icon"),
  nextTask: document.getElementById("next-task-text"),
  timerBox: document.getElementById("timer-display"),
  timerVal: document.getElementById("timer-val"),
  waitOverlay: document.getElementById("wait-overlay"),
  waitTarget: document.getElementById("wait-target-time"),
  waitCount: document.getElementById("wait-countdown"),
  globalProgress: document.getElementById("global-progress"),
  syncStatus: document.getElementById("sync-status"),
  syncIndicator: document.getElementById("sync-indicator"),
  userId: document.getElementById("user-id-display"),
  subRoutineIndicator: document.getElementById("sub-routine-indicator"),
  subRoutineParentTitle: document.getElementById("sub-routine-parent-title"),
  subRoutineCurrent: document.getElementById("sub-routine-current"),
  subRoutineTotal: document.getElementById("sub-routine-total"),
};

export const toggles = {
  theme: document.getElementById("theme-toggle"),
  autoAdvance: document.getElementById("auto-advance-toggle"),
  wakeLock: document.getElementById("wake-lock-toggle"),
};

export const appState = {
  routines: [],
  activeRoutineId: null,
  rawRoutine: "",
  currentTaskIndex: 0,
  currentSubRoutineIndex: 0,
  tasks: [],
  history: {},
  settings: {
    darkMode: true,
    autoAdvance: false,
    wakeLock: true,
    prayerLocation: { latitude: null, longitude: null },
  },
  prayerTimes: null,
  prayerTimesDate: null,
  isPaused: false,
  celebrationShown: false,
  queue: [],
  quickTasks: [],
  currentQueueIndex: 0,
  pendingInterval: null,
  queueLastBuiltDate: null,
};
