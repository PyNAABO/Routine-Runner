# 📅 Routine Runner (RR)

<div align="center">

![Routine Runner Logo](assets/RR.png)

**A distraction-free, privacy-focused Progressive Web App (PWA)** designed to execute daily routines with precision. It parses simple text-based schedules into an interactive, synchronized interface, reducing cognitive load during high-focus periods.

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
- **Focus Mode**: Minimal UI designed for deep work sessions with wake lock support
- **Single File**: Entire app in one HTML file - easy to deploy, modify, and understand
- **No Build Step**: No npm, no webpack, no bundlers - just serve the files

---

## ✨ Key Features

### 🧠 **Smart Routine Parsing**

- **Natural Language**: Write routines in plain text with intuitive syntax
- **Multiple Task Types**: Time gates, countdowns, timers, and standard tasks
- **Priority Highlighting**: Mark important tasks with visual emphasis
- **Emoji Support**: Use emojis as task icons for better visual organization

### 🔄 **Real-Time Synchronization**

- **Instant Sync**: Changes appear immediately across all connected devices via Firestore
- **Conflict Resolution**: Smart handling of simultaneous edits with last-writer-wins
- **Offline Support**: Continue working without internet, sync when reconnected
- **Cloud Backup**: Your routines and history are safely stored in Firestore
- **Visual Status**: Real-time sync indicator showing connection state
- **Auto-Reconnect**: Automatically re-establishes connection after network loss

### 📱 **Mobile-First Design**

- **PWA Ready**: Install on Android/iOS for native app experience
- **Responsive UI**: Optimized for phones, tablets, and desktops
- **Touch Controls**: Large buttons and gestures for mobile use
- **Wake Lock**: Keeps screen active during timed tasks

### 🔔 **Smart Notifications & Controls**

- **Looping Alarms**: Audio alerts for time-sensitive tasks
- **Pause/Resume**: Pause functionality for active timers
- **Auto-Advance**: Optional progression through routines
- **Visual Feedback**: Clear progress indicators and status updates
- **Flexible Controls**: Manual override when needed

### 📊 **Progress Tracking**

- **Daily Logs**: Automatic logging of completed and skipped tasks with timestamps
- **Export Data**: Download your routine history as JSON for backup or analysis
- **Progress Visualization**: Visual progress bar showing daily completion rate
- **Manual Editing**: Edit history JSON directly for corrections or adjustments
- **Data Portability**: Full control over your data with export/import capabilities

---

## ⚙️ Quick Start

### 🚀 **Option A — Try the Live Demo**

> **Note**: The demo uses a shared Firebase instance. For personal use, follow the self-hosting guide.

Visit: [Deploy your own instance](#-option-b--self-host-in-5-minutes)

### 🔧 **Option B — Self-Host in 5 Minutes**

#### **Step 1: Clone & Prepare**

```bash
git clone https://github.com/PyNAABO/Routine-Runner.git
cd Routine-Runner
```

#### **Step 2: Firebase Setup**

1. **Create Firebase Project**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup wizard

2. **Enable Authentication**

   - Navigate to **Authentication → Sign-in method**
   - Enable **Google** provider
   - Add your domain to **Authorized domains**:
     - `localhost` for local testing
     - `your-username.github.io` for GitHub Pages
     - Your custom domain if applicable

3. **Setup Firestore**
   - Go to **Firestore Database → Create database**
   - Choose **Production mode**
   - Set security rules (see detailed guide below)

#### **Step 3: Deploy**

```bash
# Deploy to GitHub Pages
git push origin main

# Or serve locally for testing
python -m http.server 8000
# Then open http://localhost:8000
```

#### **Step 4: Connect App**

1. Open the deployed app
2. Go to **"Connect Database"** screen
3. **Recommended**: Create a secret GitHub Gist with your Firebase config and paste the raw URL
4. **Alternative**: Paste the Firebase config JSON directly

---

## 🛠️ Detailed Firebase Configuration

### 🔐 **Authentication Setup**

<details>
<summary>Click to expand detailed steps</summary>

1. **Enable Google Sign-In**

   ```
   Firebase Console → Authentication → Sign-in method → Google → Enable
   ```

2. **Configure Authorized Domains**

   ```
   Authentication → Settings → Authorized domains → Add:
   - localhost
   - 127.0.0.1
   - your-username.github.io
   - your-custom-domain.com
   ```

> ⚠️ **Critical**: Without authorized domains, Google sign-in will fail silently

</details>

### 🗄️ **Firestore Security Rules**

<details>
<summary>Click to expand security rules</summary>

Replace the default rules with:

```groovy
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

</details>

### 📋 **Getting Firebase Config**

<details>
<summary>Click to expand config steps</summary>

1. Go to **Project Settings → General → Your apps → Web App**
2. Click the web app icon (</>)
3. Copy the `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};
```

</details>

---

## 📝 Routine Syntax Guide

The app uses a simple, intuitive syntax that you can learn in minutes. Write your routine as a plain text list, and the app will automatically parse and execute it.

### 🎯 **Core Syntax Patterns**

| Syntax       | Type           | Behavior                             | Example                     |
| ------------ | -------------- | ------------------------------------ | --------------------------- |
| `@HH:MM`     | **Time Gate**  | Blocks progress until specified time | `🌅 Morning Routine @06:00` |
| `[Xm]`       | **Timer**      | Countdown for X minutes              | `📚 Deep Work [45m]`        |
| `till HH:MM` | **Till Timer** | Countdown until specific time        | `💼 Work till 17:00`        |
| `==Text==`   | **Priority**   | Golden border for high importance    | `==🏋️ Workout==`            |
| `🔥 Emoji`   | **Icon**       | First emoji becomes task icon        | `💧 Drink Water`            |

### 📋 **Complete Routine Example**

```text
🌅 Morning Routine @06:00
💧 Drink Water
==🏋️ Quick Workout== [15m]
🚿 Shower [10m]
🍳 Breakfast till 07:00
☕ Coffee & Journal [20m]
💼 Deep Work Session 1 [90m]
🍽️ Lunch till 12:30
💼 Deep Work Session 2 [90m]
🏃 Evening Run [30m]
📚 Reading till 20:00
🌙 Wind Down [30m]
```

### 💡 **Advanced Tips**

- **Combine Patterns**: `==🎯 Critical Task @09:00 [60m]==`
- **Flexible Timing**: Use `till` for end-time based tasks
- **Visual Organization**: Group related tasks with similar emojis
- **Priority Management**: Use `==` for must-do tasks
- **Time Blocking**: Structure your day with precise timing

---

## 📱 PWA Installation

### **Android Installation**

1. Open Chrome and navigate to your Routine Runner URL
2. Tap the **three dots** menu → "Add to Home Screen"
3. Tap **"Add"** to install the app
4. The app will appear on your home screen like a native app

### **iOS Installation**

1. Open Safari and navigate to your Routine Runner URL
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** to confirm
5. The app will be added to your home screen

### **Desktop Installation**

1. Open Chrome, Edge, or Firefox
2. Look for the **install icon** (⬇️) in the address bar
3. Click **"Install Routine Runner"**
4. The app will be available in your applications menu

> ✅ **Benefits**: Full-screen experience, offline access, faster loading, and native app feel

---

## 🎨 **User Interface Guide**

### **Main Screen**

- **Current Task**: Large, prominent display with timer/countdown
- **Progress Bar**: Visual indicator of routine completion
- **Control Buttons**: Done, Skip, Undo, and manual controls
- **Next Task Preview**: See what's coming up

### **Settings Panel**

- **Routine Editor**: Modify your daily routine
- **Theme Toggle**: Switch between dark and light modes
- **Auto-Advance**: Toggle automatic task progression
- **Log Management**: View and export your progress history

### **Status Indicators**

- **Sync Status**: Real-time connection status (Online/Offline/Error) with timestamp
- **User Avatar**: Shows your Google account profile picture
- **Priority Glow**: Golden border for high-priority tasks (==text==)
- **Progress Bar**: Visual indicator of routine completion percentage
- **Next Task Preview**: See what's coming up in your routine

---

## 🛠️ Technical Architecture

### **Frontend Stack**

- **HTML5**: Semantic markup with accessibility best practices
- **Vanilla JavaScript**: ES6+ modules, no framework dependencies
- **Tailwind CSS**: Utility-first styling via CDN
- **Font Awesome 6.4.0**: Comprehensive icon library
- **Google Fonts**: Inter (UI) and JetBrains Mono (Code)
- **Web APIs**: Wake Lock, Service Worker, Local Storage, Clipboard API

### **Backend Services**

- **Firebase Authentication**: Secure Google OAuth integration
- **Firestore Database**: Real-time document synchronization
- **Firebase Hosting**: Fast, global CDN deployment

### **PWA Features**

- **Service Worker**: Offline caching and background sync
- **Web App Manifest**: Native app installation
- **Responsive Design**: Mobile-first, desktop-compatible
- **Performance Optimized**: Minimal bundle size, fast loading

### **Data Structure**

```javascript
// User Document Structure (Firestore)
{
  rawRoutine: "Plain text routine with syntax",
  currentTaskIndex: 3,            // Current position in routine
  history: {                       // Daily completion logs
    "2024-01-15": [
      { time: "06:00:00", task: "Wake Up", status: "done" },
      { time: "06:15:00", task: "Exercise", status: "skipped" }
    ]
  },
  lastUpdated: 1705286400000      // Timestamp for sync
}

// Local Storage Keys
rr_firebase_config: "..."        // Firebase configuration object
rr_settings: {                   // User preferences
  darkMode: true,
  autoAdvance: false
}

// Parsed Task Object
{
  id: 0,                          // Line index
  raw: "🌅 Morning Routine @06:00",
  text: "Morning Routine",        // Clean text without syntax
  icon: "🌅",                     // First emoji from line
  type: "gate",                   // gate | timer | till | standard
  meta: "06:00",                  // Time or duration (seconds)
  isHigh: false                   // Priority flag (==text==)
}
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

<details>
<summary><strong>🔐 Authentication Problems</strong></summary>

**Problem**: Google sign-in popup closes immediately
**Solution**:

1. Check that your domain is in Firebase Auth → Settings → Authorized domains
2. Ensure you're using HTTPS in production
3. Clear browser cache and try again

</details>

<details>
<summary><strong>🚫 Permission Denied Errors</strong></summary>

**Problem**: "Permission denied" in Firestore
**Solution**:

1. Verify Firestore security rules are properly configured
2. Ensure user is authenticated before accessing data
3. Check that Firebase config is correctly entered

</details>

<details>
<summary><strong>📱 PWA Installation Issues</strong></summary>

**Problem**: Can't install on mobile
**Solution**:

1. Ensure you're using a supported browser (Chrome/Safari)
2. Check that the site is served over HTTPS
3. Try clearing browser cache and revisiting
4. Verify manifest.json is accessible

</details>

<details>
<summary><strong>🔔 Alarm Not Working</strong></summary>

**Problem**: No sound when task completes
**Solution**:

1. Browser may block autoplay - interact with page first
2. Check device volume and silent mode
3. Ensure browser has audio permissions
4. Try refreshing the page

</details>

### **Getting Help**

- 📖 Check this README first
- 🐛 [Report Issues on GitHub](https://github.com/PyNAABO/Routine-Runner/issues)
- 💬 [Join Discussions](https://github.com/PyNAABO/Routine-Runner/discussions)

---

## 📄 License & Credits

### **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 PyNAABO

### **Credits**

- **Icons**: [Font Awesome 6.4.0](https://fontawesome.com/) for UI icons
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for rapid UI development
- **Fonts**: [Inter](https://fonts.google.com/specimen/Inter) & [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) by Google Fonts
- **Authentication**: [Firebase](https://firebase.google.com/) for secure user management
- **Backend**: [Firestore](https://firebase.google.com/docs/firestore) for real-time database
- **Hosting**: Compatible with any static hosting (GitHub Pages, Netlify, Vercel, etc.)
- **PWA Tools**: [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) specification

### **Acknowledgments**

- Inspired by the need for distraction-free productivity tools
- Built with modern web standards for maximum compatibility
- Designed with privacy and user control as core principles
- Single-file architecture for easy deployment and maintenance
- Zero build step required - just serve and run

---

<div align="center">

**⭐ Star this repository if it helps you stay productive!**

[🔝 Back to Top](#-routine-runner-rr)

Made with ❤️ for productive people everywhere

</div>
