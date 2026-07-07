import { appState, display } from "./state.js";
import { getNextOccurrence, formatTime, updateTimerDisplay } from "./utils.js";
import { parseRoutine } from "./parser.js";
import { fetchPrayerTimes, getPrayerTime } from "./prayer.js";
import { startCountDown, setControlsState, clearTimer, setTimerInterval, updatePauseBtn } from "./timer.js";
import { startAlarmLoop, stopAlarm, sendNotification } from "./media.js";
import { saveStateToCloud } from "./cloud.js";

export function logTask(status) {
  const task = appState.tasks[appState.currentTaskIndex];
  if (!task) return;
  let logText = task.text;
  if (task.isSubRoutineParent && task.subRoutines.length > 0) {
    const subTask = task.subRoutines[appState.currentSubRoutineIndex];
    if (subTask) logText = `${task.text} > ${subTask.text}`;
  }
  const today = new Date().toISOString().split("T")[0];
  if (!appState.history[today]) appState.history[today] = [];
  appState.history[today].push({
    time: new Date().toLocaleTimeString(),
    task: logText,
    status,
  });
}

export function triggerCompletion() {
  if (appState.settings.autoAdvance) {
    logTask("auto-done");
    appState.currentTaskIndex++;
    saveStateToCloud();
    parseAndRender();
  } else {
    startAlarmLoop();
  }
  display.timerVal.classList.remove("timer-running");
}

export function parseAndRender() {
  const container = document.getElementById("task-card");
  if (container && !container.classList.contains("slide-in-right")) {
    container.classList.remove("slide-in-right");
    void container.offsetWidth;
    container.classList.add("slide-in-right");
  }

  appState.tasks = parseRoutine(appState.rawRoutine);
  setControlsState(true);
  stopAlarm();
  clearTimer();

  if (appState.currentTaskIndex < 0) appState.currentTaskIndex = 0;

  if (appState.tasks.length === 0) {
    document.getElementById("empty-state").classList.remove("hidden");
    document.getElementById("active-task-container").classList.add("hidden");
    document.getElementById("all-done-state").classList.add("hidden");
    display.subRoutineIndicator.classList.add("hidden");
    return;
  }

  if (appState.currentTaskIndex >= appState.tasks.length) {
    document.getElementById("active-task-container").classList.add("hidden");
    document.getElementById("all-done-state").classList.remove("hidden");
    document.getElementById("empty-state").classList.add("hidden");
    display.subRoutineIndicator.classList.add("hidden");

    if (!appState.celebrationShown) {
      appState.celebrationShown = true;
      if (typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#10b981", "#3b82f6", "#f59e0b"] });
      }
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    }
    return;
  }

  document.getElementById("empty-state").classList.add("hidden");
  document.getElementById("all-done-state").classList.add("hidden");
  document.getElementById("active-task-container").classList.remove("hidden");

  const task = appState.tasks[appState.currentTaskIndex];
  const nextTask = appState.tasks[appState.currentTaskIndex + 1];

  let displayTask = task;
  let isInSubRoutine = false;

  if (task.isSubRoutineParent && task.subRoutines.length > 0) {
    isInSubRoutine = true;
    if (appState.currentSubRoutineIndex >= task.subRoutines.length) {
      appState.currentSubRoutineIndex = 0;
    }
    displayTask = task.subRoutines[appState.currentSubRoutineIndex];
    display.subRoutineParentTitle.innerText = task.text;
    display.subRoutineIndicator.classList.remove("hidden");
    display.subRoutineCurrent.innerText = appState.currentSubRoutineIndex + 1;
    display.subRoutineTotal.innerText = task.subRoutines.length;
  } else {
    display.subRoutineIndicator.classList.add("hidden");
  }

  display.taskText.innerText = displayTask.text || "Untitled";
  display.taskIcon.innerText = displayTask.icon;

  const linkBtn = document.getElementById("task-link-btn");
  if (displayTask.link && /^https?:\/\//i.test(displayTask.link)) {
    linkBtn.href = displayTask.link;
    linkBtn.classList.remove("hidden");
  } else {
    linkBtn.classList.add("hidden");
    linkBtn.href = "#";
  }

  let nextTaskText = "Finish Line";
  if (isInSubRoutine) {
    if (appState.currentSubRoutineIndex < task.subRoutines.length - 1) {
      nextTaskText = task.subRoutines[appState.currentSubRoutineIndex + 1].text;
    } else {
      nextTaskText = nextTask ? nextTask.text : "Finish Line";
    }
  } else {
    nextTaskText = nextTask ? nextTask.text : "Finish Line";
  }
  display.nextTask.innerText = nextTaskText;

  if (displayTask.isHigh) display.taskCard.classList.add("priority-glow");
  else display.taskCard.classList.remove("priority-glow");

  display.globalProgress.style.width = `${(appState.currentTaskIndex / Math.max(1, appState.tasks.length - 1)) * 100}%`;

  display.waitOverlay.classList.add("hidden");
  display.timerBox.classList.add("hidden");
  document.getElementById("timer-controls").classList.add("hidden");

  handleTaskLogic(displayTask).catch((err) => {
    console.error("Error handling task logic:", err);
  });
}

async function handleTaskLogic(task) {
  if (task.type === "prayerGate") {
    await fetchPrayerTimes();
    const prayerTime = getPrayerTime(task.meta);
    if (prayerTime) {
      const target = getNextOccurrence(prayerTime);
      if (new Date() < target) {
        display.waitOverlay.classList.remove("hidden");
        setControlsState(false);
        display.waitTarget.innerText = `${task.meta}: ${prayerTime}`;
        setTimerInterval(() => {
          const diff = target - new Date();
          if (diff <= 0) {
            clearTimer();
            display.waitOverlay.classList.add("hidden");
            setControlsState(true);
            sendNotification("Prayer Time", `It's time for ${task.meta}: ${task.text}`);
            triggerCompletion();
          } else {
            display.waitCount.innerText = formatTime(Math.floor(diff / 1000));
          }
        }, 1000);
      }
    } else {
      console.warn(`Prayer time not available for ${task.meta}. Please set location in settings.`);
    }
  } else if (task.type === "prayerTill") {
    await fetchPrayerTimes();
    const prayerTime = getPrayerTime(task.meta);
    if (prayerTime) {
      document.getElementById("pause-btn").classList.add("hidden");
      const target = getNextOccurrence(prayerTime);
      const diffSeconds = Math.floor((target - new Date()) / 1000);
      if (diffSeconds > 0) startCountDown(diffSeconds, triggerCompletion);
      else {
        display.timerVal.innerText = "00:00";
        display.timerBox.classList.remove("hidden");
      }
    } else {
      console.warn(`Prayer time not available for ${task.meta}. Please set location in settings.`);
    }
  } else if (task.type === "gate") {
    const target = getNextOccurrence(task.meta);
    if (new Date() < target) {
      display.waitOverlay.classList.remove("hidden");
      setControlsState(false);
      display.waitTarget.innerText = task.meta;
      setTimerInterval(() => {
        const diff = target - new Date();
        if (diff <= 0) {
          clearTimer();
          display.waitOverlay.classList.add("hidden");
          setControlsState(true);
          sendNotification("Task Ready", `It's time for: ${task.text}`);
          triggerCompletion();
        } else {
          display.waitCount.innerText = formatTime(Math.floor(diff / 1000));
        }
      }, 1000);
    }
  } else if (task.type === "timer") {
    appState.isPaused = false;
    updatePauseBtn();
    document.getElementById("pause-btn").classList.remove("hidden");
    startCountDown(task.meta, triggerCompletion);
  } else if (task.type === "till") {
    document.getElementById("pause-btn").classList.add("hidden");
    const target = getNextOccurrence(task.meta);
    const diffSeconds = Math.floor((target - new Date()) / 1000);
    if (diffSeconds > 0) startCountDown(diffSeconds, triggerCompletion);
    else {
      display.timerVal.innerText = "00:00";
      display.timerBox.classList.remove("hidden");
    }
  }
}
