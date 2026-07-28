import React from "react";
import { Plus, Send } from "lucide-react";
import type { SubjectKey } from "../types";
import { SUBJECTS } from "../lib/constants";

interface ComposerProps {
  draft: string;
  setDraft: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isThinking: boolean;
  placeholder?: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  subject?: SubjectKey;
  setSubject?: (s: SubjectKey | undefined) => void;
  showChips?: boolean;
  chipsAlign?: "center" | "start";
  hint?: string;
}

export function Composer({
  draft,
  setDraft,
  onSend,
  onKeyDown,
  isThinking,
  placeholder = "Ask anything",
  textareaRef,
  subject,
  setSubject,
  showChips = false,
  chipsAlign = "center",
  hint,
}: ComposerProps) {
  return (
    <div className="aa-composer">
      {showChips && setSubject && (
        <div
          className="aa-chip-row"
          style={
            chipsAlign === "start"
              ? { justifyContent: "flex-start", marginBottom: 8, marginTop: 0 }
              : undefined
          }
        >
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
      )}

      <div className="aa-composer-box">
        <button className="aa-composer-plus" aria-label="Attach">
          <Plus size={16} />
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className="aa-send-btn" onClick={onSend} disabled={!draft.trim() || isThinking}>
          <Send size={15} />
        </button>
      </div>

      {hint && <div className="aa-composer-hint">{hint}</div>}
    </div>
  );
}
