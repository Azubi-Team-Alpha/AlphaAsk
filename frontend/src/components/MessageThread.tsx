import React from "react";
import type { Message, SubjectKey } from "../types";
import { MessageRow } from "./MessageRow";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { Composer } from "./Composer";
import { Download } from "lucide-react";
import { exportSessionAsMarkdown } from "../lib/utils";

interface AttachedFile {
  name: string;
  content: string;
}

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
}: MessageThreadProps) {
  return (
    <>
      <div className="aa-thread-inner">
        {messages.length > 0 && (
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
