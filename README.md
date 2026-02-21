# 📅 Routine Runner (RR)

<div align="center">

![Routine Runner Logo](assets/RR.png)

**A premium, distraction-free Progressive Web App (PWA)** designed to execute daily routines with precision. It parses smart text-based schedules into an interactive, synchronized interface, reducing cognitive load during high-focus periods.

[![PWA](https://img.shields.io/badge/PWA-Ready-blue.svg)](https://web.dev/progressive-web-apps/)
[![Firebase](https://img.shields.io/badge/Firebase-Enabled-orange.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

## 📖 Project Overview

Routine Runner solves the **"cold start" problem** of daily habits. Instead of managing complex databases or navigating through multiple apps, it accepts a human-readable text block and converts it into a live, state-managed workflow that syncs seamlessly across all your devices.

### 🎯 Why Routine Runner?

- **Zero Friction**: No complex setup, no database migrations, just type your routine and go
- **Cross-Device Sync**: Start on your phone, continue on your laptop with real-time synchronization
- **Privacy First**: Your data stays in your Firebase instance - we never see your routines
- **Offline Capable**: Works even without internet connection using service worker caching
- **Focus Mode**: Minimal, glassmorphism UI designed for deep work sessions with wake lock support
- **Single File**: Entire app in one HTML file - easy to deploy, modify, and understand

---

## ✨ Key Features

### 🧠 **Smart Routine Parsing**

- **Bracket Syntax**: Clean, consistent syntax for times and durations (e.g., `[@06:00]`, `[20m]`).
- **Prayer Times**: Integrate Islamic prayer times into your routine with `[@Prayer:Fajr]` syntax.
- **Conditional Logic**: Show tasks only on specific days (e.g., `IF:MON::Task`).
- **Link Support**: Embed clickable links directly in tasks (e.g., `[https://...]`).
- **Priority Highlighting**: Mark important tasks with `==Text==` for a golden glow.

### 🎨 **Premium UI/UX**

- **Glassmorphism Design**: Modern, translucent card aesthetics with blurred backgrounds.
- **Adaptive Themes**: Rich Dark Mode and Frosty Light Mode.
- **Smooth Animations**: Skeleton loaders, task slide transitions, and timer heartbeat.
- **Smart Controls**: Pause/Resume timers, Skip, Undo, and Auto-Advance.
- **Keyboard Shortcuts**: `Space`=Done, `S`=Skip, `U`=Undo, `P`=Pause, `Esc`=Close.
- **Haptic Feedback**: Vibration on interactions (Android).
- **Confetti Celebration**: Reward for completing your routine.

### 🔄 **Real-Time Synchronization**

- **Instant Sync**: Changes appear immediately across all connected devices via Firestore.
- **Offline Support**: Continue working without internet; syncs when reconnected.
- **Cloud Backup**: Your routines and history are safely stored in Firestore.

### 📱 **Mobile-First Design**

- **PWA Ready**: Install on Android/iOS for native app experience.
- **Touch Controls**: Large buttons and gestures for mobile use.
- **Wake Lock**: Keeps screen active during timed tasks (configurable in Settings).

### 🔔 **Notifications & Alarms**

- **Audio Alerts**: Custom alarm sound plays when timer completes (requires user interaction first).
- **Visual Fallback**: Timer pulses if audio is blocked by browser.
- **Browser Notifications**: System notifications when tasks are ready (requires permission).
- **Haptic Feedback**: Vibration on task completion (Android).

---

## ⚙️ Quick Start

### 🚀 **Option A — Use the Hosted Version**

> The app comes with a pre-configured Firebase instance. Simply open the app and sign in with Google to get started!

### 🔧 **Option B — Self-Host with Your Own Firebase**

#### **Step 1: Clone & Prepare**

```bash
git clone https://github.com/PyNAABO/Routine-Runner.git
cd Routine-Runner
```

#### **Step 2: Firebase Setup**

1. **Create Firebase Project**: Go to [Firebase Console](https://console.firebase.google.com/).
2. **Enable Authentication**: Enable **Google** provider in Authentication settings.
3. **Setup Firestore**: Create a database in **Production mode**.
4. **Get Your Config**: Copy your Firebase config from Project Settings.
5. **Update the App**: Replace the `FIREBASE_CONFIG` object in `index.html` (around line 1293) with your config.

#### **Step 3: Deploy**

```bash
# Serve locally for testing
python -m http.server 8000
# Then open http://localhost:8000
```

That's it! Open the app and sign in with Google. Your routines sync automatically across all devices.

---

## 📝 Routine Syntax Guide

The app uses a powerful bracket-based syntax. Write your routine as a plain text list.

### 🎯 **Core Syntax Patterns**

| Syntax            | Type                 | Behavior             | Example                                 |
| :---------------- | :------------------- | :------------------- | :-------------------------------------- |
| `[@HH:MM]`        | **Start At** (Gate)  | Blocks until time    | `Wake up [@06:00]`                      |
| `[=>HH:MM]`       | **End By** (Till)    | Count down to time   | `Work [=>17:00]`                        |
| `[Xm]`            | **Duration** (Timer) | Timer for X mins     | `Read [30m]`                            |
| `[@Prayer:Name]`  | **Prayer Gate**      | Blocks until prayer  | `Breakfast [@Prayer:Fajr]`              |
| `[=>Prayer:Name]` | **Prayer Till**      | Count down to prayer | `Morning Work [=>Prayer:Dhuhr]`         |
| `==Text==`        | **Priority**         | Golden border        | `==Workout== [30m]`                     |
| `IF:DAY::`        | **Condition**        | Only show on Day     | `IF:SUN::Relax`                         |
| `\| ELSE::`       | **Else**             | Fallback task        | `... \| ELSE::Work`                     |
| `[http...]`       | **Link**             | "Open Link" button   | `Meeting [https://meet.google.com/abc]` |

### 📋 **Complete Routine Example**

```text
🌅 Morning Routine [@Prayer:Fajr]
IF:MON::Start Week Review [15m]
IF:!SUN::==🏋️ Quick Workout== [20m]
🚿 Shower [15m]
🍳 Breakfast [30m]
🕌 Dhuhr Prayer [@Prayer:Dhuhr]
💼 Deep Work Session [=>Prayer:Asr]
🍽️ Lunch [=>13:00]
IF:FRI::🎉 Team Social [=>17:00] | ELSE::💼 Deep Work Session 2 [90m]
```

### 💡 **Tips**

- **Days for Conditions**: `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN`.
- **Negation**: Use `!` (e.g., `!SUN` means "Not Sunday").
- **Emojis**: The first emoji in a line becomes the task icon.

### 🔀 **Sub-Routines (Nested Tasks)**

Group related tasks under a parent using colon and dash syntax:

```text
JOURNAL:
- ❤️ Gratitude
- 🎯 Goals
- 📖 Reflection

📚 Study [30m]
```

The parent title appears at the bottom of the card as `JOURNAL [1/3]` while each sub-task is shown individually.

---

## 🕌 Prayer Times

Routine Runner integrates with the [Al Adhan API](https://aladhan.com) to fetch accurate prayer times for your location.

### Setup

1. Go to **Settings** → **Prayer Times**
2. Enter your **Latitude** and **Longitude** manually, OR
3. Click the **📍 GPS button** to auto-detect your location
4. Click **Save Location**

### Prayer Syntax

Use prayer times as gates (wait until) or tills (countdown to):

| Syntax             | Behavior             | Example                         |
| :----------------- | :------------------- | :------------------------------ |
| `[@Prayer:Fajr]`   | Wait until Fajr time | `Wake up [@Prayer:Fajr]`        |
| `[=>Prayer:Dhuhr]` | Count down to Dhuhr  | `Morning Work [=>Prayer:Dhuhr]` |

### Valid Prayer Names

> **Note**: Use these exact names (case-insensitive): `Fajr`, `Dhuhr`, `Asr`, `Maghrib`, `Isha`

The app will warn you if you use an invalid prayer name when saving your routine.

### Example Prayer-Based Routine

```text
🌅 Wake Up [@Prayer:Fajr]
🧎 Fajr Prayer [15m]
📚 Morning Study [=>Prayer:Dhuhr]
🕌 Dhuhr Prayer [15m]
💼 Afternoon Work [=>Prayer:Asr]
🧎 Asr Prayer [15m]
🏃 Exercise [45m]
🕌 Maghrib Prayer [@Prayer:Maghrib]
🍽️ Dinner [30m]
📖 Evening Reading [=>Prayer:Isha]
🧎 Isha Prayer [15m]
🌙 Wind Down [30m]
```

---

## 📂 Multiple Routines

Manage multiple named routines with automatic or manual selection.

### Creating Routines

1. Go to **Settings** → **Manage Routines**
2. Click **Add New Routine**
3. Give it a name and add tasks
4. Set when it should run:
   - **Always (Default)**: Runs when no other routine matches
   - **Specific Days**: Mon, Wed, Fri, etc.
   - **Specific Dates**: 1st, 15th of each month
   - **Pattern**: First Friday, Last Monday, etc.
   - **Manual Only**: Only when you explicitly select it

### Auto-Selection

On app load, the routine is automatically selected based on:

1. Check each routine's conditions against today's date
2. First matching routine is activated
3. Falls back to the default routine if no match

### Quick Switch

- Tap the play icon (▶) next to any routine to switch immediately
- Current routine shown in Settings under "Active Routine"

---

## 📱 PWA Installation

- **Android**: Open Chrome -> Menu -> "Add to Home Screen".
- **iOS**: Open Safari -> Share -> "Add to Home Screen".
- **Desktop**: Click the Install icon in Chrome/Edge address bar.

---

## 🛠️ Technical Architecture

- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS via CDN.
- **Backend**: Firebase (Auth, Firestore) v11.6.1.
- **Storage**: LocalStorage for settings/preferences, Firestore for routines and history.
- **Logic**: Custom regex-based text parser with conditional evaluation.
- **PWA**: Service Worker for offline caching (v11).
- **External Dependencies**:
  - [Tailwind CSS](https://tailwindcss.com/) (CDN) - Styling
  - [Font Awesome 6.4](https://fontawesome.com/) (CDN) - Icons
  - [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) (CDN) - Celebrations
  - [Al Adhan API](https://aladhan.com/) - Prayer times

### Security Notes

- The Firebase API key in the code is public-safe (client-side credentials)
- Configure API key restrictions in Firebase Console for production use
- All user data is stored in their own Firebase project (privacy-first)

### **Data Structure**

```javascript
// App State (synced to Firestore)
{
  routines: [
    {
      id: "routine-uuid",
      name: "Daily Routine",
      content: "📚 Study\n🪥 Brush",
      isDefault: true,
      conditions: { type: "weekday", weekdays: [1, 3, 5] } // or null
    }
  ],
  activeRoutineId: "routine-uuid",
  currentTaskIndex: 0,
  currentSubRoutineIndex: 0,
  history: { "2024-01-15": [...] },
  settings: {
    darkMode: true,
    autoAdvance: false,
    wakeLock: true,
    prayerLocation: { latitude: null, longitude: null }
  },
  lastUpdated: 1706000000000
}

// Parsed Task Object
{
  id: 0,
  text: "Morning Routine",
  icon: "🌅",
  type: "gate",           // gate | timer | till | standard | prayerGate | prayerTill
  meta: "06:00",          // Time or duration
  isHigh: false,           // Priority flag
  link: "https://...",    // Optional URL
  isSubRoutineParent: false,
  isSubRoutineItem: false,
  subRoutines: []          // Nested tasks for sub-routines
}
```

---

<div align="center">

**⭐ Star this repository if it helps you stay productive!**

[🔝 Back to Top](#-routine-runner-rr)

Made with ❤️ for productive people everywhere

</div>
