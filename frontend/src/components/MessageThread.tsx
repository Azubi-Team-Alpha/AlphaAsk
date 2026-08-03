import React from "react";
import type { Message, SubjectKey, AttachedFile } from "../types";
import { MessageRow } from "./MessageRow";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { Composer } from "./Composer";
import { Download, BookOpen, LogIn } from "lucide-react";
import { exportSessionAsMarkdown } from "../lib/utils";

interface MessageThreadProps {
  messages: Message[];
  isThinking: boolean;
  draft: string;
  setDraft: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  subject: SubjectKey | undefined;
  setSubject: (s: SubjectKey | undefined) => void;
  attachedFile?: AttachedFile | null;
  onAttachFile?: (file: File) => void;
  onRemoveFile?: () => void;
  isAuthenticated: boolean;
  onSignUpClick?: () => void;
}

export function MessageThread({
  messages,
  isThinking,
  draft,
  setDraft,
  onSend,
  onKeyDown,
  subject,
  setSubject,
  attachedFile,
  onAttachFile,
  onRemoveFile,
  isAuthenticated,
  onSignUpClick,
}: MessageThreadProps) {
  const hasMessages = messages.length > 0;
  const showGuestBanner = !isAuthenticated && hasMessages;

  return (
    <>
      <div className="aa-thread-inner">
        {hasMessages && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 8px", marginBottom: 12 }}>
            <button
              className="aa-btn"
              style={{ fontSize: 12, padding: "5px 12px", gap: 6 }}
              onClick={() => exportSessionAsMarkdown(messages)}
              title="Download full Q&A thread as a formatted Markdown Study Guide"
            >
              <Download size={14} style={{ color: "var(--aa-accent)" }} />
              Export Study Guide (.md)
            </button>
          </div>
        )}
        {messages.map((m, idx) => {
          const prevQuestion = idx > 0 && messages[idx - 1].role === "user" ? messages[idx - 1].content : undefined;
          return <MessageRow key={m.id} message={m} previousUserQuestion={prevQuestion} />;
        })}
        {isThinking && <ThinkingIndicator />}

        {showGuestBanner && !isThinking && (
          <div
            style={{
              margin: "18px 0 8px",
              padding: "14px 18px",
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.10) 100%)",
              border: "1px solid rgba(99,102,241,0.30)",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, var(--aa-accent), #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <BookOpen size={17} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--aa-text)" }}>
                Your study session is not being saved
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--aa-text-muted)", lineHeight: 1.5 }}>
                Sign up for free to save your conversation history, bookmarks, and study notes.
              </p>
            </div>
            <button
              className="aa-btn aa-btn-primary"
              style={{ fontSize: 12, padding: "7px 14px", gap: 6, flexShrink: 0, whiteSpace: "nowrap" }}
              onClick={onSignUpClick}
            >
              <LogIn size={13} />
              Sign up free
            </button>
          </div>
        )}
      </div>

      <div className="aa-composer-wrap">
        <Composer
          draft={draft}
          setDraft={setDraft}
          onSend={onSend}
          onKeyDown={onKeyDown}
          isThinking={isThinking}
          placeholder="Ask AlphaAsk a question…"
          subject={subject}
          setSubject={setSubject}
          attachedFile={attachedFile}
          onAttachFile={onAttachFile}
          onRemoveFile={onRemoveFile}
          showChips
          chipsAlign="start"
          hint={
            isAuthenticated
              ? "Enter to send · Shift+Enter for a new line · Saved to your history"
              : "Enter to send · Shift+Enter for a new line · Not saved — sign up to keep this"
          }
        />
      </div>
    </>
  );
}
