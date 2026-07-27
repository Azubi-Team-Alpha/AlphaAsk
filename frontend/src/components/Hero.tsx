import React from "react";
import type { CurrentUser, SubjectKey } from "../types";
import { STARTERS, SUBJECTS } from "../lib/constants";
import { Composer } from "./Composer";

interface HeroProps {
  isAuthenticated: boolean;
  currentUser: CurrentUser | null;
  draft: string;
  setDraft: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isThinking: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  subject: SubjectKey | undefined;
  setSubject: (s: SubjectKey | undefined) => void;
  onStarterClick: (prompt: string) => void;
  onSignUpClick: () => void;
}

export function Hero({
  isAuthenticated,
  currentUser,
  draft,
  setDraft,
  onSend,
  onKeyDown,
  isThinking,
  textareaRef,
  subject,
  setSubject,
  onStarterClick,
  onSignUpClick,
}: HeroProps) {
  return (
    <div className="aa-hero-wrap">
      <div className="aa-hero">
        <div className="aa-hero-title">
          {isAuthenticated
            ? `Ready when you are, ${currentUser?.name.split(" ")[0]}.`
            : "What are you working on?"}
        </div>

        <Composer
          draft={draft}
          setDraft={setDraft}
          onSend={onSend}
          onKeyDown={onKeyDown}
          isThinking={isThinking}
          textareaRef={textareaRef}
        />

        <div className="aa-starter-row">
          {STARTERS.map((s) => (
            <button className="aa-starter" key={s.label} onClick={() => onStarterClick(s.prompt)}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <div className="aa-chip-row">
          {SUBJECTS.map((s) => (
            <button
              key={s.key}
              className={`aa-chip ${subject === s.key ? "aa-chip-active" : ""}`}
              onClick={() => setSubject(subject === s.key ? undefined : s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {!isAuthenticated && (
          <p style={{ fontSize: 11.5, color: "var(--aa-text-muted)", marginTop: 18 }}>
            This conversation won't be saved.{" "}
            <button
              onClick={onSignUpClick}
              style={{
                background: "none",
                border: "none",
                color: "var(--aa-text)",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Sign up
            </button>{" "}
            to keep your history.
          </p>
        )}
      </div>
    </div>
  );
}
