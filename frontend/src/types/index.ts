export type Role = "user" | "assistant";
export type AnnotationTone = "positive" | "tip" | "watch";
export type ThemeMode = "dark" | "light";
export type SubjectKey =
  | "math"
  | "science"
  | "writing"
  | "code"
  | "history"
  | "study";
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

export interface AskResponse {
  content: string;
  annotations?: Annotation[];
}

export interface CurrentUser {
  name: string;
  initials: string;
  email: string;
}

export interface AuthPayload {
  mode: AuthMode;
  name?: string;
  email: string;
  password: string;
}
