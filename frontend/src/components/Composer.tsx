import React, { useRef } from "react";
import { Plus, Send, FileText, X } from "lucide-react";
import type { SubjectKey, AttachedFile } from "../types";
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
  attachedFile?: AttachedFile | null;
  onAttachFile?: (file: File) => void;
  onRemoveFile?: () => void;
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
  attachedFile,
  onAttachFile,
  onRemoveFile,
  showChips = false,
  chipsAlign = "center",
  hint,
}: ComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onAttachFile) {
      onAttachFile(files[0]);
    }
    // reset input so same file can be uploaded again if needed
    e.target.value = "";
  };

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

      {attachedFile && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
            fontSize: 12,
            padding: "4px 10px",
            borderRadius: 6,
            background: "var(--aa-surface-raised)",
            border: "1px solid var(--aa-accent)",
            color: "var(--aa-accent)",
            width: "fit-content",
          }}
        >
          <FileText size={14} />
          <span>
            {attachedFile.name}
            {attachedFile.sizeFormatted ? ` (${attachedFile.sizeFormatted})` : ""}
          </span>
          <button
            onClick={onRemoveFile}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--aa-accent)",
              display: "flex",
              alignItems: "center",
              padding: 0,
              marginLeft: 4,
            }}
            aria-label="Remove attached file"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <div className="aa-composer-box">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.txt,.md,.doc,.docx,.csv,.json,.py,.js,.ts,.jsx,.tsx,.java,.cpp,.c,.h,.hpp,.cs,.html,.css,.sql,.r,.sh"
          style={{ display: "none" }}
        />
        <button
          className="aa-composer-plus"
          aria-label="Attach document or lecture notes"
          onClick={handlePlusClick}
          title="Attach document or lecture notes"
        >
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
