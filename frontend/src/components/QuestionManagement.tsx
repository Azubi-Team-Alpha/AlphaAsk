import { useState, useEffect } from "react";
import { Trash2, Search, X, ChevronDown, ChevronUp } from "lucide-react";
import type { Question } from "../types";
import { fetchQuestions, deleteQuestion } from "../lib/api-mock";
import { timeAgo } from "../lib/utils";

interface QuestionManagementProps {
  onClose: () => void;
}

export function QuestionManagement({ onClose }: QuestionManagementProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuestions();
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question and its answer?")) {
      return;
    }

    setDeletingId(questionId);
    try {
      await deleteQuestion(questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      if (expandedId === questionId) {
        setExpandedId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete question");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredQuestions = questions.filter((q) =>
    q.question.toLowerCase().includes(search.toLowerCase()) ||
    q.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="aa-modal-overlay" onMouseDown={onClose}>
      <div className="aa-modal-card aa-modal-large" onMouseDown={(e) => e.stopPropagation()}>
        <button className="aa-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div className="aa-mark" style={{ marginBottom: 14 }}>α</div>
        <h2 className="aa-modal-title">Question Management</h2>
        <p className="aa-modal-sub">
          View and manage all your questions and answers
        </p>

        <div className="aa-search-wrap" style={{ marginBottom: 16 }}>
          <Search size={13} className="aa-muted-icon" />
          <input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {error && <div className="aa-form-error">{error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--aa-text-muted)" }}>
            Loading questions...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--aa-text-muted)" }}>
            {search ? "No questions match your search." : "No questions yet. Start asking to see them here!"}
          </div>
        ) : (
          <div className="aa-questions-list">
            {filteredQuestions.map((q) => (
              <div key={q.id} className="aa-question-item">
                <div className="aa-question-header">
                  <div className="aa-question-text">{q.question}</div>
                  <div className="aa-question-actions">
                    <button
                      className="aa-icon-btn"
                      onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                      aria-label={expandedId === q.id ? "Collapse" : "Expand"}
                    >
                      {expandedId === q.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                      className="aa-icon-btn aa-delete-btn"
                      onClick={() => handleDelete(q.id)}
                      disabled={deletingId === q.id}
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="aa-question-meta">
                  <span className="aa-question-time">{timeAgo(new Date(q.created_at).getTime())}</span>
                </div>
                {expandedId === q.id && (
                  <div className="aa-question-answer">
                    <div className="aa-answer-label">Answer:</div>
                    <div className="aa-answer-text">{q.answer}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="aa-modal-footer" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--aa-border)" }}>
          <button className="aa-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
