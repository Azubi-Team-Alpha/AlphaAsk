export type Role = "user" | "assistant";
export type AnnotationTone = "positive" | "tip" | "watch";
export type ThemeMode = "dark" | "light";
export type SubjectKey = "math" | "science" | "writing" | "code" | "history" | "study" | string;
export type AuthMode = "login" | "signup";

export interface Annotation {
  label: string;
  tone: AnnotationTone;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  subject?: SubjectKey;
  annotations?: Annotation[];
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
}

// Matches backend AskResponse: { answer, session_id, timestamp }
export interface AskResponse {
  answer: string;
}

export interface CurrentUser {
  name: string;
  initials: string;
  email: string;
  token: string;
}

export interface AuthPayload {
  mode: AuthMode;
  name?: string;
  email: string;
  password: string;
}

export interface Question {
  id: string;
  question: string;
  answer: string;
  session_id: string;
  created_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  created_at: string;
}

export interface AttachedFile {
  name: string;
  content: string;
  sizeFormatted?: string;
  fileType?: string;
}
