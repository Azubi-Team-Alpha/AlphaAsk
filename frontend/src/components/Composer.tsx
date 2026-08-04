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
  ragMode?: boolean;
  toggleRagMode?: () => void;
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
  ragMode,
  toggleRagMode,
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

      {(attachedFile || toggleRagMode) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          {attachedFile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 6,
                background: attachedFile.status === "parsing" ? "rgba(234, 179, 8, 0.12)" : "var(--aa-surface-raised)",
                border: attachedFile.status === "parsing" ? "1px solid #eab308" : "1px solid var(--aa-accent)",
                color: attachedFile.status === "parsing" ? "#eab308" : "var(--aa-accent)",
                width: "fit-content",
              }}
            >
              <FileText size={14} />
              <span>
                {attachedFile.name}
                {attachedFile.sizeFormatted ? ` (${attachedFile.sizeFormatted})` : ""}
                <span style={{ marginLeft: 6, fontWeight: 600 }}>
                  {attachedFile.status === "parsing" && " • ⏳ Parsing..."}
                  {attachedFile.status === "ready" && ` • ✅ Ready (${attachedFile.wordCount ?? 0} words parsed)`}
                  {attachedFile.status === "error" && " • ❌ Parsing error"}
                </span>
              </span>
              <button
                onClick={onRemoveFile}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "inherit",
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

          {toggleRagMode && (
            <button
              onClick={toggleRagMode}
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 20,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: ragMode ? "rgba(16, 185, 129, 0.15)" : "var(--aa-surface-raised)",
                border: ragMode ? "1px solid #10b981" : "1px solid var(--aa-border)",
                color: ragMode ? "#10b981" : "var(--aa-text-muted)",
              }}
              title="Toggle Strict Document Grounding Mode: Restricts AI responses strictly to facts inside attached documents"
            >
              <span style={{ fontSize: 13 }}>⚡</span>
              <span>RAG Strict Grounding: {ragMode ? "ON" : "OFF"}</span>
            </button>
          )}
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
        <button
          className="aa-send-btn"
          onClick={onSend}
          disabled={!draft.trim() || isThinking || attachedFile?.status === "parsing"}
        >
          <Send size={15} />
        </button>
      </div>

      {hint && <div className="aa-composer-hint">{hint}</div>}
    </div>
  );
}
