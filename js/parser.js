import { VALID_PRAYER_NAMES } from "./config.js";
import { validatePrayerName } from "./prayer.js";

export function checkCondition(cond) {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const today = days[new Date().getDay()];
  if (cond.startsWith("!")) {
    return today !== cond.substring(1);
  }
  return today === cond;
}

export function parseRoutine(text) {
  const lines = text.split("\n");

  function parseLine(line, index) {
    if (line.trim() === "") return null;
    let rawLine = line.trim();

    const isSubRoutineItem = rawLine.startsWith("- ");
    if (isSubRoutineItem) {
      rawLine = rawLine.substring(2).trim();
    }

    if (rawLine.startsWith("IF:")) {
      const firstSeparator = rawLine.indexOf("::");
      if (firstSeparator !== -1) {
        const condition = rawLine.substring(3, firstSeparator);
        const remainder = rawLine.substring(firstSeparator + 2);

        let mainTask = remainder;
        let elsePart = null;

        if (remainder.includes("| ELSE::")) {
          const elseSplit = remainder.split("| ELSE::");
          mainTask = elseSplit[0];
          elsePart = elseSplit[1];
        }

        if (checkCondition(condition)) {
          rawLine = mainTask;
        } else if (elsePart) {
          rawLine = elsePart;
        } else {
          return null;
        }
      }
    }

    let type = "standard", meta = null, cleanText = rawLine.split("#")[0].trim();

    const isSubRoutineParent = cleanText.endsWith(":") && !isSubRoutineItem;
    if (isSubRoutineParent) {
      cleanText = cleanText.slice(0, -1).trim();
    }

    const prayerGateMatch = rawLine.match(/\[@Prayer:(\w+)\]/i);
    if (prayerGateMatch) {
      const prayerName = prayerGateMatch[1];
      if (!validatePrayerName(prayerName)) {
        console.warn(`Invalid prayer name: ${prayerName}. Valid names: ${VALID_PRAYER_NAMES.join(", ")}`);
      }
      type = "prayerGate";
      meta = prayerName;
      cleanText = cleanText.replace(prayerGateMatch[0], "").trim();
    }

    const prayerTillMatch = rawLine.match(/\[=>Prayer:(\w+)\]/i);
    if (prayerTillMatch) {
      const prayerName = prayerTillMatch[1];
      if (!validatePrayerName(prayerName)) {
        console.warn(`Invalid prayer name: ${prayerName}. Valid names: ${VALID_PRAYER_NAMES.join(", ")}`);
      }
      type = "prayerTill";
      meta = prayerName;
      cleanText = cleanText.replace(prayerTillMatch[0], "").trim();
    }

    const gateMatch = rawLine.match(/\[@(\d{1,2}:\d{2})\]/);
    if (gateMatch && type === "standard") {
      type = "gate";
      meta = gateMatch[1];
      cleanText = cleanText.replace(gateMatch[0], "").trim();
    }

    const tillMatch = rawLine.match(/\[=>(\d{1,2}:\d{2})\]/);
    if (tillMatch && type === "standard") {
      type = "till";
      meta = tillMatch[1];
      cleanText = cleanText.replace(tillMatch[0], "").trim();
    }

    const durationMatch = rawLine.match(/\[(\d+)m\]/i);
    if (durationMatch && type === "standard") {
      type = "timer";
      meta = parseInt(durationMatch[1]) * 60;
      cleanText = cleanText.replace(durationMatch[0], "").trim();
    }

    const linkMatch = rawLine.match(/\[(https?:\/\/[^\]]+)\]/);
    let link = null;
    if (linkMatch) {
      link = linkMatch[1];
      cleanText = cleanText.replace(linkMatch[0], "").trim();
    }

    const highMatch = rawLine.match(/==(.*?)==/);
    let isHigh = false;
    if (highMatch) {
      isHigh = true;
      cleanText = cleanText.replace(/==/g, "").trim();
    }

    const emojiMatch = cleanText.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
    const icon = emojiMatch ? emojiMatch[0] : "✅";

    const displayText = cleanText.replace(icon, "").trim();

    return {
      id: index,
      raw: line,
      text: displayText,
      icon,
      type,
      meta,
      link,
      isHigh,
      isSubRoutineParent,
      isSubRoutineItem,
      subRoutines: [],
    };
  }

  const parsedLines = lines
    .map((line, index) => parseLine(line, index))
    .filter((t) => t !== null);

  const result = [];
  for (let i = 0; i < parsedLines.length; i++) {
    const task = parsedLines[i];

    if (task.isSubRoutineItem) {
      if (result.length > 0 && result[result.length - 1].isSubRoutineParent) {
        result[result.length - 1].subRoutines.push(task);
      } else {
        task.isSubRoutineItem = false;
        result.push(task);
      }
    } else {
      result.push(task);
    }
  }

  return result;
}
