import { HelpCircle, LogIn, Moon, PanelLeft, Sun, UserPlus } from "lucide-react";
import type { ThemeMode } from "../types";
import { PomodoroTimer } from "./PomodoroTimer";

interface TopBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onSignUpClick: () => void;
  onFAQClick?: () => void;
}

export function TopBar({
  sidebarOpen,
  setSidebarOpen,
  theme,
  toggleTheme,
  isAuthenticated,
  onLoginClick,
  onSignUpClick,
  onFAQClick,
}: TopBarProps) {
  return (
    <div className="aa-topbar">
      <div className="aa-topbar-left">
        {!sidebarOpen && (
          <button className="aa-icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <PanelLeft size={17} />
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <PomodoroTimer />

        {onFAQClick && (
          <button
            className="aa-btn"
            style={{ fontSize: 12, padding: "4px 10px", gap: 5 }}
            onClick={onFAQClick}
            title="Browse Student FAQ Knowledgebase"
          >
            <HelpCircle size={14} style={{ color: "var(--aa-accent)" }} />
            FAQ Knowledgebase
          </button>
        )}

        <button className="aa-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {!isAuthenticated && (
          <div className="aa-guest-actions">
            <button className="aa-btn" onClick={onLoginClick}>
              <LogIn size={14} /> Log in
            </button>
            <button className="aa-btn aa-btn-primary" onClick={onSignUpClick}>
              <UserPlus size={14} /> Sign up
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
