# 📅 Routine Runner

A distraction-free, privacy-focused progressive web app (PWA) designed to execute daily routines with precision. It parses simple text-based schedules into an interactive, synchronized interface, reducing cognitive load during high-focus periods.

## 📖 Project Overview

Routine Runner solves the "cold start" problem of daily habits. Instead of managing complex databases or rigid calendar entries, it accepts a human-readable text block (e.g., 🔕 Alarm Off `@05:00`) and converts it into a live, state-managed workflow.

### Key Features

- **Natural Language Parsing:** Type your routine in plain text; the app handles the logic.  
- **Live Synchronization:** Uses Firebase Firestore to sync state instantly between devices (e.g., Phone ↔ Laptop).  
- **Focus Mode:** Displays only the current task to prevent overwhelm.  
- **Wake Lock:** Prevents device sleep during long tasks (reading, studying, prayer).

## 🛠 Tech Stack

- **Frontend:** HTML5, Vanilla JavaScript (ES6+).  
- **Styling:** Tailwind CSS (via CDN for lightweight loading).  
- **Backend / Database:** Firebase Firestore (NoSQL).  
- **Auth:** Firebase Authentication (Google Sign-In).  
- **Hosting:** GitHub Pages.

## ⚙️ Core Logic & Syntax

The app features a custom parser that interprets the following syntax from the user's input:

| Syntax | Description | Behavior |
| -------- | ------------- | ---------- |
| `@HH:MM` | Hard Start | Blocks progress until the specific time is reached. Triggers an alarm. |
| `[Xm]` | Duration | Starts a countdown timer (e.g., `[20m]`) upon task activation. |
| `till HH:MM` | End Constraint | Calculates remaining time until the target hour and runs a countdown. |
| `==Text==` | Priority | Visually highlights the task (Gold/Bold) for critical habits. |
| Standard Text | Task | A simple checkbox item. |

### Example Input

```text
🔕 Alarm Off @05:00
💧 Drink Water
🪥 Brush [2m]
📚 Deep Work: till 07:00
```

## 🚀 Setup & Installation

To run this project locally or fork it for your own use:

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/routine-runner.git
```

### Firebase Setup

- Create a project in the Firebase Console.  
- Enable Authentication (Google Sign-In).  
- Enable Cloud Firestore (create a database in production or test mode as appropriate).  
- Copy your web app configuration keys (JSON object).

**Configuration:**

- Create a file named `config.js` in the project root (add it to `.gitignore` to avoid committing secrets).
- Add your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export default firebaseConfig;
```

#### Run & Connect

- Open `index.html` in your browser.  
- You will see a **"Connect Database"** setup screen.

Options to provide configuration:

- **Option A (Direct):** Paste your Firebase JSON object directly into the text area.  
- **Option B (Secure Gist):**
  1. Create a **Secret Gist** on GitHub containing your config JSON.  
  2. Click the **Raw** button on the gist.  
  3. Copy the URL and paste it into the app.

#### Sync

Repeat the Run & Connect step on any new device (Phone/Laptop) to link them to the same database.

## 📱 Mobile Support

The application is designed with a *mobile-first* approach, optimized for touch targets and small screens (tested on Samsung Galaxy M series). It utilizes the Screen Wake Lock API to maintain visibility during hands-free tasks.

## 🤝 Contributing

Contributions are welcome. Please open an issue to discuss proposed changes or feature requests.

## 📄 License

This project is open source and available under the MIT License.

---
