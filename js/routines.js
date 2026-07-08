import { appState } from "./state.js";
import { escapeHtml } from "./utils.js";
import { saveStateToCloud } from "./cloud.js";
import { parseRoutine } from "./parser.js";
import { VALID_PRAYER_NAMES, EXAMPLE_ROUTINE } from "./config.js";
import { validatePrayerName } from "./prayer.js";
import { parseAndRender } from "./renderer.js";

let editingRoutineId = null;
export function setEditingRoutineId(id) { editingRoutineId = id; }
export function getEditingRoutineId() { return editingRoutineId; }

export function generateUUID() {
  return "routine-" + Date.now() + "-" + Math.random().toString(36).substring(2, 11);
}

export function getActiveRoutine() {
  return appState.routines.find((r) => r.id === appState.activeRoutineId) || appState.routines[0];
}

export function migrateToMultipleRoutines(rawRoutine) {
  const content = rawRoutine || EXAMPLE_ROUTINE;
  const defaultRoutine = {
    id: generateUUID(),
    name: "Daily Routine",
    content,
    isDefault: true,
    conditions: null,
  };
  appState.routines = [defaultRoutine];
  appState.activeRoutineId = defaultRoutine.id;
  appState.rawRoutine = content;
  saveStateToCloud();
}

function matchesCondition(conditions, date) {
  if (!conditions) return false;
  const dayOfWeek = date.getDay();
  const dateOfMonth = date.getDate();
  switch (conditions.type) {
    case "weekday": return conditions.weekdays && conditions.weekdays.includes(dayOfWeek);
    case "date": return conditions.dates && conditions.dates.includes(dateOfMonth);
    case "pattern": return matchesPattern(conditions.pattern, date);
    case "manual": return false;
    default: return false;
  }
}

function matchesPattern(pattern, date) {
  if (!pattern) return false;
  const [position, dayName] = pattern.split("-");
  const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const targetDay = dayMap[dayName];
  if (targetDay === undefined) return false;
  if (date.getDay() !== targetDay) return false;
  const dateOfMonth = date.getDate();
  if (position === "first") return dateOfMonth <= 7;
  if (position === "last") {
    const nextWeek = new Date(date);
    nextWeek.setDate(dateOfMonth + 7);
    return nextWeek.getMonth() !== date.getMonth();
  }
  return false;
}

export function selectRoutineForToday() {
  const today = new Date();
  for (const routine of appState.routines) {
    if (routine.conditions && matchesCondition(routine.conditions, today)) return routine.id;
  }
  const defaultRoutine = appState.routines.find((r) => r.isDefault);
  return defaultRoutine ? defaultRoutine.id : appState.routines[0]?.id || null;
}

export function updateActiveRoutineDisplay() {
  const activeRoutine = getActiveRoutine();
  const nameEl = document.getElementById("active-routine-name");
  if (nameEl && activeRoutine) nameEl.innerText = activeRoutine.name;
}

export function getConditionDisplayText(routine) {
  if (routine.isDefault && !routine.conditions) return "Default";
  if (!routine.conditions) return "No schedule";
  const c = routine.conditions;
  switch (c.type) {
    case "weekday": {
      const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      if (!c.weekdays || !Array.isArray(c.weekdays)) return "No days";
      return c.weekdays.map((d) => days[d]).join(", ");
    }
    case "date":
      if (!c.dates || !Array.isArray(c.dates)) return "No dates";
      return "Days: " + c.dates.join(", ");
    case "pattern":
      if (!c.pattern) return "No pattern";
      return c.pattern.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase());
    case "manual": return "Manual only";
    default: return "Default";
  }
}

export function renderRoutineList() {
  const listEl = document.getElementById("routine-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  appState.routines.forEach((routine) => {
    const isActive = routine.id === appState.activeRoutineId;
    const conditionText = getConditionDisplayText(routine);
    const item = document.createElement("div");
    item.className = `p-4 rounded-xl border ${
      isActive ? "border-emerald-500 bg-emerald-500/10" : "border-custom bg-card-custom"
    } cursor-pointer hover:border-blue-500 transition`;
    item.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            ${routine.isDefault ? '<i class="fas fa-star text-yellow-500 text-xs"></i>' : ""}
            <span class="font-bold">${escapeHtml(routine.name)}</span>
            ${isActive ? '<span class="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded">Active</span>' : ""}
          </div>
          <p class="text-xs text-muted-custom mt-1">${escapeHtml(conditionText)}</p>
        </div>
        <div class="flex gap-2">
          <button class="edit-routine-item text-blue-400 hover:text-blue-300 p-2" data-id="${escapeHtml(routine.id)}"><i class="fas fa-pen text-sm"></i></button>
          <button class="activate-routine-item text-emerald-400 hover:text-emerald-300 p-2 ${isActive ? "hidden" : ""}" data-id="${escapeHtml(routine.id)}"><i class="fas fa-play text-sm"></i></button>
        </div>
      </div>`;
    listEl.appendChild(item);
  });

  listEl.querySelectorAll(".edit-routine-item").forEach((btn) => {
    btn.addEventListener("click", (e) => { e.stopPropagation(); openRoutineEditor(btn.dataset.id); });
  });
  listEl.querySelectorAll(".activate-routine-item").forEach((btn) => {
    btn.addEventListener("click", (e) => { e.stopPropagation(); switchToRoutine(btn.dataset.id); });
  });
}

export function openRoutineEditor(routineId = null) {
  editingRoutineId = routineId;
  const modal = document.getElementById("routine-editor-modal");
  const titleEl = document.getElementById("routine-editor-title");
  const nameInput = document.getElementById("routine-name-input");
  const contentInput = document.getElementById("routine-content-input");
  const conditionType = document.getElementById("routine-condition-type");
  const isDefaultCheck = document.getElementById("routine-is-default");
  const deleteBtn = document.getElementById("delete-routine-btn");

  resetConditionSelectors();

  if (routineId) {
    const routine = appState.routines.find((r) => r.id === routineId);
    if (!routine) return;
    titleEl.innerText = "Edit Routine";
    nameInput.value = routine.name;
    contentInput.value = routine.content;
    isDefaultCheck.checked = routine.isDefault;
    if (routine.conditions) {
      conditionType.value = routine.conditions.type;
      showConditionSelector(routine.conditions.type);
      populateConditionValues(routine.conditions);
    } else {
      conditionType.value = "default";
    }
    deleteBtn.classList.remove("hidden");
  } else {
    titleEl.innerText = "New Routine";
    nameInput.value = "";
    contentInput.value = "";
    conditionType.value = "default";
    isDefaultCheck.checked = false;
    deleteBtn.classList.add("hidden");
  }
  modal.classList.remove("hidden");
}

export function closeRoutineEditor() {
  document.getElementById("routine-editor-modal").classList.add("hidden");
  editingRoutineId = null;
}

function resetConditionSelectors() {
  document.getElementById("weekday-selector").classList.add("hidden");
  document.getElementById("date-selector").classList.add("hidden");
  document.getElementById("pattern-selector").classList.add("hidden");
  document.querySelectorAll(".weekday-btn").forEach((btn) => {
    btn.classList.remove("bg-blue-600");
    btn.classList.add("bg-slate-700");
  });
  document.getElementById("routine-dates-input").value = "";
  document.getElementById("routine-pattern-input").value = "first-friday";
}

export function showConditionSelector(type) {
  resetConditionSelectors();
  if (type === "weekday") document.getElementById("weekday-selector").classList.remove("hidden");
  else if (type === "date") document.getElementById("date-selector").classList.remove("hidden");
  else if (type === "pattern") document.getElementById("pattern-selector").classList.remove("hidden");
}

function populateConditionValues(conditions) {
  if (conditions.type === "weekday" && conditions.weekdays) {
    conditions.weekdays.forEach((day) => {
      const btn = document.querySelector(`.weekday-btn[data-day="${day}"]`);
      if (btn) { btn.classList.remove("bg-slate-700"); btn.classList.add("bg-blue-600"); }
    });
  } else if (conditions.type === "date" && conditions.dates) {
    document.getElementById("routine-dates-input").value = conditions.dates.join(", ");
  } else if (conditions.type === "pattern" && conditions.pattern) {
    document.getElementById("routine-pattern-input").value = conditions.pattern;
  }
}

export function saveRoutineFromEditor() {
  const nameInput = document.getElementById("routine-name-input");
  const contentInput = document.getElementById("routine-content-input");
  const conditionType = document.getElementById("routine-condition-type");
  const isDefaultCheck = document.getElementById("routine-is-default");
  const name = nameInput.value.trim() || "Untitled Routine";
  const content = contentInput.value;
  const isDefault = isDefaultCheck.checked;

  const prayerMatches = content.matchAll(/\[(@|=>)Prayer:(\w+)\]/gi);
  const invalidPrayers = [];
  for (const match of prayerMatches) {
    if (!validatePrayerName(match[2])) invalidPrayers.push(match[2]);
  }
  if (invalidPrayers.length > 0) {
    const uniqueInvalid = [...new Set(invalidPrayers)];
    if (!confirm(`Invalid prayer name(s): ${uniqueInvalid.join(", ")}\n\nValid prayer names: ${VALID_PRAYER_NAMES.join(", ")}\n\nDo you want to save anyway?`)) return;
  }

  let conditions = null;
  const type = conditionType.value;
  if (type === "weekday") {
    const selectedDays = [];
    document.querySelectorAll(".weekday-btn.bg-blue-600").forEach((btn) => selectedDays.push(parseInt(btn.dataset.day)));
    if (selectedDays.length > 0) conditions = { type: "weekday", weekdays: selectedDays };
  } else if (type === "date") {
    const dates = document.getElementById("routine-dates-input").value.split(",").map(d => parseInt(d.trim())).filter(d => !isNaN(d) && d >= 1 && d <= 31);
    if (dates.length > 0) conditions = { type: "date", dates };
  } else if (type === "pattern") {
    conditions = { type: "pattern", pattern: document.getElementById("routine-pattern-input").value };
  } else if (type === "manual") {
    conditions = { type: "manual" };
  }

  if (editingRoutineId) {
    const idx = appState.routines.findIndex((r) => r.id === editingRoutineId);
    if (idx >= 0) {
      appState.routines[idx].name = name;
      appState.routines[idx].content = content;
      appState.routines[idx].conditions = conditions;
      if (isDefault) {
        appState.routines.forEach((r) => (r.isDefault = false));
        appState.routines[idx].isDefault = true;
      }
      if (editingRoutineId === appState.activeRoutineId) {
        appState.rawRoutine = content;
        document.getElementById("routine-input").value = content;
      }
    }
  } else {
    const newRoutine = { id: generateUUID(), name, content, isDefault: isDefault || appState.routines.length === 0, conditions };
    if (newRoutine.isDefault) appState.routines.forEach((r) => (r.isDefault = false));
    appState.routines.push(newRoutine);
  }

  closeRoutineEditor();
  renderRoutineList();
  updateActiveRoutineDisplay();
  saveStateToCloud();
}

export function deleteRoutine(routineId) {
  if (appState.routines.length <= 1) { alert("Cannot delete the last routine."); return; }
  const idx = appState.routines.findIndex((r) => r.id === routineId);
  if (idx >= 0) {
    const wasActive = routineId === appState.activeRoutineId;
    const wasDefault = appState.routines[idx].isDefault;
    appState.routines.splice(idx, 1);
    if (wasDefault && appState.routines.length > 0) appState.routines[0].isDefault = true;
    if (wasActive) {
      appState.activeRoutineId = selectRoutineForToday();
      const active = getActiveRoutine();
      appState.rawRoutine = active ? active.content : "";
      document.getElementById("routine-input").value = appState.rawRoutine;
      appState.currentTaskIndex = 0;
      appState.currentSubRoutineIndex = 0;
      appState.currentQueueIndex = 0;
      appState.queue = [];
      parseAndRender();
    }
    closeRoutineEditor();
    renderRoutineList();
    updateActiveRoutineDisplay();
    saveStateToCloud();
  }
}

export function loadExampleRoutine() {
  const name = "Example Routine";
  if (appState.routines.some((r) => r.name === name)) {
    if (!confirm(`"${name}" already exists. Add it again?`)) return;
  }
  const newRoutine = {
    id: generateUUID(),
    name,
    content: EXAMPLE_ROUTINE,
    isDefault: false,
    conditions: null,
  };
  appState.routines.push(newRoutine);
  renderRoutineList();
  saveStateToCloud();
}

export function switchToRoutine(routineId) {
  const routine = appState.routines.find((r) => r.id === routineId);
  if (!routine) return;
  appState.activeRoutineId = routineId;
  appState.rawRoutine = routine.content;
  appState.currentTaskIndex = 0;
  appState.currentSubRoutineIndex = 0;
  appState.currentQueueIndex = 0;
  appState.celebrationShown = false;
  appState.queue = [];
  document.getElementById("routine-input").value = appState.rawRoutine;
  renderRoutineList();
  updateActiveRoutineDisplay();
  parseAndRender();
  saveStateToCloud();
  document.getElementById("manage-routines-view").classList.add("translate-x-full");
  document.getElementById("settings-view").classList.add("translate-x-full");
}
