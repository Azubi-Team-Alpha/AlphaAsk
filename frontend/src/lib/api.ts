import type { AuthPayload, CurrentUser, Message, Conversation } from "../types";

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch("/api/conversations");
  return res.json();
}

export async function authenticate(payload: AuthPayload): Promise<CurrentUser> {
  const res = await fetch(`/api/auth/${payload.mode}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function askAlphaAsk(
  question: string,
  subject: string | undefined,
  history: Message[]
) {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, subject, history }),
  });
  return res.json();
}
