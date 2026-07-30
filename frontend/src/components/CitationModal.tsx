import { useState } from "react";
import { X, Quote, Copy, Check } from "lucide-react";
import { generateCitation } from "../lib/citationUtils";
import type { CitationStyle } from "../lib/citationUtils";
import { copyToClipboard } from "../lib/utils";

interface CitationModalProps {
  onClose: () => void;
  title?: string;
}

export function CitationModal({ onClose, title = "Academic Subject Explanation" }: CitationModalProps) {
  const [style, setStyle] = useState<CitationStyle>("APA7");
  const [copied, setCopied] = useState(false);

  const citationText = generateCitation(title, style);

  const handleCopy = async () => {
    const ok = await copyToClipboard(citationText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="aa-modal-overlay" onMouseDown={onClose}>
      <div
        className="aa-modal-card"
        style={{ maxWidth: 580, width: "92%" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="aa-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div className="aa-mark" style={{ background: "var(--aa-accent)", color: "var(--aa-accent-ink)" }}>
            <Quote size={16} />
          </div>
          <div>
            <h2 className="aa-modal-title" style={{ margin: 0 }}>Academic Citation Generator</h2>
          </div>
        </div>
        <p className="aa-modal-sub" style={{ marginBottom: 16 }}>
          Generate standard university references for course assignments and research papers.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {(["APA7", "MLA9", "Harvard", "IEEE"] as CitationStyle[]).map((st) => (
            <button
              key={st}
              className={`aa-btn ${style === st ? "aa-btn-primary" : ""}`}
              onClick={() => setStyle(st)}
              style={{ flex: 1, justifyContent: "center", fontSize: 12.5 }}
            >
              {st}
            </button>
          ))}
        </div>

        <div
          style={{
            background: "var(--aa-surface)",
            border: "1px solid var(--aa-border)",
            borderRadius: 10,
            padding: 16,
            fontSize: 13.5,
            lineHeight: 1.6,
            fontFamily: "monospace",
            color: "var(--aa-text)",
            marginBottom: 16,
            wordBreak: "break-word",
          }}
        >
          {citationText}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="aa-btn aa-btn-primary" onClick={handleCopy}>
            {copied ? <Check size={14} style={{ color: "var(--aa-green)" }} /> : <Copy size={14} />}
            {copied ? "Copied Citation!" : "Copy Citation"}
          </button>
        </div>
      </div>
    </div>
  );
}
