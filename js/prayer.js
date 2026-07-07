import { appState } from "./state.js";
import { VALID_PRAYER_NAMES } from "./config.js";
import { saveStateToCloud } from "./cloud.js";

export function loadPrayerLocation() {
  const saved = localStorage.getItem("rr_prayer_location");
  if (saved) {
    try {
      const location = JSON.parse(saved);
      if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
        appState.settings.prayerLocation = { latitude: location.latitude, longitude: location.longitude };
        const latInput = document.getElementById("prayer-latitude");
        const lonInput = document.getElementById("prayer-longitude");
        if (latInput) latInput.value = appState.settings.prayerLocation.latitude || "";
        if (lonInput) lonInput.value = appState.settings.prayerLocation.longitude || "";
      }
    } catch (e) {
      console.error("Failed to load prayer location:", e);
    }
  }
}

export function savePrayerLocation() {
  localStorage.setItem("rr_prayer_location", JSON.stringify(appState.settings.prayerLocation));
  saveStateToCloud();
}

async function getDailyPrayerTimes() {
  const lat = appState.settings.prayerLocation.latitude;
  const lon = appState.settings.prayerLocation.longitude;

  if (!lat || !lon) {
    console.warn("Prayer location not set");
    return null;
  }

  const today = new Date();
  const dateString = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getFullYear()}`;

  const url = new URL(`https://api.aladhan.com/v1/timings/${dateString}`);
  const params = {
    latitude: String(lat),
    longitude: String(lon),
    method: "1",
    shafaq: "general",
    tune: "0,0,0,0,0,0,0,-4,0",
    calendarMethod: "UAQ",
  };
  url.search = new URLSearchParams(params).toString();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const json = await response.json();

    if (!json || !json.data || !json.data.timings) {
      console.warn("Invalid API response structure");
      return null;
    }

    const timings = json.data.timings;
    const hasValidTimings = VALID_PRAYER_NAMES.every(p => timings[p] && typeof timings[p] === 'string');
    if (!hasValidTimings) {
      console.warn("Missing prayer time data in API response");
      return null;
    }

    return json.data;
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Prayer time request timed out (took longer than 20s)");
    } else {
      console.error("Fetch failed:", error.message);
    }
    return null;
  }
}

export async function fetchPrayerTimes() {
  const today = new Date().toDateString();
  if (appState.prayerTimes && appState.prayerTimesDate === today) {
    return appState.prayerTimes;
  }

  const data = await getDailyPrayerTimes();
  if (data && data.timings) {
    appState.prayerTimes = data.timings;
    appState.prayerTimesDate = today;
    localStorage.setItem("rr_prayer_times_cache", JSON.stringify({ date: today, timings: data.timings }));
    return appState.prayerTimes;
  }

  const cached = localStorage.getItem("rr_prayer_times_cache");
  if (cached) {
    try {
      const cachedData = JSON.parse(cached);
      if (cachedData && cachedData.date === today && cachedData.timings && typeof cachedData.timings === 'object') {
        console.log("Using cached prayer times from localStorage");
        appState.prayerTimes = cachedData.timings;
        appState.prayerTimesDate = today;
        return appState.prayerTimes;
      }
    } catch (e) {
      console.error("Failed to parse cached prayer times:", e);
    }
  }

  return null;
}

export function getPrayerTime(prayerName) {
  if (!appState.prayerTimes) return null;

  const normalized = prayerName.charAt(0).toUpperCase() + prayerName.slice(1);
  const validName = VALID_PRAYER_NAMES.find(
    (name) => name.toLowerCase() === normalized.toLowerCase(),
  );

  if (!validName) {
    console.warn(`Invalid prayer name: ${prayerName}. Valid names: ${VALID_PRAYER_NAMES.join(", ")}`);
    return null;
  }

  const timeStr = appState.prayerTimes[validName];
  if (!timeStr) return null;

  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  return null;
}

export function validatePrayerName(prayerName) {
  const normalized = prayerName.charAt(0).toUpperCase() + prayerName.slice(1);
  return VALID_PRAYER_NAMES.some(
    (name) => name.toLowerCase() === normalized.toLowerCase(),
  );
}
