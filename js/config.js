export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCCHeGuHqy2aQzwmmy7G7tGEs0v_t6hmkE",
  authDomain: "routine-runner-3b538.firebaseapp.com",
  projectId: "routine-runner-3b538",
  storageBucket: "routine-runner-3b538.firebasestorage.app",
  messagingSenderId: "1089575788718",
  appId: "1:1089575788718:web:73973fb3f8c3f909fd4d3f",
  measurementId: "G-VZM3EHHZEX",
};

export const ALARM_FILE = "assets/iphone_alarm.mp3";
export const VALID_PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export const EXAMPLE_ROUTINE = `🌅 Wake Up [@06:30]                          # gate: waits until 6:30 AM
🦷 Brush Teeth [5m]                          # timer: 5 min countdown
🧘 Morning Stretch:                          # sub-routine parent (ends with colon)
- Deep breathing [2m]                        # sub-routine item with timer
- Sun salutation [3m]                        # sub-routine item with timer
📖 ==Daily Insights== [15m]                  # high priority (==...==) + timer
☕ Breakfast [=>08:00]                        # till: countdown until 8:00 AM
💻 Focus Session:                            # sub-routine parent
- Plan top 3 [5m]                            # sub timer
- Deep work [120m]                           # 2 hour timer
- Review & log [10m]                         # timer review
🕌 Fajr Prayer [@Prayer:Fajr]                # prayer gate: waits until Fajr time
📚 Study [90m]                               # 1h30m timer (90 minutes)
🔥 ==Gym==:                                  # high priority sub-routine parent
- Cardio [20m]                               # sub timer
- Strength [30m]                             # sub timer
🕌 Dhuhr Prayer [@Prayer:Dhuhr]              # prayer gate
🥗 Lunch [=>Prayer:Dhuhr]                    # prayer till: countdown until Dhuhr
💼 Submit report [https://example.com]       # task with clickable link
IF:FRI::🕌 Jumu'ah Prep [20m] | ELSE::🕌 Asr Prayer [@Prayer:Asr]   # IF on Fri, ELSE other days
🚶 Evening Walk [45m]                        # timer walk
📝 ==Daily Review==:                         # high priority sub-routine parent
- Log completed tasks                        # standard sub item (no timer)
- Plan tomorrow [10m]                        # sub timer
IF:SAT::🎬 Movie Night [120m] | ELSE::🎧 Personal Project [60m]     # weekend conditional
🌙 Wind Down [15m]                           # timer wind down
🕌 Isha Prayer [@Prayer:Isha]                # prayer gate
😴 Sleep [@22:00]                            # gate: waits until 10:00 PM`;
