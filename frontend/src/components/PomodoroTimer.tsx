import { useState, useEffect } from "react";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";

export function PomodoroTimer() {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      if (mode === "focus") {
        setMode("break");
        setSecondsLeft(5 * 60);
      } else {
        setMode("focus");
        setSecondsLeft(25 * 60);
      }
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(mode === "focus" ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const remainderSeconds = secondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${remainderSeconds.toString().padStart(2, "0")}`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "var(--aa-surface)",
        border: "1px solid var(--aa-border)",
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 600,
        color: "var(--aa-text)",
      }}
      title={`Pomodoro Study Timer (${mode === "focus" ? "25m Focus" : "5m Break"})`}
    >
      <Timer size={13} style={{ color: mode === "focus" ? "var(--aa-accent)" : "var(--aa-green)" }} />
      <span style={{ fontFamily: "monospace", minWidth: 38 }}>{formattedTime}</span>

      <button
        onClick={toggleTimer}
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--aa-text)", display: "flex", padding: 2 }}
        aria-label={isActive ? "Pause timer" : "Start timer"}
      >
        {isActive ? <Pause size={12} /> : <Play size={12} />}
      </button>

      <button
        onClick={resetTimer}
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--aa-text-muted)", display: "flex", padding: 2 }}
        aria-label="Reset timer"
      >
        <RotateCcw size={11} />
      </button>
    </div>
  );
}
