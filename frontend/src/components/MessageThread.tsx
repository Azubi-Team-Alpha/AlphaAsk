import React from "react";
import type { Message, SubjectKey } from "../types";
import { MessageRow } from "./MessageRow";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { Composer } from "./Composer";

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
