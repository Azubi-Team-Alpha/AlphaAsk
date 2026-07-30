import { useState, useEffect } from "react";
import { X, FolderKanban, Plus, Trash2, Check } from "lucide-react";

export interface StudentClass {
  id: string;
  code: string;
  name: string;
  instructor?: string;
  term?: string;
  description?: string;
}

const DEFAULT_CLASSES: StudentClass[] = [
  {
    id: "cls-1",
    code: "CS 301",
    name: "Data Structures & Algorithms",
    instructor: "Prof. Mensah",
    term: "Fall Semester",
    description: "Trees, Graphs, Dynamic Programming & Algorithm Complexity Analysis.",
  },
  {
    id: "cls-2",
    code: "MATH 202",
    name: "Linear Algebra & Differential Equations",
    instructor: "Dr. Owusu",
    term: "Fall Semester",
    description: "Vector Spaces, Eigenvalues, Transformations & First-Order Differential Models.",
  },
  {
    id: "cls-3",
    code: "CHEM 201",
    name: "Organic Chemistry I",
    instructor: "Dr. Appiah",
    term: "Fall Semester",
    description: "Reaction Mechanisms, Stereochemistry & Molecular Structure Synthesis.",
  },
  {
    id: "cls-4",
    code: "ENG 105",
    name: "Academic Writing & Research",
    instructor: "Prof. Addo",
    term: "Fall Semester",
    description: "Scholarly Arguments, Thesis Formulation & Literature Syntheses.",
  },
];

interface ClassesModalProps {
  onClose: () => void;
  activeClassId?: string | null;
  onSelectClass?: (cls: StudentClass | null) => void;
}

export function ClassesModal({ onClose, activeClassId, onSelectClass }: ClassesModalProps) {
  const [classes, setClasses] = useState<StudentClass[]>(() => {
    const saved = localStorage.getItem("alphaask_classes");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_CLASSES;
      }
    }
    return DEFAULT_CLASSES;
  });

  const [selectedId, setSelectedId] = useState<string | null>(activeClassId || null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [instructor, setInstructor] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    localStorage.setItem("alphaask_classes", JSON.stringify(classes));
  }, [classes]);

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    const newClass: StudentClass = {
      id: `cls-${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      instructor: instructor.trim() || undefined,
      term: "Current Semester",
      description: description.trim() || undefined,
    };

    setClasses((prev) => [newClass, ...prev]);
    setCode("");
    setName("");
    setInstructor("");
    setDescription("");
    setShowAddForm(false);
  };

  const handleDeleteClass = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClasses((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      onSelectClass?.(null);
    }
  };

  const handleSelect = (cls: StudentClass) => {
    const next = selectedId === cls.id ? null : cls.id;
    setSelectedId(next);
    onSelectClass?.(next ? cls : null);
  };

  return (
    <div className="aa-modal-overlay" onMouseDown={onClose}>
      <div
        className="aa-modal-card"
        style={{ maxWidth: 640, width: "92%", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="aa-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="aa-mark" style={{ background: "var(--aa-accent)", color: "var(--aa-accent-ink)" }}>
              <FolderKanban size={16} />
            </div>
            <div>
              <h2 className="aa-modal-title" style={{ margin: 0 }}>My Academic Classes</h2>
            </div>
          </div>
        </div>
        <p className="aa-modal-sub" style={{ marginBottom: 16 }}>
          Organize your enrolled courses to frame your study questions and keep course workspace notes structured.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--aa-text-muted)", textTransform: "uppercase" }}>
            Enrolled Courses ({classes.length})
          </span>
          <button
            className="aa-btn aa-btn-primary"
            style={{ fontSize: 12, padding: "5px 12px" }}
            onClick={() => setShowAddForm((v) => !v)}
          >
            <Plus size={14} /> {showAddForm ? "Cancel" : "Add Course"}
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAddClass}
            style={{
              background: "var(--aa-bg)",
              border: "1px solid var(--aa-border)",
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              <label className="aa-field" style={{ width: "35%", marginBottom: 0 }}>
                <span>Course Code *</span>
                <input placeholder="e.g. CS 101" value={code} onChange={(e) => setCode(e.target.value)} required />
              </label>
              <label className="aa-field" style={{ flex: 1, marginBottom: 0 }}>
                <span>Course Name *</span>
                <input placeholder="e.g. Intro to Computer Science" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <label className="aa-field" style={{ flex: 1, marginBottom: 0 }}>
                <span>Instructor / Professor</span>
                <input placeholder="e.g. Dr. Mensah" value={instructor} onChange={(e) => setInstructor(e.target.value)} />
              </label>
            </div>
            <label className="aa-field" style={{ marginBottom: 0 }}>
              <span>Description / Topics</span>
              <input placeholder="Key topics covered in this class" value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>

            <button type="submit" className="aa-btn aa-btn-primary" style={{ marginTop: 4, justifyContent: "center" }}>
              Save Class to Workspace
            </button>
          </form>
        )}

        <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, display: "flex", flexDirection: "column", gap: 10 }}>
          {classes.map((cls) => {
            const isSelected = selectedId === cls.id;
            return (
              <div
                key={cls.id}
                onClick={() => handleSelect(cls)}
                style={{
                  border: isSelected ? "2px solid var(--aa-accent)" : "1px solid var(--aa-border)",
                  borderRadius: 12,
                  padding: 14,
                  background: isSelected ? "var(--aa-surface-raised)" : "var(--aa-bg)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "IBM Plex Mono, monospace",
                        fontWeight: 600,
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 5,
                        background: "var(--aa-accent)",
                        color: "var(--aa-accent-ink)",
                      }}
                    >
                      {cls.code}
                    </span>
                    <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "var(--aa-text)" }}>{cls.name}</h3>
                  </div>

                  {cls.instructor && (
                    <p style={{ fontSize: 12, color: "var(--aa-text-muted)", margin: "4px 0 0" }}>
                      Instructor: {cls.instructor} • {cls.term}
                    </p>
                  )}
                  {cls.description && (
                    <p style={{ fontSize: 12.5, color: "var(--aa-text-muted)", margin: "6px 0 0", lineHeight: 1.4 }}>
                      {cls.description}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {isSelected && (
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "var(--aa-accent)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Check size={14} /> Active
                    </span>
                  )}
                  <button
                    className="aa-icon-btn"
                    onClick={(e) => handleDeleteClass(cls.id, e)}
                    title="Remove Class"
                    style={{ color: "var(--aa-text-muted)" }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}

          {classes.length === 0 && (
            <div style={{ textAlign: "center", padding: 30, color: "var(--aa-text-muted)" }}>
              No classes added yet. Click "Add Course" above to set up your enrolled classes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
