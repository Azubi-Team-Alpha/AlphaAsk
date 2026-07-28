
import {
  Plus,
  LogOut,
  PanelLeft,
  Search,
  BookOpen,
  Bookmark,
  FolderKanban,
  MoreHorizontal,
  Sparkles,
  HelpCircle,
  List,
} from "lucide-react";
import type { Conversation, CurrentUser } from "../types";
import { timeAgo } from "../lib/utils";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean | ((s: boolean) => boolean)) => void;
  search: string;
  setSearch: (v: string) => void;
  startNewChat: () => void;
  isAuthenticated: boolean;
  currentUser: CurrentUser | null;
  filteredConversations: Conversation[];
  activeId: string | null;
  openConversation: (id: string) => void;
  handleLogOut: () => void;
  onSignUpClick: () => void;
  onQuestionManagementClick: () => void;
  onFAQClick: () => void;
}

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  searchOpen,
  setSearchOpen,
  search,
  setSearch,
  startNewChat,
  isAuthenticated,
  currentUser,
  filteredConversations,
  activeId,
  openConversation,
  handleLogOut,
  onSignUpClick,
  onQuestionManagementClick,
  onFAQClick,
}: SidebarProps) {
  return (
    <aside className={`aa-sidebar ${sidebarOpen ? "" : "aa-closed"}`}>
      <div className="aa-sidebar-top">
        <div className="aa-brand">
          <div className="aa-mark">α</div>
          <span className="aa-wordmark">AlphaAsk</span>
        </div>
        <div className="aa-sidebar-top-icons">
          <button className="aa-icon-btn" onClick={() => setSearchOpen((s) => !s)} aria-label="Search">
            <Search size={16} />
          </button>
          <button className="aa-icon-btn" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar">
            <PanelLeft size={16} />
          </button>
        </div>
      </div>

      <button className="aa-new-chat" onClick={startNewChat}>
        <span className="aa-new-chat-icon">
          <Plus size={14} />
        </span>
        New question
      </button>

      {searchOpen && (
        <div className="aa-search-wrap aa-search-inline">
          <Search size={13} className="aa-muted-icon" />
          <input
            placeholder="Search your questions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
      )}

      <div className="aa-nav-list">
        <button className="aa-nav-item">
          <BookOpen size={16} /> Subjects
        </button>
        <button className="aa-nav-item">
          <Bookmark size={16} /> Saved answers
        </button>
        <button className="aa-nav-item">
          <FolderKanban size={16} /> Classes
        </button>
        <button className="aa-nav-item" onClick={onQuestionManagementClick}>
          <List size={16} /> My Questions
        </button>
        <button className="aa-nav-item" onClick={onFAQClick}>
          <HelpCircle size={16} /> FAQ
        </button>
        <button className="aa-nav-item">
          <MoreHorizontal size={16} /> More
        </button>
      </div>

      {isAuthenticated ? (
        <>
          <div className="aa-recents-label">Recents</div>
          <div className="aa-convo-list">
            {filteredConversations.map((c) => (
              <button
                key={c.id}
                className={`aa-convo-item ${activeId === c.id ? "aa-active" : ""}`}
                onClick={() => openConversation(c.id)}
              >
                <div className="aa-convo-title">{c.title}</div>
                <div className="aa-convo-time">{timeAgo(c.updatedAt)}</div>
              </button>
            ))}
            {filteredConversations.length === 0 && (
              <div style={{ color: "var(--aa-sidebar-muted)", fontSize: 12.5, padding: "10px 10px" }}>
                No questions match "{search}".
              </div>
            )}
          </div>

          {currentUser && (
            <div className="aa-sidebar-footer">
              <div className="aa-avatar">{currentUser.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="aa-user-name">{currentUser.name}</div>
                <div className="aa-user-sub">{currentUser.email}</div>
              </div>
              <button className="aa-icon-btn" onClick={handleLogOut} aria-label="Log out">
                <LogOut size={15} />
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="aa-sidebar-guest" style={{ flex: 1 }}>
            <p>Your questions from this session live only in this tab.</p>
            <p>Sign up to save them here and pick up where you left off on any device.</p>
          </div>
          <button className="aa-upsell" onClick={onSignUpClick}>
            <Sparkles size={16} /> Sign up free
          </button>
          <div className="aa-sidebar-footer">
            <div
              className="aa-avatar"
              style={{ background: "var(--aa-sidebar-hover)", color: "var(--aa-sidebar-muted)" }}
            >
              ?
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="aa-user-name">Guest</div>
              <div className="aa-user-sub">Not signed in</div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
