import { useState, useMemo } from "react";
import { X, Layers, RotateCw, ChevronLeft, ChevronRight, CheckCircle2, Award } from "lucide-react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  options?: string[];
  correctIndex?: number;
}

interface FlashcardModalProps {
  onClose: () => void;
  title?: string;
  content?: string;
}

export function FlashcardModal({ onClose, title = "Academic Concept Study Cards", content = "" }: FlashcardModalProps) {
  const [activeTab, setActiveTab] = useState<"flashcards" | "quiz">("flashcards");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Generate study flashcards and quiz questions from content
  const cards: Flashcard[] = useMemo(() => {
    const lines = content.split("\n").map(l => l.replace(/[*#`-]/g, "").trim()).filter(l => l.length > 15);
    const generated: Flashcard[] = [];

    if (lines.length >= 2) {
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i];
        const parts = line.split(/[:=]/);
        if (parts.length >= 2) {
          generated.push({
            id: `fc-${i}`,
            front: `What is the key definition of "${parts[0].trim()}"?`,
            back: parts.slice(1).join(":").trim(),
            options: [
              parts.slice(1).join(":").trim(),
              "It is an unrelated secondary process.",
              "It represents an inverse function value.",
              "None of the above."
            ].sort(() => Math.random() - 0.5),
          });
        } else {
          generated.push({
            id: `fc-${i}`,
            front: `Concept #${i + 1}: Key Academic Concept`,
            back: line,
            options: [
              line,
              "Alternative theoretical option A",
              "Alternative theoretical option B",
              "Opposing viewpoint concept"
            ].sort(() => Math.random() - 0.5),
          });
        }
      }
    }

    if (generated.length === 0) {
      return [
        {
          id: "fc-1",
          front: "What is the core takeaway from this academic response?",
          back: content.slice(0, 180) || "Study the provided explanation to master foundational subject rules.",
          options: [content.slice(0, 180), "Option A", "Option B", "Option C"],
          correctIndex: 0
        },
        {
          id: "fc-2",
          front: "How do you apply this formula / concept in exam problems?",
          back: "Break down problem statements into inputs, target variables, and step-by-step logic.",
          options: ["Break down step-by-step", "Guess values", "Skip steps", "Use incorrect units"],
          correctIndex: 0
        }
      ];
    }

    // Set correct index for options
    return generated.map(card => {
      const idx = card.options?.indexOf(card.back) ?? 0;
      return { ...card, correctIndex: idx < 0 ? 0 : idx };
    });
  }, [content]);

  const currentCard = cards[currentIndex] || cards[0];

  const calculateScore = () => {
    let score = 0;
    cards.forEach((card, idx) => {
      if (selectedAnswers[idx] === card.correctIndex) {
        score++;
      }
    });
    return score;
  };

  return (
    <div className="aa-modal-overlay" onMouseDown={onClose}>
      <div
        className="aa-modal-card"
        style={{
          maxWidth: 640,
          width: "94%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="aa-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexShrink: 0 }}>
          <div className="aa-mark" style={{ background: "var(--aa-accent)", color: "var(--aa-accent-ink)" }}>
            <Layers size={16} />
          </div>
          <div>
            <h2 className="aa-modal-title" style={{ margin: 0 }}>Smart Flashcard Studio & Quiz</h2>
          </div>
        </div>
        <p className="aa-modal-sub" style={{ marginBottom: 14, flexShrink: 0 }}>
          {title}
        </p>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, borderBottom: "1px solid var(--aa-border)", paddingBottom: 10, flexShrink: 0 }}>
          <button
            className={`aa-btn ${activeTab === "flashcards" ? "aa-btn-primary" : ""}`}
            onClick={() => setActiveTab("flashcards")}
            style={{ fontSize: 13 }}
          >
            <Layers size={14} /> Flashcards ({cards.length})
          </button>
          <button
            className={`aa-btn ${activeTab === "quiz" ? "aa-btn-primary" : ""}`}
            onClick={() => setActiveTab("quiz")}
            style={{ fontSize: 13 }}
          >
            <Award size={14} /> Practice Quiz
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 6, display: "flex", flexDirection: "column" }}>
          {activeTab === "flashcards" ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: 12.5, color: "var(--aa-text-muted)" }}>
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <span>Click card to flip</span>
              </div>

              {/* Flip card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                style={{
                  minHeight: 180,
                  background: isFlipped ? "var(--aa-surface)" : "var(--aa-surface-hover)",
                  border: isFlipped ? "1.5px solid var(--aa-accent)" : "1px dashed var(--aa-border)",
                  borderRadius: 12,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  userSelect: "none",
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--aa-accent)", marginBottom: 10 }}>
                  {isFlipped ? "Answer / Explanation" : "Question / Concept"}
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.5, color: "var(--aa-text)" }}>
                  {isFlipped ? currentCard.back : currentCard.front}
                </div>
                <div style={{ marginTop: 14, fontSize: 12, color: "var(--aa-text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                  <RotateCw size={12} /> {isFlipped ? "Click to see question" : "Click to reveal answer"}
                </div>
              </div>

              {/* Navigation buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10 }}>
                <button
                  className="aa-btn"
                  disabled={currentIndex === 0}
                  onClick={() => { setCurrentIndex(i => Math.max(0, i - 1)); setIsFlipped(false); }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                <button
                  className="aa-btn aa-btn-primary"
                  disabled={currentIndex === cards.length - 1}
                  onClick={() => { setCurrentIndex(i => Math.min(cards.length - 1, i + 1)); setIsFlipped(false); }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ paddingBottom: 16 }}>
              {!quizSubmitted ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {cards.map((card, qIdx) => (
                    <div key={card.id} style={{ background: "var(--aa-surface)", padding: 14, borderRadius: 10, border: "1px solid var(--aa-border)" }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 10, color: "var(--aa-text)" }}>
                        Q{qIdx + 1}: {card.front}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {card.options?.map((opt, oIdx) => (
                          <label
                            key={oIdx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 12px",
                              borderRadius: 6,
                              background: selectedAnswers[qIdx] === oIdx ? "var(--aa-accent-bg)" : "transparent",
                              border: selectedAnswers[qIdx] === oIdx ? "1px solid var(--aa-accent)" : "1px solid transparent",
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            <input
                              type="radio"
                              name={`quiz-q-${qIdx}`}
                              checked={selectedAnswers[qIdx] === oIdx}
                              onChange={() => setSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    className="aa-btn aa-btn-primary"
                    style={{ marginTop: 8, marginBottom: 12, justifyContent: "center" }}
                    onClick={() => setQuizSubmitted(true)}
                  >
                    <CheckCircle2 size={15} /> Submit Quiz Answers
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 24, background: "var(--aa-surface)", borderRadius: 12, border: "1px solid var(--aa-border)" }}>
                  <Award size={40} style={{ color: "var(--aa-accent)", marginBottom: 10 }} />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Quiz Completed!</h3>
                  <p style={{ fontSize: 14, color: "var(--aa-text-muted)", margin: "8px 0 16px" }}>
                    Your Score: <strong style={{ color: "var(--aa-accent)", fontSize: 18 }}>{calculateScore()} / {cards.length}</strong> ({Math.round((calculateScore() / cards.length) * 100)}%)
                  </p>

                  <button
                    className="aa-btn aa-btn-primary"
                    onClick={() => { setQuizSubmitted(false); setSelectedAnswers({}); }}
                  >
                    Retry Quiz
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
