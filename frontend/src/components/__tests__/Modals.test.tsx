import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SubjectsModal } from "../SubjectsModal";
import { ClassesModal } from "../ClassesModal";
import { SavedAnswersModal } from "../SavedAnswersModal";
import { MoreModal } from "../MoreModal";

describe("SubjectsModal Component", () => {
  it("renders subject domains and triggers selection", () => {
    const onSelectSubject = vi.fn();
    const onClose = vi.fn();
    render(<SubjectsModal onClose={onClose} onSelectSubject={onSelectSubject} />);

    expect(screen.getByText("Academic Subjects & Disciplines")).toBeInTheDocument();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText("Programming & Computer Science")).toBeInTheDocument();

    const selectBtns = screen.getAllByRole("button", { name: /Select/i });
    fireEvent.click(selectBtns[0]);
    expect(onSelectSubject).toHaveBeenCalledWith("math");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("ClassesModal Component", () => {
  it("renders course list and allows adding a new class", () => {
    const onClose = vi.fn();
    render(<ClassesModal onClose={onClose} />);

    expect(screen.getByText("My Academic Classes")).toBeInTheDocument();
    expect(screen.getByText("CS 301")).toBeInTheDocument();

    const addBtn = screen.getByText("Add Course");
    fireEvent.click(addBtn);
    expect(screen.getByText("Save Class to Workspace")).toBeInTheDocument();
  });
});

describe("SavedAnswersModal Component", () => {
  it("renders bookmarked answers and filters by search query", () => {
    const onClose = vi.fn();
    render(<SavedAnswersModal onClose={onClose} />);

    expect(screen.getByText("Saved Answers & Bookmarks")).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText(/Search saved answers/i);

    fireEvent.change(searchInput, { target: { value: "redox" } });
    expect(screen.getByText(/How do I balance redox equations/i)).toBeInTheDocument();
  });
});

describe("MoreModal Component", () => {
  it("renders AI provider status and keyboard shortcuts", () => {
    const onClose = vi.fn();
    render(<MoreModal onClose={onClose} />);

    expect(screen.getByText("Platform & Study Toolkit")).toBeInTheDocument();
    expect(screen.getByText("Multi-Provider AI Orchestrator")).toBeInTheDocument();
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
  });
});
