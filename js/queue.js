import { appState, display, views } from "./state.js";
import { escapeHtml } from "./utils.js";
import { saveStateToCloud } from "./cloud.js";
import { parseRoutine } from "./parser.js";

function getDateString(d) {
  const date = d || new Date();
  return date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0");
}

function generateId() {
  return "qt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
}

export function buildQueue(forceRebuild) {
  const todayStr = getDateString();
  const isNewDay = appState.queueLastBuiltDate !== todayStr;
  if (isNewDay) {
    appState.currentTaskIndex = 0;
    appState.currentSubRoutineIndex = 0;
    appState.currentQueueIndex = 0;
    appState.celebrationShown = false;
    appState.quickTasks = appState.quickTasks.filter(function(qt) {
      if (!qt.scheduledDate) return false;
      return qt.scheduledDate >= todayStr;
    });
  }
  const needsRebuild = forceRebuild || appState.queue.length === 0 || isNewDay;

  if (!needsRebuild) {
    checkExpiredSnoozes();
    return;
  }

  const routineTasks = parseRoutine(appState.rawRoutine);

  const queue = [];
  for (let i = 0; i < routineTasks.length; i++) {
    const t = routineTasks[i];
    queue.push({
      id: "routine-" + i,
      source: "routine",
      text: t.text,
      icon: t.icon,
      type: t.type,
      meta: t.meta,
      link: t.link,
      isHigh: t.isHigh,
      isSubRoutineParent: t.isSubRoutineParent,
      isSubRoutineItem: t.isSubRoutineItem,
      subRoutines: t.subRoutines,
      raw: t.raw,
      status: "waiting",
      snoozedUntil: null,
      scheduledDate: null,
      order: i,
    });
  }

  const todaysQuick = appState.quickTasks.filter(function(qt) {
    if (!qt.scheduledDate) return true;
    return qt.scheduledDate === todayStr;
  });
  todaysQuick.sort(function(a, b) { return a.order - b.order; });

  for (let qi = 0; qi < todaysQuick.length; qi++) {
    const qt = todaysQuick[qi];
    const insertBefore = queue.findIndex(function(q) {
      if (q.source === "routine") return false;
      return q.order > qt.order;
    });
    const item = {
      id: qt.id,
      source: "quick",
      text: qt.text,
      icon: qt.icon || "📌",
      type: qt.type || "standard",
      meta: qt.meta || null,
      link: null,
      isHigh: false,
      isSubRoutineParent: false,
      isSubRoutineItem: false,
      subRoutines: [],
      raw: qt.text,
      status: "waiting",
      snoozedUntil: qt.snoozedUntil || null,
      scheduledDate: qt.scheduledDate || null,
      order: qt.order,
    };
    if (qt.status === "pending" && qt.snoozedUntil && qt.snoozedUntil > Date.now()) {
      item.status = "pending";
    }
    if (insertBefore === -1) {
      queue.push(item);
    } else {
      queue.splice(insertBefore, 0, item);
    }
  }

  const completedIds = {};
  const pendingIdMap = {};
  for (let i = 0; i < appState.queue.length; i++) {
    const q = appState.queue[i];
    if (q.status === "completed") completedIds[q.id] = true;
    if (q.status === "pending") pendingIdMap[q.id] = true;
  }

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    if (completedIds[item.id]) {
      item.status = "completed";
    } else if (pendingIdMap[item.id] && item.snoozedUntil && item.snoozedUntil > Date.now()) {
      item.status = "pending";
    }
  }

  if (appState.currentQueueIndex >= queue.length) {
    appState.currentQueueIndex = 0;
  }

  let currentAssigned = false;
  for (let i = 0; i < queue.length; i++) {
    if (queue[i].status === "current") {
      appState.currentQueueIndex = i;
      currentAssigned = true;
      break;
    }
  }

if (!currentAssigned) {
  for (let i = appState.currentQueueIndex; i < queue.length; i++) {
    if (queue[i].status === "waiting") {
      queue[i].status = "current";
      appState.currentQueueIndex = i;
      currentAssigned = true;
      break;
    }
  }
}

if (!currentAssigned && queue.length > 0) {
  for (let i = 0; i < queue.length; i++) {
    if (queue[i].status === "waiting") {
      queue[i].status = "current";
      appState.currentQueueIndex = i;
      currentAssigned = true;
      break;
    }
  }
}

if (!currentAssigned && queue.length > 0) {
  queue[queue.length - 1].status = "current";
  appState.currentQueueIndex = queue.length - 1;
}

  appState.queue = queue;
  appState.queueLastBuiltDate = todayStr;
  checkExpiredSnoozes();
}

function checkExpiredSnoozes() {
  const now = Date.now();
  for (let i = 0; i < appState.queue.length; i++) {
    const item = appState.queue[i];
    if (item.status === "pending" && item.snoozedUntil && item.snoozedUntil <= now) {
      item.status = "waiting";
      item.snoozedUntil = null;
    }
  }
}

export function startPendingWatcher() {
  stopPendingWatcher();
  appState.pendingInterval = setInterval(function() {
    let changed = false;
    const now = Date.now();
    for (let i = 0; i < appState.queue.length; i++) {
      const item = appState.queue[i];
      if (item.status === "pending" && item.snoozedUntil && item.snoozedUntil <= now) {
        const current = getCurrentTask();
        if (current) {
          current.status = "waiting";
        }
        item.status = "current";
        item.snoozedUntil = null;
        appState.currentQueueIndex = i;
        changed = true;
        sendNotification("Task Ready", "Snoozed task is back: " + item.text);
      }
    }
    if (changed) {
      renderPendingStrip();
      saveStateToCloud();
      import("./renderer.js").then(function(m) { m.parseAndRender(); });
    }
  }, 15000);
}

function sendNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/assets/RR.png" });
    } catch (e) { /* ignore */ }
  }
}

export function stopPendingWatcher() {
  if (appState.pendingInterval) {
    clearInterval(appState.pendingInterval);
    appState.pendingInterval = null;
  }
}

export function getCurrentTask() {
  if (!appState.queue.length) return null;
  const item = appState.queue[appState.currentQueueIndex];
  if (item && item.status === "current") return item;
  for (let i = 0; i < appState.queue.length; i++) {
    if (appState.queue[i].status === "current") {
      appState.currentQueueIndex = i;
      return appState.queue[i];
    }
  }
  return null;
}

export function getPendingTasks() {
  return appState.queue.filter(function(q) {
    return q.status === "pending";
  });
}

export function getCompletedTasks() {
  return appState.queue.filter(function(q) {
    return q.status === "completed";
  });
}

export function getWaitingTasks() {
  return appState.queue.filter(function(q) {
    return q.status === "waiting";
  });
}

export function completeCurrentTask() {
  const item = getCurrentTask();
  if (!item) return;

  if (item.source === "quick") {
    item.status = "completed";
    advanceToNext();
    saveStateToCloud();
    return;
  }

  if (item.isSubRoutineParent && item.subRoutines.length > 0) {
    if (appState.currentSubRoutineIndex < item.subRoutines.length - 1) {
      appState.currentSubRoutineIndex++;
      saveStateToCloud();
      return;
    }
    appState.currentSubRoutineIndex = 0;
  }

  item.status = "completed";
  advanceToNext();
  saveStateToCloud();
}

export function skipCurrentTask() {
  const item = getCurrentTask();
  if (!item) return;

  if (item.source === "quick") {
    return "needs-reschedule";
  }

  if (item.isSubRoutineParent && item.subRoutines.length > 0) {
    if (appState.currentSubRoutineIndex < item.subRoutines.length - 1) {
      appState.currentSubRoutineIndex++;
      saveStateToCloud();
      return;
    }
    appState.currentSubRoutineIndex = 0;
  }

  item.status = "completed";
  advanceToNext();
  saveStateToCloud();
}

function advanceToNext() {
  const currentIdx = appState.currentQueueIndex;
  for (let i = currentIdx + 1; i < appState.queue.length; i++) {
    if (appState.queue[i].status === "waiting") {
      appState.queue[i].status = "current";
      appState.currentQueueIndex = i;
      return;
    }
  }
}

export function undoLastTask() {
  if (appState.currentQueueIndex < 1) return;
  const current = appState.queue[appState.currentQueueIndex];
  if (current && current.status === "current") {
    current.status = "waiting";
  }
  appState.currentQueueIndex--;
  const prev = appState.queue[appState.currentQueueIndex];
  if (prev) {
    prev.status = "current";
    if (prev.isSubRoutineParent && prev.subRoutines.length > 0) {
      appState.currentSubRoutineIndex = prev.subRoutines.length - 1;
    } else {
      appState.currentSubRoutineIndex = 0;
    }
  }
  saveStateToCloud();
}

export function snoozeTask(untilTimestamp) {
  const item = getCurrentTask();
  if (!item || item.source !== "quick") return;

  item.status = "pending";
  item.snoozedUntil = untilTimestamp;

  advanceToNext();
  saveStateToCloud();
}

export function rescheduleToDate(dateStr) {
  const item = getCurrentTask();
  if (!item || item.source !== "quick") return;

  const qt = appState.quickTasks.find(function(q) { return q.id === item.id; });
  if (qt) {
    qt.scheduledDate = dateStr;
    qt.status = "waiting";
    qt.snoozedUntil = null;
  }

  removeFromQueue(item.id);
  advanceToNext();
  saveStateToCloud();
}

function removeFromQueue(id) {
  const idx = appState.queue.findIndex(function(q) { return q.id === id; });
  if (idx >= 0) {
    appState.queue.splice(idx, 1);
    if (appState.currentQueueIndex >= appState.queue.length) {
      appState.currentQueueIndex = Math.max(0, appState.queue.length - 1);
    }
  }
}

export function makeTaskCurrent(id) {
  const current = getCurrentTask();
  if (current) {
    current.status = "waiting";
  }
  const target = appState.queue.find(function(q) { return q.id === id; });
  if (target) {
    target.status = "current";
    const idx = appState.queue.indexOf(target);
    appState.currentQueueIndex = idx;
  }
  saveStateToCloud();
}

export function dismissPending(id) {
  const item = appState.queue.find(function(q) { return q.id === id; });
  if (item) {
    item.status = "completed";
    item.snoozedUntil = null;
  }
  saveStateToCloud();
}

export function addQuickTask(text, durationSeconds, insertAfterId) {
  const order = calcInsertOrder(insertAfterId);

  const qt = {
    id: generateId(),
    text: text,
    icon: "📌",
    type: durationSeconds ? "timer" : "standard",
    meta: durationSeconds || null,
    order: order,
    scheduledDate: null,
    snoozedUntil: null,
    status: "waiting",
  };

  appState.quickTasks.push(qt);

  const insertIdx = appState.queue.findIndex(function(q) {
    if (q.source === "routine") return false;
    return q.order > order;
  });
  const item = {
    id: qt.id,
    source: "quick",
    text: qt.text,
    icon: qt.icon,
    type: qt.type,
    meta: qt.meta,
    link: null,
    isHigh: false,
    isSubRoutineParent: false,
    isSubRoutineItem: false,
    subRoutines: [],
    raw: qt.text,
    status: "waiting",
    snoozedUntil: null,
    scheduledDate: null,
    order: order,
  };

  if (insertIdx === -1) {
    appState.queue.push(item);
  } else {
    appState.queue.splice(insertIdx, 0, item);
  }

  if (appState.currentQueueIndex >= insertIdx && insertIdx !== -1) {
    appState.currentQueueIndex++;
  }

  const hasCurrent = appState.queue.some(function(q) { return q.status === "current"; });
  if (!hasCurrent && appState.queue.length > 0) {
    const targetIdx = appState.queue.indexOf(item);
    if (targetIdx >= 0) {
      item.status = "current";
      appState.currentQueueIndex = targetIdx;
    }
  }

  saveStateToCloud();
}

function calcInsertOrder(afterId) {
  if (!afterId) {
    if (appState.queue.length === 0) return 0.5;
    return appState.queue.length + 0.5;
  }

  const afterIdx = appState.queue.findIndex(function(q) { return q.id === afterId; });
  if (afterIdx === -1 || afterIdx >= appState.queue.length - 1) {
    return appState.queue.length + 0.5;
  }

  const beforeOrder = appState.queue[afterIdx].order;
  const nextOrder = appState.queue[afterIdx + 1].order;
  return (beforeOrder + nextOrder) / 2;
}

export function removeQuickTaskById(id) {
  const qtIdx = appState.quickTasks.findIndex(function(q) { return q.id === id; });
  if (qtIdx >= 0) appState.quickTasks.splice(qtIdx, 1);
  removeFromQueue(id);
  saveStateToCloud();
}

export function moveInQueue(fromIdx, toIdx) {
  if (fromIdx === toIdx) return;
  if (fromIdx < 0 || fromIdx >= appState.queue.length) return;
  if (toIdx < 0 || toIdx >= appState.queue.length) return;

  const item = appState.queue.splice(fromIdx, 1)[0];
  appState.queue.splice(toIdx, 0, item);

  if (appState.currentQueueIndex === fromIdx) {
    appState.currentQueueIndex = toIdx;
  } else {
    if (fromIdx < appState.currentQueueIndex && toIdx >= appState.currentQueueIndex) {
      appState.currentQueueIndex--;
    } else if (fromIdx > appState.currentQueueIndex && toIdx <= appState.currentQueueIndex) {
      appState.currentQueueIndex++;
    }
  }

  for (let i = 0; i < appState.queue.length; i++) {
    appState.queue[i].order = i + 0.5;
  }

  const todaysQuick = appState.queue.filter(function(q) { return q.source === "quick"; });
  for (let i = 0; i < todaysQuick.length; i++) {
    const qt = appState.quickTasks.find(function(q) { return q.id === todaysQuick[i].id; });
    if (qt) qt.order = todaysQuick[i].order;
  }

  saveStateToCloud();
}

export function resetQueue() {
  appState.quickTasks = [];
  appState.currentSubRoutineIndex = 0;
  appState.currentQueueIndex = 0;
  appState.queue = [];
  saveStateToCloud();
}

export function getInsertPositionOptions() {
  const options = [];
  options.push({ id: null, label: "End of queue" });

  for (let i = 0; i < appState.queue.length; i++) {
    const q = appState.queue[i];
    if (q.status === "completed") continue;
    options.push({
      id: q.id,
      label: "After: " + (q.text.length > 30 ? q.text.substring(0, 30) + "..." : q.text),
      icon: q.icon,
    });
  }
  return options;
}

export function renderPendingStrip() {
  const container = document.getElementById("pending-strip");
  const inner = document.getElementById("pending-strip-inner");
  if (!container || !inner) return;

  const pending = getPendingTasks();
  if (pending.length === 0) {
    container.classList.add("hidden");
    return;
  }

  container.classList.remove("hidden");
  inner.innerHTML = "";

  for (let i = 0; i < pending.length; i++) {
    const p = pending[i];
    const chip = document.createElement("button");
    chip.className = "pending-chip flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition hover:bg-amber-500/20";
    chip.dataset.id = p.id;

    const remaining = p.snoozedUntil ? Math.max(0, Math.floor((p.snoozedUntil - Date.now()) / 60000)) : null;
    let label = p.icon + " " + p.text;
    if (p.text.length > 20) label = p.icon + " " + p.text.substring(0, 20) + "...";
    if (remaining !== null && remaining > 0) {
      if (remaining < 60) {
        label += " (" + remaining + "m)";
      } else {
        label += " (" + Math.floor(remaining / 60) + "h" + (remaining % 60 > 0 ? remaining % 60 + "m" : "") + ")";
      }
    }

    chip.innerHTML = label + '<span class="ml-1 text-amber-400 hover:text-white" data-dismiss="1">&times;</span>';

    chip.addEventListener("click", function(e) {
      if (e.target.dataset.dismiss) {
        e.stopPropagation();
        dismissPending(p.id);
        renderPendingStrip();
        import("./renderer.js").then(function(m) { m.parseAndRender(); });
        return;
      }
      makeTaskCurrent(p.id);
      renderPendingStrip();
      import("./renderer.js").then(function(m) { m.parseAndRender(); });
    });

    inner.appendChild(chip);
  });
}

    container.appendChild(chip);
  }
}

export function openQueuePanel() {
  const panel = document.getElementById("queue-panel");
  if (!panel) return;
  panel.classList.remove("hidden");
  renderQueueList();
  document.getElementById("queue-overlay")?.classList.remove("hidden");
}

export function closeQueuePanel() {
  const panel = document.getElementById("queue-panel");
  if (!panel) return;
  panel.classList.add("hidden");
  document.getElementById("queue-overlay")?.classList.add("hidden");
}

export function renderQueueList() {
  const list = document.getElementById("queue-list");
  if (!list) return;
  list.innerHTML = "";

  if (appState.queue.length === 0) {
    list.innerHTML = '<p class="text-muted-custom text-sm text-center py-8">No tasks in queue.</p>';
    return;
  }

  for (let i = 0; i < appState.queue.length; i++) {
    const q = appState.queue[i];
    const isCurrent = q.status === "current";
    const isQuick = q.source === "quick";
    const isPending = q.status === "pending";
    const isCompleted = q.status === "completed";

    const row = document.createElement("div");
    row.className = "queue-item flex items-center gap-3 p-3 rounded-xl border " +
      (isCurrent ? "border-blue-500 bg-blue-500/10" :
       isPending ? "border-amber-500/50 bg-amber-500/5" :
       isCompleted ? "border-emerald-500/30 bg-emerald-500/5 opacity-60" :
       "border-custom bg-card-custom") +
      " cursor-grab active:cursor-grabbing";
    row.draggable = true;
    row.dataset.index = i;

    const statusIcon = isCurrent ? "▶" : isPending ? "⏳" : isCompleted ? "✓" : "";
    const statusBadge = isCurrent
      ? '<span class="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">Now</span>'
      : isPending
        ? '<span class="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full">Pending</span>'
        : isCompleted
          ? '<span class="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full">Done</span>'
          : "";

    row.innerHTML =
      '<span class="text-muted-custom text-sm cursor-grab select-none">⠿</span>' +
      '<span class="text-lg">' + (q.icon || "✅") + '</span>' +
      '<div class="flex-1 min-w-0">' +
        '<div class="flex items-center gap-2">' +
          '<span class="text-sm font-medium truncate ' + (isCompleted ? 'line-through text-muted-custom' : '') + '">' +
            escapeHtml(q.text || "Untitled") +
          '</span>' +
          (isQuick ? '<span class="text-[10px] text-amber-400 border border-amber-500/30 px-1.5 rounded">Quick</span>' : '') +
        '</div>' +
        '<div class="flex items-center gap-2 mt-0.5">' +
          '<span class="text-[10px] text-muted-custom">' + (q.type === "timer" && q.meta ? formatDuration(q.meta) : q.type) + '</span>' +
          statusBadge +
        '</div>' +
      '</div>' +
      (isQuick && !isCompleted
        ? '<button class="delete-queue-item text-red-400 hover:text-red-300 text-sm p-1" data-id="' + escapeHtml(q.id) + '">&times;</button>'
        : "");

    row.addEventListener("dragstart", function(e) {
      e.dataTransfer.setData("text/plain", i);
      row.classList.add("opacity-50");
    });
    row.addEventListener("dragend", function() {
      row.classList.remove("opacity-50");
    });
    row.addEventListener("dragover", function(e) {
      e.preventDefault();
      row.classList.add("border-blue-500");
    });
    row.addEventListener("dragleave", function() {
      row.classList.remove("border-blue-500");
    });
    row.addEventListener("drop", function(e) {
      e.preventDefault();
      row.classList.remove("border-blue-500");
      const fromIdx = parseInt(e.dataTransfer.getData("text/plain"));
      moveInQueue(fromIdx, i);
      renderQueueList();
      import("./renderer.js").then(function(m) { m.parseAndRender(); });
    });

    list.appendChild(row);
  }

  list.querySelectorAll(".delete-queue-item").forEach(function(btn) {
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      const id = btn.dataset.id;
      removeQuickTaskById(id);
      renderQueueList();
      import("./renderer.js").then(function(m) { m.parseAndRender(); });
    });
  });
}

function formatDuration(seconds) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return h + "h" + (rem > 0 ? " " + rem + "m" : "");
}

export function showQuickAddForm() {
  const modal = document.getElementById("quick-add-modal");
  if (!modal) return;
  modal.classList.remove("hidden");

  const select = document.getElementById("quick-add-position");
  if (select) {
    select.innerHTML = "";
    const options = getInsertPositionOptions();
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const el = document.createElement("option");
      el.value = opt.id || "";
      el.textContent = opt.label;
      select.appendChild(el);
    }
  }
}

export function hideQuickAddForm() {
  const modal = document.getElementById("quick-add-modal");
  if (modal) modal.classList.add("hidden");
}

export function submitQuickAdd() {
  const nameInput = document.getElementById("quick-add-name");
  const durationInput = document.getElementById("quick-add-duration");
  const positionSelect = document.getElementById("quick-add-position");

  const name = nameInput.value.trim();
  if (!name) { alert("Enter a task name."); return; }

  const durVal = parseInt(durationInput.value);
  const duration = isNaN(durVal) || durVal <= 0 ? null : durVal * 60;

  const afterId = positionSelect ? positionSelect.value || null : null;

  addQuickTask(name, duration, afterId);

  nameInput.value = "";
  durationInput.value = "";
  hideQuickAddForm();
  import("./renderer.js").then(function(m) { m.parseAndRender(); });
}

export function showRescheduleDialog() {
  const modal = document.getElementById("reschedule-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
}

export function hideRescheduleDialog() {
  const modal = document.getElementById("reschedule-modal");
  if (modal) modal.classList.add("hidden");
}
