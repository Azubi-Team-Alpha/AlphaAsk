import { useState, useEffect } from "react";
import { X, Bookmark, Search, Copy, Check, Trash2 } from "lucide-react";
import { copyToClipboard } from "../lib/utils";
import { fetchQuestions, deleteQuestion } from "../lib/api";

export interface SavedAnswer {
  id: string;
  question: string;
  answer: string;
  subject?: string;
  savedAt: number;
}

const DEFAULT_SAVED_ANSWERS: SavedAnswer[] = [
  {
    id: "sa-1",
    question: "How do I balance redox equations using the half-reaction method?",
    answer: "To balance a redox equation using the half-reaction method:\n1. Separate the overall reaction into oxidation and reduction half-reactions.\n2. Balance all elements except H and O.\n3. Balance O by adding H₂O molecules.\n4. Balance H by adding H⁺ ions (in acidic medium).\n5. Balance charge by adding electrons (e⁻).\n6. Multiply half-reactions by integers so charge electrons cancel out, then add reactions together.",
    subject: "science",
    savedAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: "sa-2",
    question: "Why does recursion need a base case?",
    answer: "A base case is the essential stopping condition in a recursive function. Without a base case, the function calls itself indefinitely, leading to an infinite stack growth until the execution environment throws a StackOverflowError. The base case solves a trivial sub-problem directly without making further recursive calls.",
    subject: "code",
    savedAt: Date.now() - 1000 * 60 * 60 * 48,
  },
];

interface SavedAnswersModalProps {
  onClose: () => void;
}

export function SavedAnswersModal({ onClose }: SavedAnswersModalProps) {
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadBackendQuestions = async () => {
      try {
        const backendItems = await fetchQuestions();
        if (isMounted && backendItems && backendItems.length > 0) {
          const mapped: SavedAnswer[] = backendItems.map((q) => ({
            id: q.id,
            question: q.question,
            answer: q.answer,
            savedAt: new Date(q.created_at || Date.now()).getTime(),
          }));
          setSavedAnswers(mapped);
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to local storage if offline/unauthenticated
      }

      if (isMounted) {
        const saved = localStorage.getItem("alphaask_saved_answers");
        if (saved) {
          try {
            setSavedAnswers(JSON.parse(saved));
          } catch {
            setSavedAnswers(DEFAULT_SAVED_ANSWERS);
          }
        } else {
          setSavedAnswers(DEFAULT_SAVED_ANSWERS);
        }
        setLoading(false);
      }
    };

    loadBackendQuestions();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    setSavedAnswers((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteQuestion(id);
    } catch {
      // Local removal completed
    }
  };

  const filtered = savedAnswers.filter(
    (item) =>
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="aa-modal-overlay" onMouseDown={onClose}>
      <div
        className="aa-modal-card"
        style={{ maxWidth: 700, width: "92%", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="aa-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div className="aa-mark" style={{ background: "var(--aa-accent)", color: "var(--aa-accent-ink)" }}>
            <Bookmark size={16} />
          </div>
          <div>
            <h2 className="aa-modal-title" style={{ margin: 0 }}>Saved Answers & Bookmarks</h2>
          </div>
        </div>
        <p className="aa-modal-sub" style={{ marginBottom: 14 }}>
          Access your bookmarked study explanations and revision notes anytime.
        </p>

        <div className="aa-search-wrap" style={{ margin: "0 0 14px", width: "100%" }}>
          <Search size={14} className="aa-muted-icon" />
          <input
            placeholder="Search saved answers & concepts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--aa-text-muted)", fontSize: 13 }}>
              Loading saved answers from backend...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--aa-text-muted)", fontSize: 13 }}>
              No saved answers found.
            </div>
          ) : (
            filtered.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid var(--aa-border)",
                borderRadius: 12,
                padding: 16,
                background: "var(--aa-bg)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <h3 style={{ fontSize: 14.5, fontWeight: 600, margin: 0, color: "var(--aa-text)", lineHeight: 1.4 }}>
                  {item.question}
                </h3>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button
                    className="aa-icon-btn"
                    onClick={() => handleCopy(item.id, `${item.question}\n\n${item.answer}`)}
                    title="Copy to clipboard"
                  >
                    {copiedId === item.id ? <Check size={14} style={{ color: "var(--aa-green)" }} /> : <Copy size={14} />}
                  </button>
                  <button className="aa-icon-btn" onClick={() => handleDelete(item.id)} title="Remove bookmark">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: "var(--aa-text-muted)",
                  whiteSpace: "pre-wrap",
                  background: "var(--aa-surface)",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid var(--aa-border)",
                }}
              >
                {item.answer}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "var(--aa-text-muted)", marginTop: 2 }}>
                <span>Saved on {new Date(item.savedAt).toLocaleDateString()}</span>
                {item.subject && (
                  <span style={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>
                    {item.subject}
                  </span>
                )}
              </div>
            </div>
          )))}
        </div>
      </div>
    </div>
  );
}
