import React from "react";
import { X, BookOpen, ArrowRight, Code, Calculator, Atom, PenTool, History, GraduationCap } from "lucide-react";
import type { SubjectKey } from "../types";

interface SubjectsModalProps {
  onClose: () => void;
  onSelectSubject: (key: SubjectKey, samplePrompt?: string) => void;
}

interface SubjectDetail {
  key: SubjectKey;
  label: string;
  description: string;
  icon: React.ReactNode;
  topics: string[];
  starterPrompts: string[];
}

const SUBJECT_DETAILS: SubjectDetail[] = [
  {
    key: "math",
    label: "Mathematics",
    description: "Calculus, Linear Algebra, Statistics, Discrete Math & Problem Solving",
    icon: <Calculator size={20} />,
    topics: ["Calculus Limits & Derivatives", "Matrix Operations", "Probability & Distributions", "Trigonometric Identities"],
    starterPrompts: [
      "Explain the intuitive geometric meaning of a derivative with step-by-step examples.",
      "Help me solve this probability question step by step: ",
    ],
  },
  {
    key: "science",
    label: "Science & Engineering",
    description: "Physics, Chemistry, Biology, Thermodynamics & Lab Principles",
    icon: <Atom size={20} />,
    topics: ["Organic Reaction Mechanisms", "Newtonian Kinematics", "Cellular Respiration & Genetics", "Chemical Equilibrium"],
    starterPrompts: [
      "Explain how balancing redox equations works using the half-reaction method.",
      "What is the difference between ionic and covalent bonding with real-world examples?",
    ],
  },
  {
    key: "writing",
    label: "Writing & Humanities",
    description: "Essay Structure, Thesis Formulation, APA/MLA Citations & Grammar",
    icon: <PenTool size={20} />,
    topics: ["Argumentative Thesis Statements", "Peer Review & Editing", "Chicago / APA 7th Citations", "Literature Review Synthesis"],
    starterPrompts: [
      "Help me refine a strong thesis statement for an essay about ",
      "How do I structure a literature review introduction according to APA 7th style?",
    ],
  },
  {
    key: "code",
    label: "Programming & Computer Science",
    description: "Algorithms, Data Structures, Python, Web Dev, SQL & Debugging",
    icon: <Code size={20} />,
    topics: ["Big-O Time Complexity", "Binary Search Trees", "Async/Await Promises", "Relational SQL Queries"],
    starterPrompts: [
      "Why does recursion require a base case, and how does call stack overflow happen?",
      "Can you explain the difference between SQL INNER JOIN and LEFT JOIN with diagrams?",
    ],
  },
  {
    key: "history",
    label: "History & Social Sciences",
    description: "World History, Economics, Political Theory, Psychology & Sociology",
    icon: <History size={20} />,
    topics: ["Micro & Macroeconomics", "World War Primary Sources", "Constitutional Law", "Cognitive Behavioral Psychology"],
    starterPrompts: [
      "Compare the economic impacts of fiscal policy vs monetary policy on inflation.",
      "Summarize the major geopolitical causes leading up to ",
    ],
  },
  {
    key: "study",
    label: "Study Skills & Strategy",
    description: "Exam Preparation, Time Management, Active Recall & Cornell Note-taking",
    icon: <GraduationCap size={20} />,
    topics: ["Pomodoro Technique", "Spaced Repetition Flashcards", "Feynman Technique for Concepts", "Exam Stress Management"],
    starterPrompts: [
      "Help me build a 7-day revision schedule for an upcoming final exam in ",
      "Explain how the Feynman Technique works and how to apply it to complex topics.",
    ],
  },
];

export function SubjectsModal({ onClose, onSelectSubject }: SubjectsModalProps) {
  return (
    <div className="aa-modal-overlay" onMouseDown={onClose}>
      <div
        className="aa-modal-card"
        style={{ maxWidth: 680, width: "92%", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="aa-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div className="aa-mark" style={{ background: "var(--aa-accent)", color: "var(--aa-accent-ink)" }}>
            <BookOpen size={16} />
          </div>
          <h2 className="aa-modal-title" style={{ margin: 0 }}>Academic Subjects & Disciplines</h2>
        </div>
        <p className="aa-modal-sub" style={{ marginBottom: 18 }}>
          Select a subject category to filter questions and customize AI tutor explanations for your discipline.
        </p>

        <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, display: "flex", flexDirection: "column", gap: 12 }}>
          {SUBJECT_DETAILS.map((sub) => (
            <div
              key={sub.key}
              style={{
                border: "1px solid var(--aa-border)",
                borderRadius: 12,
                padding: 16,
                background: "var(--aa-bg)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: "var(--aa-surface-raised)",
                      border: "1px solid var(--aa-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--aa-accent)",
                    }}
                  >
                    {sub.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--aa-text)" }}>{sub.label}</h3>
                    <p style={{ fontSize: 12.5, color: "var(--aa-text-muted)", margin: "2px 0 0" }}>{sub.description}</p>
                  </div>
                </div>

                <button
                  className="aa-btn aa-btn-primary"
                  style={{ fontSize: 12, padding: "5px 12px", whiteSpace: "nowrap" }}
                  onClick={() => {
                    onSelectSubject(sub.key);
                    onClose();
                  }}
                >
                  Select <ArrowRight size={13} />
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {sub.topics.map((topic, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11.5,
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: "var(--aa-surface)",
                      border: "1px solid var(--aa-border)",
                      color: "var(--aa-text-muted)",
                    }}
                  >
                    {topic}
                  </span>
                ))}
              </div>

              <div style={{ borderTop: "1px dashed var(--aa-border)", paddingTop: 8, marginTop: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--aa-text-muted)", textTransform: "uppercase" }}>
                  Sample Prompts:
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                  {sub.starterPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      style={{
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        color: "var(--aa-text)",
                        fontSize: 12.5,
                        cursor: "pointer",
                        padding: "2px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      onClick={() => {
                        onSelectSubject(sub.key, prompt);
                        onClose();
                      }}
                    >
                      <span style={{ color: "var(--aa-accent)" }}>•</span> "{prompt}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
