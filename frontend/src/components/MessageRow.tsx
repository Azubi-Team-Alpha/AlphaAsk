import { useState } from "react";
import type { Message } from "../types";
import { toneStyles } from "../lib/toneStyles";
import ReactMarkdown from "react-markdown";
import { Bookmark, BookmarkCheck, Copy, Check } from "lucide-react";
import { saveAnswerToLocalStorage } from "../lib/utils";

interface MessageRowProps {
  message: Message;
  previousUserQuestion?: string;
}

export function MessageRow({ message, previousUserQuestion }: MessageRowProps) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  if (message.role === "user") {
    return (
      <div className="aa-row aa-user">
        <div className="aa-bubble-user">{message.content}</div>
      </div>
    );
  }

  const handleSave = () => {
    const q = previousUserQuestion || "Academic Answer Bookmark";
    const ok = saveAnswerToLocalStorage(q, message.content, message.subject);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="aa-row">
      <div className="aa-assistant-wrap">
        <div className="aa-assistant-mark">α</div>
        <div className="aa-assistant-body">
          <div className="aa-assistant-text">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          {message.annotations && message.annotations.length > 0 && (
            <div className="aa-margin">
              {message.annotations.map((a, i) => (
                <span className={`aa-tag ${toneStyles[a.tone].className}`} key={i}>
                  {toneStyles[a.tone].icon}
                  {a.label}
                </span>
              ))}
            </div>
          )}

          {message.content && (
            <div className="aa-message-actions">
              <button
                className={`aa-action-btn ${saved ? "aa-saved" : ""}`}
                onClick={handleSave}
                title="Save answer to your bookmarks"
              >
                {saved ? <BookmarkCheck size={13} style={{ color: "var(--aa-accent)" }} /> : <Bookmark size={13} />}
                {saved ? "Saved to Bookmarks!" : "Save answer"}
              </button>
              <button
                className="aa-action-btn"
                onClick={handleCopy}
                title="Copy markdown answer to clipboard"
              >
                {copied ? <Check size={13} style={{ color: "var(--aa-green)" }} /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
