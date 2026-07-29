import { useState, useEffect } from "react";
import { HelpCircle, Search, X, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import type { FAQ } from "../types";
import { fetchFAQ } from "../lib/api-mock";

interface FAQProps {
  onClose: () => void;
}

export function FAQ({ onClose }: FAQProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    loadFAQ();
  }, []);

  const loadFAQ = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFAQ();
      setFaqs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load FAQ");
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", ...Array.from(new Set(faqs.map((f) => f.category)))];

  const filteredFAQs = faqs.filter((f) => {
    const matchesSearch = 
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="aa-modal-overlay" onMouseDown={onClose}>
      <div className="aa-modal-card aa-modal-large" onMouseDown={(e) => e.stopPropagation()}>
        <button className="aa-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div className="aa-mark" style={{ marginBottom: 14 }}>α</div>
        <h2 className="aa-modal-title">Frequently Asked Questions</h2>
        <p className="aa-modal-sub">
          Find quick answers to common questions about AlphaAsk
        </p>

        <div className="aa-search-wrap" style={{ marginBottom: 16 }}>
          <Search size={13} className="aa-muted-icon" />
          <input
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="aa-category-filter" style={{ marginBottom: 16 }}>
          {categories.map((category) => (
            <button
              key={category}
              className={`aa-chip ${selectedCategory === category ? "aa-chip-active" : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {error && <div className="aa-form-error">{error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--aa-text-muted)" }}>
            Loading FAQs...
          </div>
        ) : filteredFAQs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--aa-text-muted)" }}>
            <HelpCircle size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p>No FAQs found matching your criteria.</p>
          </div>
        ) : (
          <div className="aa-faq-list">
            {filteredFAQs.map((faq) => (
              <div key={faq.id} className="aa-faq-item">
                <div className="aa-faq-header" onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}>
                  <div className="aa-faq-question">
                    <BookOpen size={16} className="aa-muted-icon" style={{ marginRight: 8 }} />
                    {faq.question}
                  </div>
                  <button className="aa-icon-btn" aria-label={expandedId === faq.id ? "Collapse" : "Expand"}>
                    {expandedId === faq.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
                <div className="aa-faq-category">{faq.category}</div>
                {expandedId === faq.id && (
                  <div className="aa-faq-answer">
                    {faq.answer}
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
