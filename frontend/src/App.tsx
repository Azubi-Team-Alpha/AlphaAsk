import React, { useState, useRef, useEffect, useCallback } from "react";
import { generateUUID } from "./lib/utils";
import {
  Send,
  Plus,
  LogIn,
  LogOut,
  UserPlus,
  X,
  PanelLeft,
  Check,
  Search,
  Lightbulb,
  Eye,
  EyeOff,
  Lock,
  Sun,
  Moon,
  BookOpen,
  Bookmark,
  FolderKanban,
  MoreHorizontal,
  Sparkles,
  ClipboardList,
  ArrowUpRight,
} from "lucide-react";

/* ============================================================================
   ALPHAASK — AI-powered student support platform
   ----------------------------------------------------------------------------
   Single-file reference implementation (React 18+ / TypeScript).

   INTEGRATION NOTES FOR BACKEND ENGINEERS
   - Replace `mockAskAlphaAsk()` with a real call to your inference endpoint.
     The (question, subject, history) => Promise<AskResponse> contract is
     what the rest of the UI depends on — keep it stable, swap the body.
   - Replace `mockAuth()` with real auth (session cookie, JWT, OAuth, etc).
     `isAuthenticated` / `currentUser` are the only two values the rest of
     the UI reads, so any provider that supplies those will work.
   - Guest sessions are intentionally NOT persisted anywhere (no localStorage,
     no backend write) — closing the tab discards the thread.
   - Signed-in sessions load `conversations` from your API on mount and again
     whenever a new message is sent.
   - Theme (light/dark) is local UI state here; if you want it to persist,
     store it against the user's account (or a cookie for guests) server-side
     and hydrate `theme` from that instead of defaulting to "dark".
   ========================================================================= */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = "user" | "assistant";
type AnnotationTone = "positive" | "tip" | "watch";
type ThemeMode = "dark" | "light";
type SubjectKey = "math" | "science" | "writing" | "code" | "history" | "study";
type AuthMode = "login" | "signup";

interface Annotation {
  label: string;
  tone: AnnotationTone;
}

interface Message {
  id: string;
  role: Role;
  content: string;
  subject?: SubjectKey;
  annotations?: Annotation[];
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
}


interface CurrentUser {
  name: string;
  initials: string;
  email: string;
}

interface AuthPayload {
  mode: AuthMode;
  name?: string;
  email: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Subject taxonomy — quick-select chips + message tagging
// ---------------------------------------------------------------------------

const SUBJECTS: { key: SubjectKey; label: string }[] = [
  { key: "math", label: "Math" },
  { key: "science", label: "Science" },
  { key: "writing", label: "Writing" },
  { key: "code", label: "Code" },
  { key: "history", label: "History" },
  { key: "study", label: "Study skills" },
];

const STARTERS: { icon: React.ReactNode; label: string; prompt: string }[] = [
  {
    icon: <Lightbulb size={16} />,
    label: "Explain a concept",
    prompt: "Can you explain how ",
  },
  {
    icon: <Check size={16} />,
    label: "Check my answer",
    prompt: "Can you check my answer and tell me what's off? Here's my work: ",
  },
  {
    icon: <ClipboardList size={16} />,
    label: "Build a study plan",
    prompt: "Help me build a study plan for ",
  },
];

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// API layer — real network calls to FastAPI backend
// ---------------------------------------------------------------------------

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("aa_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 401) {
    // Clear stale credentials and bubble up so callers can reset auth state
    localStorage.removeItem("aa_token");
    localStorage.removeItem("aa_user");
    throw Object.assign(new Error("Session expired. Please log in again."), { status: 401 });
  }
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? body.message ?? detail;
    } catch (_) { /* ignore */ }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

async function callAuth(payload: AuthPayload): Promise<CurrentUser> {
  const endpoint = payload.mode === "signup" ? "/api/auth/register" : "/api/auth/login";
  const body: Record<string, string> = { email: payload.email, password: payload.password };
  if (payload.mode === "signup" && payload.name) body.name = payload.name;

  const data = await apiRequest<{ access_token: string; name: string; email: string }>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });

  localStorage.setItem("aa_token", data.access_token);
  const user: CurrentUser = { name: data.name, initials: initialsFrom(data.name), email: data.email };
  localStorage.setItem("aa_user", JSON.stringify(user));
  return user;
}

async function fetchConversations(): Promise<Conversation[]> {
  const items = await apiRequest<{ id: string; title: string; updatedAt: string | number }[]>("/api/conversations");
  return items
    .map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: typeof c.updatedAt === "string" ? new Date(c.updatedAt).getTime() : c.updatedAt || Date.now(),
      messages: [],
    }))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

async function createSession(): Promise<string> {
  const data = await apiRequest<{ session_id: string }>("/api/sessions", { method: "POST" });
  return data.session_id;
}

async function fetchHistory(sessionId: string): Promise<Message[]> {
  const data = await apiRequest<{ messages: { role: string; content: string; created_at: string }[] }>(
    `/api/history/${sessionId}`
  );
  return data.messages.map((m, i) => ({
    id: `${sessionId}-${i}`,
    role: m.role as "user" | "assistant",
    content: m.content,
    timestamp: new Date(m.created_at).getTime(),
  }));
}

// Streams SSE from /api/ask/stream, calling onChunk for each token.
// Returns a promise that resolves when the stream is complete.
async function streamAsk(
  sessionId: string,
  question: string,
  subject: SubjectKey | undefined,
  onChunk: (chunk: string) => void,
  onError: (err: string) => void
): Promise<void> {
  const url = `${API_BASE}/api/ask/stream`;
  const token = localStorage.getItem("aa_token");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ question, session_id: sessionId, subject }),
  });

  if (!res.ok || !res.body) {
    if (res.status === 401) {
      localStorage.removeItem("aa_token");
      localStorage.removeItem("aa_user");
      throw Object.assign(new Error("Session expired."), { status: 401 });
    }
    throw new Error(`Stream error: HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const dataStr = trimmed.slice(6);
      try {
        const obj = JSON.parse(dataStr);
        if (obj.error) { onError(obj.error); return; }
        if (obj.content) onChunk(obj.content);
      } catch (_) { /* ignore malformed chunks */ }
    }
  }
}



// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const hrs = Math.round(diff / (1000 * 60 * 60));
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function initialsFrom(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

const toneStyles: Record<AnnotationTone, { icon: React.ReactNode; className: string }> = {
  positive: { icon: <Check size={12} strokeWidth={3} />, className: "aa-tag-positive" },
  tip: { icon: <Lightbulb size={12} strokeWidth={2.5} />, className: "aa-tag-tip" },
  watch: { icon: <ArrowUpRight size={12} strokeWidth={2.5} />, className: "aa-tag-watch" },
};

// ---------------------------------------------------------------------------
// Auth modal — sign in / sign up, one component, copy swaps by mode
// ---------------------------------------------------------------------------

interface AuthModalProps {
  mode: AuthMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
  onSubmit: (payload: AuthPayload) => Promise<void>;
}

function AuthModal({ mode, onClose, onSwitchMode, onSubmit }: AuthModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSignup = mode === "signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isSignup && !name.trim()) return setError("Enter your name.");
    if (!email.trim()) return setError("Enter your email.");
    if (password.length < 8) return setError("Password needs at least 8 characters.");

    setSubmitting(true);
    try {
      await onSubmit({ mode, name: isSignup ? name.trim() : undefined, email: email.trim(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="aa-modal-overlay" onMouseDown={onClose}>
      <div className="aa-modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <button className="aa-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div className="aa-mark" style={{ marginBottom: 14 }}>α</div>
        <h2 className="aa-modal-title">{isSignup ? "Create your account" : "Welcome back"}</h2>
        <p className="aa-modal-sub">
          {isSignup
            ? "Save every question, pick up conversations later, and unlock the full AlphaAsk toolkit."
            : "Log in to pick up where you left off."}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {isSignup && (
            <label className="aa-field">
              <span>Name</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ama Owusu" autoComplete="name" />
            </label>
          )}

          <label className="aa-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" autoComplete="email" />
          </label>

          <label className="aa-field">
            <span>Password</span>
            <div className="aa-password-wrap">
              <Lock size={14} className="aa-muted-icon" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "At least 8 characters" : "Your password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
              <button type="button" className="aa-password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </label>

          {error && <div className="aa-form-error">{error}</div>}

          <button type="submit" className="aa-btn aa-btn-primary aa-modal-submit" disabled={submitting}>
            {submitting ? "Please wait…" : isSignup ? "Sign up" : "Log in"}
          </button>
        </form>

        <div className="aa-modal-switch">
          {isSignup ? (
            <>Already have an account? <button onClick={() => onSwitchMode("login")}>Log in</button></>
          ) : (
            <>New to AlphaAsk? <button onClick={() => onSwitchMode("signup")}>Sign up</button></>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export default function AlphaAskApp() {
  // --- theme --------------------------------------------------------------
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  // --- auth -----------------------------------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authModalMode, setAuthModalMode] = useState<AuthMode | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  // Track the backend session_id for the active conversation
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("aa_token");
    const userStr = localStorage.getItem("aa_user");
    if (token && userStr) {
      try {
        const user: CurrentUser = JSON.parse(userStr);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (_) {
        localStorage.removeItem("aa_token");
        localStorage.removeItem("aa_user");
      }
    }
  }, []);

  const handleAuthError = useCallback((err: unknown) => {
    const status = (err as any)?.status;
    if (status === 401) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setMessages([]);
      setSessionId(null);
      setActiveId(null);
      setAuthModalMode("login");
    }
  }, []);

  const handleAuthSubmit = useCallback(async (payload: AuthPayload) => {
    const user = await callAuth(payload);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setAuthModalMode(null);
  }, []);

  const handleLogOut = useCallback(() => {
    localStorage.removeItem("aa_token");
    localStorage.removeItem("aa_user");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setMessages([]);
    setSessionId(null);
    setActiveId(null);
  }, []);

  // --- conversation state ---------------------------------------------------
  const [conversations, setConversations] = useState<Conversation[]>([]);
  // const [activeId, setActiveId] = useState<string | null>(null);
  // const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // --- composer state ---------------------------------------------------
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState<SubjectKey | undefined>(undefined);
  const [isThinking, setIsThinking] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetchConversations()
      .then((data) => { if (!cancelled) setConversations(data); })
      .catch(handleAuthError);
    return () => { cancelled = true; };
  }, [isAuthenticated, handleAuthError]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  const startNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setSessionId(null);
    setDraft("");
    setSubject(undefined);
    textareaRef.current?.focus();
  }, [setActiveId, setMessages, setDraft, setSubject, textareaRef]);


  const openConversation = useCallback(
    async (id: string) => {
      setActiveId(id);
      setSessionId(id);
      setMessages([]);
      try {
        const history = await fetchHistory(id);
        setMessages(history);
      } catch (err) {
        handleAuthError(err);
      }
    },
    [setActiveId, setMessages, handleAuthError]
  );

  const handleStarterClick = useCallback((prompt: string) => {
    setDraft(prompt);
    textareaRef.current?.focus();
  }, []);

  const handleSend = useCallback(
    async () => {
      const question = draft.trim();
      if (!question || isThinking) return;

      const userMessage: Message = {
        id: generateUUID(),
        role: "user",
        content: question,
        subject,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setDraft("");
      setIsThinking(true);

      try {
        // Ensure we have a backend session
        let sid = sessionId;
        if (!sid && isAuthenticated) {
          sid = await createSession();
          setSessionId(sid);
        }

        if (sid) {
          // Authenticated path: stream from real backend
          const assistantId = generateUUID();
          // Insert a placeholder message that we'll update in place
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: "assistant", content: "", timestamp: Date.now() },
          ]);
          setIsThinking(false);

          await streamAsk(
            sid,
            question,
            subject,
            (chunk) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + chunk } : m
                )
              );
            },
            (errMsg) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: `AlphaAsk encountered an error: ${errMsg}` }
                    : m
                )
              );
            }
          );

          // Update conversation list
          const title = question.slice(0, 48) + (question.length > 48 ? "…" : "");
          setConversations((prev) => {
            const existing = prev.find((c) => c.id === sid);
            if (existing) {
              return prev.map((c) => c.id === sid ? { ...c, title, updatedAt: Date.now() } : c);
            }
            const newConvo: Conversation = { id: sid!, title, updatedAt: Date.now(), messages: [] };
            setActiveId(sid!);
            return [newConvo, ...prev];
          });
        } else {
          // Guest path: no backend session, show a friendly nudge
          setIsThinking(false);
          setMessages((prev) => [
            ...prev,
            {
              id: generateUUID(),
              role: "assistant",
              content: "Sign in to get AI-powered answers and save your conversation history.",
              timestamp: Date.now(),
            },
          ]);
        }
      } catch (err) {
        setIsThinking(false);
        handleAuthError(err);
        if ((err as any)?.status !== 401) {
          setMessages((prev) => [
            ...prev,
            {
              id: generateUUID(),
              role: "assistant",
              content: "AlphaAsk couldn't reach the model just now. Try sending that again.",
              timestamp: Date.now(),
            },
          ]);
        }
      }
    },
    [
      draft,
      isThinking,
      subject,
      messages,
      isAuthenticated,
      activeId,
      sessionId,
      handleAuthError,
      setMessages,
      setDraft,
      setIsThinking,
      setConversations,
      setActiveId,
      setSessionId,
    ]
  );


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConversations = conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));
  const showHero = messages.length === 0;

  return (
    <div className={`aa-root aa-theme-${theme}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

        .aa-root {
          font-family: 'IBM Plex Sans', system-ui, sans-serif;
          height: 100%; width: 100%;
          display: flex; overflow: hidden;
          color: var(--aa-text);
          background: var(--aa-bg);
        }

        /* ---------- theme tokens ---------- */
        .aa-theme-dark {
          --aa-bg: #14181F;
          --aa-surface: #1C222C;
          --aa-surface-raised: #232A35;
          --aa-border: #2C3340;
          --aa-text: #ECEEF2;
          --aa-text-muted: #9AA2B0;
          --aa-sidebar-bg: #0E1116;
          --aa-sidebar-text: #D6DAE2;
          --aa-sidebar-muted: #838C9C;
          --aa-sidebar-hover: #1C222C;
          --aa-sidebar-border: #23293380;
          --aa-accent: #F2B705;
          --aa-accent-ink: #1B1400;
          --aa-accent-deep: #D9A400;
          --aa-red: #E8836B;
          --aa-red-bg: #3A241F;
          --aa-green: #6BC79A;
          --aa-green-bg: #1E3229;
          --aa-tip-bg: #362C12;
          --aa-user-bubble: #2C3340;
          --aa-overlay: rgba(4, 6, 9, 0.6);
        }
        .aa-theme-light {
          --aa-bg: #ECEEF2;
          --aa-surface: #FFFFFF;
          --aa-surface-raised: #FFFFFF;
          --aa-border: #D7DBE2;
          --aa-text: #1B2430;
          --aa-text-muted: #5B6472;
          --aa-sidebar-bg: #1B2430;
          --aa-sidebar-text: #E7E9EE;
          --aa-sidebar-muted: #8A93A3;
          --aa-sidebar-hover: #262F3E;
          --aa-sidebar-border: #37415299;
          --aa-accent: #F2B705;
          --aa-accent-ink: #1B1400;
          --aa-accent-deep: #B9860A;
          --aa-red: #C0392B;
          --aa-red-bg: #FBEAE7;
          --aa-green: #2F6F4E;
          --aa-green-bg: #EAF4EE;
          --aa-tip-bg: #FFF6DF;
          --aa-user-bubble: #1B2430;
          --aa-overlay: rgba(19, 24, 33, 0.55);
        }

        .aa-font-display { font-family: 'Source Serif 4', Georgia, serif; }
        * { box-sizing: border-box; }

        /* ---------- sidebar ---------- */
        .aa-sidebar {
          width: 272px; flex-shrink: 0;
          background: var(--aa-sidebar-bg); color: var(--aa-sidebar-text);
          display: flex; flex-direction: column;
          overflow: hidden;
          transition: width 0.22s ease, opacity 0.18s ease;
        }
        .aa-sidebar.aa-closed { width: 0; opacity: 0; }
        .aa-sidebar > * { width: 272px; flex-shrink: 0; }

        .aa-sidebar-top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 14px 10px;
        }
        .aa-brand { display: flex; align-items: center; gap: 9px; }
        .aa-mark {
          width: 28px; height: 28px; border-radius: 8px;
          background: var(--aa-accent); color: var(--aa-accent-ink);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Source Serif 4', Georgia, serif; font-weight: 700; font-size: 16px;
          flex-shrink: 0;
        }
        .aa-wordmark { font-family: 'Source Serif 4', Georgia, serif; font-weight: 600; font-size: 16px; letter-spacing: -0.01em; }
        .aa-sidebar-top-icons { display: flex; gap: 2px; }

        .aa-icon-btn {
          width: 30px; height: 30px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: none; cursor: pointer;
          color: var(--aa-sidebar-muted);
        }
        .aa-icon-btn:hover { background: var(--aa-sidebar-hover); color: var(--aa-sidebar-text); }

        .aa-new-chat {
          margin: 4px 12px 8px;
          display: flex; align-items: center; gap: 9px;
          padding: 9px 10px; border-radius: 9px;
          border: none; background: transparent; color: var(--aa-sidebar-text);
          font-size: 13.5px; font-weight: 500; cursor: pointer; text-align: left;
        }
        .aa-new-chat:hover { background: var(--aa-sidebar-hover); }
        .aa-new-chat-icon {
          width: 24px; height: 24px; border-radius: 6px;
          background: var(--aa-accent); color: var(--aa-accent-ink);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .aa-search-inline { margin: 0 4px 4px; }
        .aa-search-wrap {
          margin: 0 8px 6px;
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; border-radius: 8px;
          background: var(--aa-sidebar-hover);
        }
        .aa-search-wrap input { background: transparent; border: none; outline: none; color: var(--aa-sidebar-text); font-size: 13px; width: 100%; }
        .aa-search-wrap input::placeholder { color: var(--aa-sidebar-muted); }

        .aa-nav-list { padding: 2px 8px 6px; }
        .aa-nav-item {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 8px;
          background: transparent; border: none; color: var(--aa-sidebar-text);
          font-size: 13.5px; cursor: pointer; text-align: left;
        }
        .aa-nav-item:hover { background: var(--aa-sidebar-hover); }
        .aa-nav-item svg { color: var(--aa-sidebar-muted); flex-shrink: 0; }

        .aa-recents-label {
          font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
          color: var(--aa-sidebar-muted); padding: 14px 16px 6px;
        }
        .aa-convo-list { flex: 1; overflow-y: auto; padding: 0 8px 8px; }
        .aa-convo-item {
          width: 100%; text-align: left;
          padding: 8px 10px; border-radius: 7px;
          background: transparent; border: none; color: var(--aa-sidebar-text);
          font-size: 13px; cursor: pointer; display: block; margin-bottom: 1px;
        }
        .aa-convo-item:hover { background: var(--aa-sidebar-hover); }
        .aa-convo-item.aa-active { background: var(--aa-sidebar-hover); box-shadow: inset 2px 0 0 var(--aa-accent); }
        .aa-convo-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .aa-convo-time { font-size: 11px; color: var(--aa-sidebar-muted); margin-top: 2px; }

        .aa-sidebar-guest { padding: 4px 16px 14px; display: flex; flex-direction: column; gap: 10px; }
        .aa-sidebar-guest p { font-size: 12.5px; line-height: 1.55; color: var(--aa-sidebar-muted); margin: 0; }

        .aa-upsell {
          margin: 6px 12px 4px; padding: 10px 12px; border-radius: 10px;
          background: var(--aa-sidebar-hover);
          display: flex; align-items: center; gap: 9px;
          border: none; color: var(--aa-sidebar-text); font-size: 13px; font-weight: 500; cursor: pointer;
          width: calc(100% - 24px);
        }
        .aa-upsell:hover { background: var(--aa-border); }
        .aa-upsell svg { color: var(--aa-accent); flex-shrink: 0; }

        .aa-sidebar-footer {
          padding: 10px 12px 14px;
          display: flex; align-items: center; gap: 9px;
        }
        .aa-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--aa-accent); color: var(--aa-accent-ink);
          font-size: 11.5px; font-weight: 600;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .aa-user-name { font-size: 13px; color: var(--aa-sidebar-text); }
        .aa-user-sub { font-size: 11px; color: var(--aa-sidebar-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* ---------- main column ---------- */
        .aa-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

        .aa-topbar {
          height: 56px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 18px;
        }
        .aa-topbar-left { display: flex; align-items: center; gap: 10px; }

        .aa-guest-actions { display: flex; gap: 8px; align-items: center; }
        .aa-btn {
          font-size: 13px; font-weight: 500; padding: 7px 13px; border-radius: 8px;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
          border: 1px solid var(--aa-border); background: transparent; color: var(--aa-text);
        }
        .aa-btn:hover { background: var(--aa-surface-raised); }
        .aa-btn-primary { background: var(--aa-text); color: var(--aa-bg); border-color: var(--aa-text); }
        .aa-btn-primary:hover { opacity: 0.88; }

        .aa-theme-toggle {
          width: 34px; height: 34px; border-radius: 8px;
          border: 1px solid var(--aa-border); background: transparent; color: var(--aa-text-muted);
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .aa-theme-toggle:hover { background: var(--aa-surface-raised); color: var(--aa-text); }

        /* ---------- thread ---------- */
        .aa-thread { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        .aa-thread-inner { max-width: 760px; margin: 0 auto; padding: 28px 24px 12px; width: 100%; }

        /* ---------- hero (vertically centered, like a blank composer state) ---------- */
        .aa-hero-wrap { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .aa-hero { max-width: 640px; width: 100%; text-align: center; }
        .aa-hero-title { font-family: 'Source Serif 4', Georgia, serif; font-size: 30px; font-weight: 600; margin: 0 0 26px; letter-spacing: -0.01em; }

        .aa-starter-row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 18px; }
        .aa-starter {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; padding: 9px 14px; border-radius: 10px;
          border: 1px solid var(--aa-border); background: var(--aa-surface); color: var(--aa-text-muted);
          cursor: pointer;
        }
        .aa-starter:hover { color: var(--aa-text); border-color: var(--aa-text-muted); }
        .aa-starter svg { color: var(--aa-accent-deep); }

        .aa-chip-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 14px; }
        .aa-chip {
          font-size: 12.5px; padding: 6px 12px; border-radius: 999px;
          border: 1px solid var(--aa-border); background: var(--aa-surface); color: var(--aa-text-muted);
          cursor: pointer;
        }
        .aa-chip.aa-chip-active { background: var(--aa-text); color: var(--aa-bg); border-color: var(--aa-text); }
        .aa-chip:hover:not(.aa-chip-active) { border-color: var(--aa-text-muted); color: var(--aa-text); }

        /* ---------- messages ---------- */
        .aa-row { display: flex; margin-bottom: 22px; }
        .aa-row.aa-user { justify-content: flex-end; }
        .aa-bubble-user {
          max-width: 72%; background: var(--aa-user-bubble); color: #fff;
          padding: 10px 14px; border-radius: 14px 14px 3px 14px;
          font-size: 14.5px; line-height: 1.55;
        }
        .aa-theme-light .aa-bubble-user { color: #fff; }
        .aa-assistant-wrap { display: flex; gap: 14px; max-width: 100%; }
        .aa-assistant-mark {
          width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0; margin-top: 2px;
          background: var(--aa-accent); color: var(--aa-accent-ink);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Source Serif 4', Georgia, serif; font-weight: 700; font-size: 13px;
        }
        .aa-assistant-body { flex: 1; min-width: 0; }
        .aa-assistant-text {
          font-size: 14.5px; line-height: 1.65; color: var(--aa-text);
          background: var(--aa-surface); border: 1px solid var(--aa-border);
          padding: 13px 15px; border-radius: 3px 14px 14px 14px;
        }

        .aa-margin { margin: 8px 0 0 2px; display: flex; flex-direction: column; gap: 6px; }
        .aa-tag {
          display: inline-flex; align-items: center; gap: 5px; width: fit-content;
          font-family: 'IBM Plex Mono', monospace; font-size: 11px;
          padding: 3px 9px 3px 7px; border-radius: 3px;
          transform: rotate(-0.6deg); border-left: 2px solid transparent;
        }
        .aa-tag-positive { background: var(--aa-green-bg); color: var(--aa-green); border-left-color: var(--aa-green); }
        .aa-tag-tip { background: var(--aa-tip-bg); color: var(--aa-accent-deep); border-left-color: var(--aa-accent-deep); }
        .aa-tag-watch { background: var(--aa-red-bg); color: var(--aa-red); border-left-color: var(--aa-red); }

        .aa-thinking { display: flex; gap: 14px; }
        .aa-dots { display: flex; gap: 4px; padding: 13px 15px; background: var(--aa-surface); border: 1px solid var(--aa-border); border-radius: 3px 14px 14px 14px; }
        .aa-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--aa-text-muted); animation: aa-bounce 1.1s infinite ease-in-out; }
        .aa-dot:nth-child(2) { animation-delay: 0.15s; }
        .aa-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes aa-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-3px); opacity: 1; } }

        /* ---------- composer ---------- */
        .aa-composer-wrap { padding: 10px 18px 22px; }
        .aa-composer { max-width: 720px; margin: 0 auto; }
        .aa-composer-box {
          border: 1px solid var(--aa-border); background: var(--aa-surface);
          border-radius: 16px; padding: 8px 10px 8px 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .aa-composer-plus {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          border: 1px solid var(--aa-border); background: transparent; color: var(--aa-text-muted);
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .aa-composer-box textarea {
          flex: 1; resize: none; border: none; outline: none;
          font-family: 'IBM Plex Sans', sans-serif; font-size: 14.5px; line-height: 1.5;
          max-height: 160px; padding: 8px 0; color: var(--aa-text); background: transparent;
        }
        .aa-composer-box textarea::placeholder { color: var(--aa-text-muted); }
        .aa-send-btn {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          background: var(--aa-accent); color: var(--aa-accent-ink); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .aa-send-btn:disabled { background: var(--aa-border); color: var(--aa-text-muted); cursor: not-allowed; }
        .aa-composer-hint { text-align: center; font-size: 11px; color: var(--aa-text-muted); margin-top: 8px; }

        /* ---------- auth modal ---------- */
        .aa-modal-overlay {
          position: fixed; inset: 0; background: var(--aa-overlay);
          display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px;
        }
        .aa-modal-card {
          position: relative; width: 100%; max-width: 380px;
          background: var(--aa-surface); color: var(--aa-text);
          border: 1px solid var(--aa-border);
          border-radius: 16px; padding: 28px 26px 24px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.35);
        }
        .aa-modal-close {
          position: absolute; top: 16px; right: 16px;
          width: 28px; height: 28px; border-radius: 7px;
          border: none; background: transparent; color: var(--aa-text-muted); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .aa-modal-close:hover { background: var(--aa-bg); }
        .aa-modal-title { font-family: 'Source Serif 4', Georgia, serif; font-size: 21px; font-weight: 600; margin: 0 0 4px; }
        .aa-modal-sub { font-size: 12.5px; color: var(--aa-text-muted); line-height: 1.5; margin: 0 0 18px; }
        .aa-field { display: block; margin-bottom: 12px; }
        .aa-field span { display: block; font-size: 12px; font-weight: 500; color: var(--aa-text-muted); margin-bottom: 5px; }
        .aa-field input {
          width: 100%; border: 1px solid var(--aa-border); border-radius: 8px;
          padding: 9px 11px; font-size: 13.5px; outline: none;
          font-family: 'IBM Plex Sans', sans-serif; background: var(--aa-bg); color: var(--aa-text);
        }
        .aa-field input:focus { border-color: var(--aa-text-muted); }
        .aa-password-wrap {
          display: flex; align-items: center; gap: 8px;
          border: 1px solid var(--aa-border); border-radius: 8px; padding: 0 11px; background: var(--aa-bg);
        }
        .aa-muted-icon { color: var(--aa-text-muted); flex-shrink: 0; }
        .aa-password-wrap input { border: none; padding: 9px 0; flex: 1; background: transparent; }
        .aa-password-wrap input:focus { border: none; }
        .aa-password-toggle { background: none; border: none; cursor: pointer; color: var(--aa-text-muted); display: flex; }
        .aa-form-error { font-size: 12px; color: var(--aa-red); background: var(--aa-red-bg); border-radius: 6px; padding: 7px 10px; margin-bottom: 12px; }
        .aa-modal-submit { width: 100%; justify-content: center; padding: 10px; font-size: 13.5px; margin-top: 4px; }
        .aa-modal-switch { text-align: center; font-size: 12.5px; color: var(--aa-text-muted); margin-top: 16px; }
        .aa-modal-switch button { background: none; border: none; color: var(--aa-text); font-weight: 600; cursor: pointer; padding: 0; text-decoration: underline; font-size: 12.5px; }
      `}</style>

      {/* ---------------- Sidebar ---------------- */}
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
          <span className="aa-new-chat-icon"><Plus size={14} /></span>
          New question
        </button>

        {searchOpen && (
          <div className="aa-search-wrap aa-search-inline">
            <Search size={13} className="aa-muted-icon" />
            <input placeholder="Search your questions" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
        )}

        <div className="aa-nav-list">
          <button className="aa-nav-item"><BookOpen size={16} /> Subjects</button>
          <button className="aa-nav-item"><Bookmark size={16} /> Saved answers</button>
          <button className="aa-nav-item"><FolderKanban size={16} /> Classes</button>
          <button className="aa-nav-item"><MoreHorizontal size={16} /> More</button>
        </div>

        {isAuthenticated ? (
          <>
            <div className="aa-recents-label">Recents</div>
            <div className="aa-convo-list">
              {filteredConversations.map((c) => (
                <button key={c.id} className={`aa-convo-item ${activeId === c.id ? "aa-active" : ""}`} onClick={() => openConversation(c.id)}>
                  <div className="aa-convo-title">{c.title}</div>
                  <div className="aa-convo-time">{timeAgo(c.updatedAt)}</div>
                </button>
              ))}
              {filteredConversations.length === 0 && (
                <div style={{ color: "var(--aa-sidebar-muted)", fontSize: 12.5, padding: "10px 10px" }}>No questions match "{search}".</div>
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
            <button className="aa-upsell" onClick={() => setAuthModalMode("signup")}>
              <Sparkles size={16} /> Sign up free
            </button>
            <div className="aa-sidebar-footer">
              <div className="aa-avatar" style={{ background: "var(--aa-sidebar-hover)", color: "var(--aa-sidebar-muted)" }}>?</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="aa-user-name">Guest</div>
                <div className="aa-user-sub">Not signed in</div>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* ---------------- Main column ---------------- */}
      <div className="aa-main">
        <div className="aa-topbar">
          <div className="aa-topbar-left">
            {!sidebarOpen && (
              <button className="aa-icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
                <PanelLeft size={17} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="aa-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {!isAuthenticated && (
              <div className="aa-guest-actions">
                <button className="aa-btn" onClick={() => setAuthModalMode("login")}><LogIn size={14} /> Log in</button>
                <button className="aa-btn aa-btn-primary" onClick={() => setAuthModalMode("signup")}><UserPlus size={14} /> Sign up</button>
              </div>
            )}
          </div>
        </div>

        <div className="aa-thread" ref={scrollRef}>
          {showHero ? (
            <div className="aa-hero-wrap">
              <div className="aa-hero">
                <div className="aa-hero-title">
                  {isAuthenticated ? `Ready when you are, ${currentUser?.name.split(" ")[0]}.` : "What are you working on?"}
                </div>

                <div className="aa-composer">
                  <div className="aa-composer-box">
                    <button className="aa-composer-plus" aria-label="Attach"><Plus size={16} /></button>
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      placeholder="Ask anything"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <button className="aa-send-btn" onClick={handleSend} disabled={!draft.trim() || isThinking}>
                      <Send size={15} />
                    </button>
                  </div>
                </div>

                <div className="aa-starter-row">
                  {STARTERS.map((s) => (
                    <button className="aa-starter" key={s.label} onClick={() => handleStarterClick(s.prompt)}>
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>

                <div className="aa-chip-row">
                  {SUBJECTS.map((s) => (
                    <button key={s.key} className={`aa-chip ${subject === s.key ? "aa-chip-active" : ""}`} onClick={() => setSubject(subject === s.key ? undefined : s.key)}>
                      {s.label}
                    </button>
                  ))}
                </div>

                {!isAuthenticated && (
                  <p style={{ fontSize: 11.5, color: "var(--aa-text-muted)", marginTop: 18 }}>
                    This conversation won't be saved. <button onClick={() => setAuthModalMode("signup")} style={{ background: "none", border: "none", color: "var(--aa-text)", fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline" }}>Sign up</button> to keep your history.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="aa-thread-inner">
                {messages.map((m) =>
                  m.role === "user" ? (
                    <div className="aa-row aa-user" key={m.id}>
                      <div className="aa-bubble-user">{m.content}</div>
                    </div>
                  ) : (
                    <div className="aa-row" key={m.id}>
                      <div className="aa-assistant-wrap">
                        <div className="aa-assistant-mark">α</div>
                        <div className="aa-assistant-body">
                          <div className="aa-assistant-text">{m.content}</div>
                          {m.annotations && m.annotations.length > 0 && (
                            <div className="aa-margin">
                              {m.annotations.map((a, i) => (
                                <span className={`aa-tag ${toneStyles[a.tone].className}`} key={i}>
                                  {toneStyles[a.tone].icon}
                                  {a.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}

                {isThinking && (
                  <div className="aa-row">
                    <div className="aa-thinking">
                      <div className="aa-assistant-mark">α</div>
                      <div className="aa-dots"><div className="aa-dot" /><div className="aa-dot" /><div className="aa-dot" /></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="aa-composer-wrap">
                <div className="aa-composer">
                  <div className="aa-chip-row" style={{ justifyContent: "flex-start", marginBottom: 8, marginTop: 0 }}>
                    {SUBJECTS.map((s) => (
                      <button key={s.key} className={`aa-chip ${subject === s.key ? "aa-chip-active" : ""}`} onClick={() => setSubject(subject === s.key ? undefined : s.key)}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <div className="aa-composer-box">
                    <button className="aa-composer-plus" aria-label="Attach"><Plus size={16} /></button>
                    <textarea
                      rows={1}
                      placeholder="Ask AlphaAsk a question…"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <button className="aa-send-btn" onClick={handleSend} disabled={!draft.trim() || isThinking}>
                      <Send size={15} />
                    </button>
                  </div>
                  <div className="aa-composer-hint">
                    {isAuthenticated ? "Enter to send · Shift+Enter for a new line · Saved to your history" : "Enter to send · Shift+Enter for a new line · Not saved — sign up to keep this"}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {authModalMode && (
        <AuthModal mode={authModalMode} onClose={() => setAuthModalMode(null)} onSwitchMode={setAuthModalMode} onSubmit={handleAuthSubmit} />
      )}
    </div>
  );
}
