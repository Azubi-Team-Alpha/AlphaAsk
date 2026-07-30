import { X, MoreHorizontal, Cpu, Keyboard, ShieldCheck, CheckCircle2 } from "lucide-react";

interface MoreModalProps {
  onClose: () => void;
}

export function MoreModal({ onClose }: MoreModalProps) {
  return (
    <div className="aa-modal-overlay" onMouseDown={onClose}>
      <div
        className="aa-modal-card"
        style={{ maxWidth: 620, width: "92%", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="aa-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div className="aa-mark" style={{ background: "var(--aa-accent)", color: "var(--aa-accent-ink)" }}>
            <MoreHorizontal size={16} />
          </div>
          <div>
            <h2 className="aa-modal-title" style={{ margin: 0 }}>Platform & Study Toolkit</h2>
          </div>
        </div>
        <p className="aa-modal-sub" style={{ marginBottom: 16 }}>
          Explore shortcuts, system diagnostics, and academic support guidelines for AlphaAsk.
        </p>

        <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Section 1: Multi-Provider LLM Engine Status */}
          <div
            style={{
              border: "1px solid var(--aa-border)",
              borderRadius: 12,
              padding: 14,
              background: "var(--aa-bg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Cpu size={18} style={{ color: "var(--aa-accent)" }} />
              <h3 style={{ fontSize: 14.5, fontWeight: 600, margin: 0, color: "var(--aa-text)" }}>
                Multi-Provider AI Orchestrator
              </h3>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--aa-text-muted)", marginBottom: 10, lineHeight: 1.4 }}>
              AlphaAsk automatically routes questions through a high-availability failover chain to guarantee 99.9% uptime.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--aa-text)" }}>
                  <CheckCircle2 size={14} style={{ color: "var(--aa-green)" }} /> Groq Cloud (Llama 3.3 70B)
                </span>
                <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "var(--aa-green-bg)", color: "var(--aa-green)", fontWeight: 600 }}>
                  Primary (Active)
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--aa-text)" }}>
                  <CheckCircle2 size={14} style={{ color: "var(--aa-green)" }} /> Google Gemini 2.0 Flash
                </span>
                <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "var(--aa-surface)", color: "var(--aa-text-muted)" }}>
                  Secondary Fallback
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--aa-text)" }}>
                  <CheckCircle2 size={14} style={{ color: "var(--aa-green)" }} /> AWS Bedrock (Claude 3.5 / Nova)
                </span>
                <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "var(--aa-surface)", color: "var(--aa-text-muted)" }}>
                  Cloud Fallback
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Keyboard Shortcuts */}
          <div
            style={{
              border: "1px solid var(--aa-border)",
              borderRadius: 12,
              padding: 14,
              background: "var(--aa-bg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Keyboard size={18} style={{ color: "var(--aa-accent)" }} />
              <h3 style={{ fontSize: 14.5, fontWeight: 600, margin: 0, color: "var(--aa-text)" }}>
                Keyboard Shortcuts
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--aa-surface)", borderRadius: 6, fontSize: 12.5 }}>
                <span>Send Question</span>
                <kbd style={{ background: "var(--aa-border)", padding: "1px 5px", borderRadius: 4, fontFamily: "IBM Plex Mono, monospace" }}>Enter</kbd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--aa-surface)", borderRadius: 6, fontSize: 12.5 }}>
                <span>New Line</span>
                <kbd style={{ background: "var(--aa-border)", padding: "1px 5px", borderRadius: 4, fontFamily: "IBM Plex Mono, monospace" }}>Shift + Enter</kbd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--aa-surface)", borderRadius: 6, fontSize: 12.5 }}>
                <span>Search Questions</span>
                <kbd style={{ background: "var(--aa-border)", padding: "1px 5px", borderRadius: 4, fontFamily: "IBM Plex Mono, monospace" }}>Ctrl / ⌘ + K</kbd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--aa-surface)", borderRadius: 6, fontSize: 12.5 }}>
                <span>Toggle Theme</span>
                <kbd style={{ background: "var(--aa-border)", padding: "1px 5px", borderRadius: 4, fontFamily: "IBM Plex Mono, monospace" }}>Ctrl / ⌘ + T</kbd>
              </div>
            </div>
          </div>

          {/* Section 3: Academic Integrity */}
          <div
            style={{
              border: "1px solid var(--aa-border)",
              borderRadius: 12,
              padding: 14,
              background: "var(--aa-bg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <ShieldCheck size={18} style={{ color: "var(--aa-green)" }} />
              <h3 style={{ fontSize: 14.5, fontWeight: 600, margin: 0, color: "var(--aa-text)" }}>
                Academic Integrity & Verification
              </h3>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--aa-text-muted)", lineHeight: 1.5, margin: 0 }}>
              AlphaAsk is engineered as a learning assistant to clarify concepts, step through problem-solving methods, and assist in study planning. Always cross-reference explanations with course lectures and recommended textbooks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
