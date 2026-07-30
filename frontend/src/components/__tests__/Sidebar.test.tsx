import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Sidebar } from "../Sidebar";

describe("Sidebar Component Navigation & Interactivity", () => {
  const defaultProps = {
    sidebarOpen: true,
    setSidebarOpen: vi.fn(),
    searchOpen: false,
    setSearchOpen: vi.fn(),
    search: "",
    setSearch: vi.fn(),
    startNewChat: vi.fn(),
    isAuthenticated: false,
    currentUser: null,
    filteredConversations: [],
    activeId: null,
    openConversation: vi.fn(),
    handleLogOut: vi.fn(),
    onSignUpClick: vi.fn(),
    onQuestionManagementClick: vi.fn(),
    onFAQClick: vi.fn(),
    onSubjectsClick: vi.fn(),
    onSavedAnswersClick: vi.fn(),
    onClassesClick: vi.fn(),
    onMoreClick: vi.fn(),
  };

  it("renders AlphaAsk brand title and navigation items", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("AlphaAsk")).toBeInTheDocument();
    expect(screen.getByText("New question")).toBeInTheDocument();
    expect(screen.getByText("Subjects")).toBeInTheDocument();
    expect(screen.getByText("Saved answers")).toBeInTheDocument();
    expect(screen.getByText("Classes")).toBeInTheDocument();
    expect(screen.getByText("My Questions")).toBeInTheDocument();
    expect(screen.getByText("FAQ")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
  });

  it("triggers callbacks when navigation items are clicked", () => {
    render(<Sidebar {...defaultProps} />);

    fireEvent.click(screen.getByText("Subjects"));
    expect(defaultProps.onSubjectsClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Saved answers"));
    expect(defaultProps.onSavedAnswersClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Classes"));
    expect(defaultProps.onClassesClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("My Questions"));
    expect(defaultProps.onQuestionManagementClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("FAQ"));
    expect(defaultProps.onFAQClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("More"));
    expect(defaultProps.onMoreClick).toHaveBeenCalledTimes(1);
  });
});
