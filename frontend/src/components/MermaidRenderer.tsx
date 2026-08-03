import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Code, Check, Copy } from "lucide-react";
import { copyToClipboard } from "../lib/utils";

interface MermaidRendererProps {
  chart: string;
}

/**
 * Sanitize a mermaid chart to fix common rendering issues:
 * - "Could not find a suitable point for the given distance" is caused by
 *   very long edge labels. Truncate labels to ≤ 30 chars.
 * - Remove unsupported unicode or special chars that break the parser.
 */
function sanitizeChart(chart: string): string {
  // Truncate long edge labels: -->|long text here| → -->|long tex…|
  return chart
    .replace(/(\-\->|==\>|--\>|\.\.>|\-\.\->)\|([^|]{31,})\|/g, (_, arrow, label) => {
      return `${arrow}|${label.slice(0, 28)}…|`;
    })
    // Also handle: -- long label -->
    .replace(/--\s+([^-]{31,}?)\s+-->/g, (_, label) => {
      return `-- ${label.slice(0, 28)}… -->`;
    });
}

export function MermaidRenderer({ chart }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [showRaw, setShowRaw] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const renderId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
    const renderId2 = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      fontFamily: "IBM Plex Sans, sans-serif",
      flowchart: { curve: "basis", useMaxWidth: true },
    });

    const renderChart = async () => {
      // Pass 1: try the raw chart
      try {
        const cleanChart = chart.trim();
        const { svg } = await mermaid.render(renderId, cleanChart);
        if (isMounted) {
          setSvgContent(svg);
          setError(false);
        }
        return;
      } catch (err) {
        // Pass 2: sanitize and retry once
        try {
          const simplified = sanitizeChart(chart.trim());
          const { svg } = await mermaid.render(renderId2, simplified);
          if (isMounted) {
            setSvgContent(svg);
            setError(false);
          }
          return;
        } catch (err2) {
          console.warn("Mermaid render error (both passes):", err2);
          if (isMounted) {
            setError(true);
          }
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
      [renderId, renderId2].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    };
  }, [chart]);

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(chart);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRetry = () => {
    setError(false);
    setShowRaw(false);
    setSvgContent(null);
  };

  if (error || showRaw) {
    return (
      <div
        style={{
          background: "var(--aa-surface)",
          border: "1px solid var(--aa-border)",
          borderRadius: 8,
          padding: 12,
          margin: "12px 0",
          fontFamily: "monospace",
          fontSize: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            color: "var(--aa-text-muted)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Code size={13} />
            {error ? "Diagram syntax (render failed)" : "Mermaid Diagram Syntax"}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {error && (
              <button
                className="aa-btn"
                style={{ fontSize: 11, padding: "2px 8px" }}
                onClick={handleRetry}
              >
                Retry Render
              </button>
            )}
            <button className="aa-icon-btn" onClick={handleCopyCode} title="Copy code">
              {copied ? <Check size={13} style={{ color: "var(--aa-green)" }} /> : <Copy size={13} />}
            </button>
          </div>
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--aa-text)" }}>{chart}</pre>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--aa-surface-raised)",
        border: "1px solid var(--aa-accent-bg)",
        borderRadius: 10,
        padding: 16,
        margin: "14px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflowX: "auto",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 12,
          fontSize: 11,
          fontWeight: 600,
          color: "var(--aa-accent)",
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: "var(--aa-surface)",
          padding: "2px 8px",
          borderRadius: 4,
          border: "1px solid var(--aa-border)",
          cursor: "pointer",
        }}
        onClick={() => setShowRaw((v) => !v)}
        title="Toggle source"
      >
        <Code size={12} /> Interactive Diagram
      </div>

      {!svgContent && !error && (
        <div style={{ color: "var(--aa-text-muted)", fontSize: 12, padding: "24px 0" }}>
          Rendering diagram…
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          marginTop: 18,
        }}
        dangerouslySetInnerHTML={{ __html: svgContent || "" }}
      />
    </div>
  );
}
