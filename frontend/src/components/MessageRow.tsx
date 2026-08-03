import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Message, Tone } from "../types";
import { Sparkles, Check, Copy, Bookmark, BookmarkCheck, Layers, Quote } from "lucide-react";
import { saveAnswerToLocalStorage, copyToClipboard } from "../lib/utils";
import { FlashcardModal } from "./FlashcardModal";
import { CitationModal } from "./CitationModal";

interface MessageRowProps {
  message: Message;
  previousUserQuestion?: string;
}

const toneStyles: Record<Tone, { label: string; className: string; icon: React.ReactNode }> = {
  informational: { label: "Informational", className: "aa-tag-info", icon: <Sparkles size={11} /> },
  academic: { label: "Academic", className: "aa-tag-academic", icon: <Sparkles size={11} /> },
  clarifying: { label: "Clarifying", className: "aa-tag-clarifying", icon: <Sparkles size={11} /> },
};

export function MessageRow({ message, previousUserQuestion }: MessageRowProps) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showCitation, setShowCitation] = useState(false);

  const isUser = message.role === "user";

  const handleSave = () => {
    const q = previousUserQuestion || "Academic Answer Bookmark";
    const ok = saveAnswerToLocalStorage(q, message.content, message.subject);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(message.content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isUser) {
    return (
      <div className="aa-row aa-user">
        <div className="aa-bubble-user">{message.content}</div>
      </div>
    );
  }

  return (
    <div className="aa-row">
      <div className="aa-assistant-wrap">
        <div className="aa-assistant-mark">α</div>
        <div className="aa-assistant-body">
          <div className="aa-assistant-text">
            <ReactMarkdown
              components={{
                code({ inline, className, children, ...props }: any) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
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
                onClick={() => setShowFlashcards(true)}
                title="Generate Flashcards & Quiz from this answer"
              >
                <Layers size={13} style={{ color: "var(--aa-accent)" }} />
                Flashcards & Quiz
              </button>

              <button
                className="aa-action-btn"
                onClick={() => setShowCitation(true)}
                title="Generate Academic Citation (APA, MLA, Harvard, IEEE)"
              >
                <Quote size={13} />
                Cite Answer
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

      {showFlashcards && (
        <FlashcardModal
          onClose={() => setShowFlashcards(false)}
          title={previousUserQuestion || "Academic Study Subject"}
          content={message.content}
        />
      )}

      {showCitation && (
        <CitationModal
          onClose={() => setShowCitation(false)}
          title={previousUserQuestion || "Academic Subject Explanation"}
        />
      )}
    </div>
  );
}
