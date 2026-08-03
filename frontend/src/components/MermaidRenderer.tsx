import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Code, Check, Copy } from "lucide-react";
import { copyToClipboard } from "../lib/utils";

interface MermaidRendererProps {
  chart: string;
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

    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      fontFamily: "IBM Plex Sans, sans-serif",
    });

    const renderChart = async () => {
      try {
        const cleanChart = chart.trim();
        const { svg } = await mermaid.render(renderId, cleanChart);
        if (isMounted) {
          setSvgContent(svg);
          setError(false);
        }
      } catch (err) {
        console.warn("Mermaid render error:", err);
        if (isMounted) {
          setError(true);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
      const tempElement = document.getElementById(renderId);
      if (tempElement) {
        tempElement.remove();
      }
    };
  }, [chart]);

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(chart);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          <span>Mermaid Diagram Syntax</span>
          <div style={{ display: "flex", gap: 6 }}>
            {error && (
              <button
                className="aa-btn"
                style={{ fontSize: 11, padding: "2px 6px" }}
                onClick={() => setShowRaw(false)}
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
        }}
      >
        <Code size={12} /> Interactive Diagram
      </div>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          marginTop: 18,
        }}
        dangerouslySetInnerHTML={{ __html: svgContent || "Loading diagram..." }}
      />
    </div>
  );
}
