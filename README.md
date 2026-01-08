# 📅 Routine Runner (RR)

A distraction-free, privacy-focused Progressive Web App (PWA) designed to execute daily routines with precision. It parses simple text-based schedules into an interactive, synchronized interface, reducing cognitive load during high-focus periods.

## 📖 Project Overview

Routine Runner solves the "cold start" problem of daily habits. Instead of managing complex databases, it accepts a human-readable text block (e.g., 🔕 Alarm Off `@05:00`) and converts it into a live, state-managed workflow.

---

### Key Features

- **Natural Language Parsing:** Type your routine in plain text.
- **Live Synchronization:** Instantly syncs state between Phone & Laptop (using Firestore).
- **Continuous Alarms:** Optional looping alarms for critical time gates.
- **Mobile-First PWA:** Installable on Android/iOS (full-screen, no address bar).
- **Wake Lock:** Keeps the screen on during tasks.

---

## ⚠️ Critical Setup Guide (Read this first)

**If you fork this repository, you MUST configure Firebase correctly, or the app may fail silently or show "Permission Denied" errors.**

### 1) Firebase Authentication (The "Domain" Trap)

1. Open Firebase Console → **Authentication → Sign-in method**.
2. Enable **Google** as a sign-in provider.
3. Go to **Authentication → Settings → Authorized domains** and add your hosting domain(s):
   - Add `localhost` and `127.0.0.1` for local testing.
   - Add `yourusername.github.io` (or your custom domain) for GitHub Pages.

> If you don't add authorized domains, the Google popup will close immediately and sign-in will fail.

### 2) Firestore Database (The "Rules" Trap)

1. Open **Firestore Database → Create database** and choose **Production mode** (or test if you know what you're doing).
2. After the DB is created, open the **Rules** tab and replace the defaults with the following rules (then **Publish**):

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

> Using these rules ensures only authenticated users can read/write. Misconfigured rules are the most common cause of "Permission Denied".

---

## 🚀 Installation & Usage

Choose one of the following options:

### Option A — Use the Live App

Visit the GitHub Pages deployment: (add your deployment link here).

### Option B — Self-host locally

1. Clone the repository:

```bash
git clone https://github.com/yourusername/routine-runner.git
```

1. Get your Firebase config:

- In Firebase Console → **Project settings → General → Your apps → Web App**, copy the `firebaseConfig` JSON object.

1. Connect the app:

- Open the app and go to the **"Connect Database"** screen.
- Recommended (secure): Create a **Secret Gist** on GitHub containing your `firebaseConfig` JSON, click **Raw**, copy the URL, and paste it into the app.
- Alternative (quick): Paste the JSON directly into the provided text area.

---

## 📱 Syntax Guide

The app interprets specific patterns in your text. Use the table below for reference.

| Syntax | Behavior | Example |
| -------- | ---------- | --------- |
| `@HH:MM` | **Hard Gate** — blocks progress until the time is reached; optional looping alarm | `Wake Up @05:00` |
| `[Xm]` | **Timer** — starts a countdown; alarm loops when finished | `Brush [2m]` |
| `till HH:MM` | **Till** — calculates remaining time until the target and runs a countdown | `Study: till 07:00` |
| `==Text==` | **Highlight** — marked as high priority with a golden border | `==Tahajjud==` |
| Emoji at start | **Icon** — first emoji becomes the task icon | `💧 Drink Water` |

---

## 📲 PWA Installation

To get the full-screen experience on mobile:

1. Open the site in Chrome (Android) or Safari (iOS).
2. Tap Menu (3 dots) or Share.
3. Tap **"Add to Home Screen"** (Android) or **"Add to Home Screen"** (iOS) / **Install App**.

---

## 🛠 Tech Stack

- **Frontend:** HTML5, Vanilla JS, Tailwind CSS
- **Backend:** Firebase Authentication & Firestore
- **Hosting:** GitHub Pages

---

## 📄 License

MIT License
