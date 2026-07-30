import type { AuthPayload, CurrentUser, Conversation, FAQ, Question } from "../types";
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
  }
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
}

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/api/conversations`, { headers: getHeaders() });
  if (!res.ok) return [];
  return res.json();
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

export async function authenticate(payload: AuthPayload): Promise<CurrentUser> {
  const endpoint = payload.mode === "login" ? `${API_BASE}/api/auth/login` : `${API_BASE}/api/auth/register`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      name: payload.name || "Student",
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Authentication failed" }));
    throw new Error(errorData.detail || "Authentication failed");
  }
  const data = await res.json();
  const token = data.access_token || "";
  if (token) {
    setToken(token);
  }
  const name = data.name || payload.name || "Student";
  const email = data.email || payload.email;
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "ST";

  return {
    email,
    name,
    initials,
    token,
  };
}

export async function askAlphaAsk(
  question: string,
  session_id?: string
) {
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
  } catch (e) {
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
