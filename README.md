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
- **Conditional Logic**: Show tasks only on specific days (e.g., `IF:MON::Task`).
- **Link Support**: Embed clickable links directly in tasks (e.g., `[https://...]`).
- **Priority Highlighting**: Mark important tasks with `==Text==` for a golden glow.

### 🎨 **Premium UI/UX**

- **Glassmorphism Design**: Modern, translucent card aesthetics with blurred backgrounds.
- **Adaptive Themes**: Rich Dark Mode and Frosty Light Mode.
- **Smooth Animations**: Fluid transitions for a polished feel.
- **Smart Controls**: Pause/Resume timers, Skip, Undo, and Auto-Advance.

### 🔄 **Real-Time Synchronization**

- **Instant Sync**: Changes appear immediately across all connected devices via Firestore.
- **Offline Support**: Continue working without internet; syncs when reconnected.
- **Cloud Backup**: Your routines and history are safely stored in Firestore.

### 📱 **Mobile-First Design**

- **PWA Ready**: Install on Android/iOS for native app experience.
- **Touch Controls**: Large buttons and gestures for mobile use.
- **Wake Lock**: Keeps screen active during timed tasks.

---

## ⚙️ Quick Start

### 🚀 **Option A — Try the Live Demo**

> **Note**: The demo uses a shared Firebase instance. For personal use, follow the self-hosting guide.

### 🔧 **Option B — Self-Host in 5 Minutes**

#### **Step 1: Clone & Prepare**

```bash
git clone https://github.com/PyNAABO/Routine-Runner.git
cd Routine-Runner
```

#### **Step 2: Firebase Setup**

1.  **Create Firebase Project**: Go to [Firebase Console](https://console.firebase.google.com/).
2.  **Enable Authentication**: Enable **Google** provider in Authentication settings.
3.  **Setup Firestore**: Create a database in **Production mode**.
4.  **Security Rules**: Allow read/write for authenticated users.

#### **Step 3: Deploy**

```bash
# Serve locally for testing
python -m http.server 8000
# Then open http://localhost:8000
```

#### **Step 4: Connect App**

1.  Open the app.
2.  Go to **"Connect Database"**.
3.  Paste your Firebase Config JSON.

---

## 📝 Routine Syntax Guide

The app uses a powerful bracket-based syntax. Write your routine as a plain text list.

### 🎯 **Core Syntax Patterns**

| Syntax      | Type                 | Behavior           | Example                                 |
| :---------- | :------------------- | :----------------- | :-------------------------------------- | ---- | ----------- |
| `[@HH:MM]`  | **Start At** (Gate)  | Blocks until time  | `Wake up [@06:00]`                      |
| `[=>HH:MM]` | **End By** (Till)    | Count down to time | `Work [=>17:00]`                        |
| `[Xm]`      | **Duration** (Timer) | Timer for X mins   | `Read [30m]`                            |
| `==Text==`  | **Priority**         | Golden border      | `==Workout== [30m]`                     |
| `IF:DAY::`  | **Condition**        | Only show on Day   | `IF:SUN::Relax`                         |
| `           | ELSE::`              | **Else**           | Fallback task                           | `... | ELSE::Work` |
| `[http...]` | **Link**             | "Open Link" button | `Meeting [https://meet.google.com/abc]` |

### 📋 **Complete Routine Example**

```text
🌅 Morning Routine [@06:00]
IF:MON::Start Week Review [15m]
IF:!SUN::==🏋️ Quick Workout== [20m]
🚿 Shower [15m]
🍳 Breakfast [=>08:00] [https://tasty.co/recipe]
💼 Deep Work Session 1 [90m]
🍽️ Lunch [=>13:00]
IF:FRI::🎉 Team Social [=>17:00] | ELSE::💼 Deep Work Session 2 [90m]
```

### 💡 **Tips**

- **Days for Conditions**: `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN`.
- **Negation**: Use `!` (e.g., `!SUN` means "Not Sunday").
- **Emojis**: The first emoji in a line becomes the task icon.

---

## 📱 PWA Installation

- **Android**: Open Chrome -> Menu -> "Add to Home Screen".
- **iOS**: Open Safari -> Share -> "Add to Home Screen".
- **Desktop**: Click the Install icon in Chrome/Edge address bar.

---

## 🛠️ Technical Architecture

- **Frontend**: HTML5, Vanilla JS, Tailwind CSS via CDN.
- **Backend**: Firebase (Auth, Firestore).
- **Storage**: LocalStorage for settings, Firestore for data.
- **Logic**: Custom regex-based text parser with conditional evaluation.

### **Data Structure**

```javascript
// Parsed Task Object
{
  id: 0,
  text: "Morning Routine",
  icon: "🌅",
  type: "gate",           // gate | timer | till | standard
  meta: "06:00",          // Time or duration
  isHigh: false,          // Priority flag
  link: "https://..."     // Optional URL
}
```

---

<div align="center">

**⭐ Star this repository if it helps you stay productive!**

[🔝 Back to Top](#-routine-runner-rr)

Made with ❤️ for productive people everywhere

</div>
