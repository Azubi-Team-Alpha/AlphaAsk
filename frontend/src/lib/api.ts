import type { AuthPayload, CurrentUser, Conversation, FAQ, Question, Message } from "../types";
import { generateUUID } from "./utils";

const rawBase = import.meta.env.VITE_API_BASE_URL || "";
const API_BASE = rawBase.replace(/\/+$/, "");

let authToken: string | null = localStorage.getItem("alphaask_token");

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("alphaask_token", token);
  } else {
    localStorage.removeItem("alphaask_token");
    localStorage.removeItem("alphaask_user");
  }
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
}

export async function createSession(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/sessions`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    return generateUUID();
  }
  const data = await res.json();
  return data.session_id || generateUUID();
}

export async function login(payload: AuthPayload): Promise<CurrentUser> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email.trim(),
      password: payload.password,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(errorData.detail || "Incorrect email or password");
  }
  const data = await res.json();
  setToken(data.access_token);
  const name = data.name || payload.email.split("@")[0] || "User";
  const initials = name.slice(0, 2).toUpperCase();
  return {
    name,
    email: payload.email,
    initials,
    token: data.access_token,
  };
}

export const authenticate = login;

export async function register(payload: AuthPayload): Promise<CurrentUser> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name?.trim() || "Student",
      email: payload.email.trim(),
      password: payload.password,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(errorData.detail || "Registration failed");
  }
  const data = await res.json();
  setToken(data.access_token);
  const name = data.name || payload.name || payload.email.split("@")[0] || "User";
  const initials = name.slice(0, 2).toUpperCase();
  return {
    name,
    email: payload.email,
    initials,
    token: data.access_token,
  };
}

export async function askAlphaAsk(question: string, session_id?: string): Promise<{ answer: string; session_id: string }> {
  const sid = session_id || generateUUID();
  const res = await fetch(`${API_BASE}/api/ask`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ question, session_id: sid }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(errorData.detail || `Server returned ${res.status}`);
  }
  return res.json();
}

export async function askAlphaAskStream(
  question: string,
  session_id: string | undefined,
  document_context: string | undefined,
  onChunk: (textSoFar: string) => void
): Promise<string> {
  const sid = session_id || generateUUID();
  try {
    const res = await fetch(`${API_BASE}/api/ask/stream`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ question, session_id: sid, document_context }),
    });

    if (!res.ok || !res.body) {
      const syncRes = await askAlphaAsk(question, sid);
      onChunk(syncRes.answer);
      return syncRes.answer;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullText += data.content;
              onChunk(fullText);
            }
          } catch {
            // ignore JSON parse errors on partial chunks
          }
        }
      }
    }
    return fullText;
  } catch {
    const syncRes = await askAlphaAsk(question, sid);
    onChunk(syncRes.answer);
    return syncRes.answer;
  }
}

export async function fetchFAQ(): Promise<FAQ[]> {
  const res = await fetch(`${API_BASE}/api/FAQ`, { headers: getHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchQuestions(): Promise<Question[]> {
  const res = await fetch(`${API_BASE}/api/questions`, { headers: getHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function deleteQuestion(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/questions/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to delete question");
  }
}

export async function fetchConversations(): Promise<Conversation[]> {
  try {
    const res = await fetch(`${API_BASE}/api/conversations`, { headers: getHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((c: any) => ({
      id: c.id,
      title: c.title || "Academic Question",
      updatedAt: c.updatedAt || Date.now(),
      messages: [],
    }));
  } catch {
    return [];
  }
}

export async function fetchHistory(sessionId: string): Promise<Message[]> {
  try {
    const res = await fetch(`${API_BASE}/api/history/${sessionId}`, { headers: getHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    const msgs = (data.messages || []).map((m: any) => ({
      id: generateUUID(),
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at || Date.now()).getTime(),
    }));
    msgs.sort((a: Message, b: Message) => {
      if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
      return a.role === "user" ? -1 : 1;
    });
    return msgs;
  } catch {
    return [];
  }
}

