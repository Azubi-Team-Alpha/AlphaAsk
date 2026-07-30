export function timeAgo(timestamp: number | string | Date | undefined | null): string {
  if (!timestamp) return "Recently";
  let time: number;
  if (typeof timestamp === "number") {
    time = timestamp;
  } else if (typeof timestamp === "string") {
    time = new Date(timestamp).getTime();
  } else if (timestamp instanceof Date) {
    time = timestamp.getTime();
  } else {
    return "Recently";
  }

  if (isNaN(time) || time <= 0) return "Recently";

  const diff = Math.max(0, Date.now() - time);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function saveAnswerToLocalStorage(question: string, answer: string, subject?: string): boolean {
  try {
    const raw = localStorage.getItem("alphaask_saved_answers");
    let list: any[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }
    const cleanQuestion = question.replace(/^📄\s*\[Attached:[^\]]+\]\s*/i, "").trim() || "Academic Query Answer";
    const newItem = {
      id: "sa-" + Date.now(),
      question: cleanQuestion.slice(0, 120),
      answer: answer,
      subject: subject || "academic",
      savedAt: Date.now(),
    };
    if (!list.some((item) => item.answer === answer)) {
      list.unshift(newItem);
      localStorage.setItem("alphaask_saved_answers", JSON.stringify(list));
    }
    return true;
  } catch {
    return false;
  }
}
