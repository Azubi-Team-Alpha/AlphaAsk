# AlphaAsk — Comprehensive System Architecture & Workflow Specification

## Executive Overview

**AlphaAsk** is an enterprise-grade, academic support AI web application engineered for university students. The platform leverages a modern decoupled microservices architecture featuring a high-performance **React 19 SPA**, **Cloudflare DNS & WAF** edge security, **AWS CloudFront CDN**, a **FastAPI Python backend** on **AWS Lambda**, **AWS DynamoDB** NoSQL persistence, **ElastiCache Redis** rate-limiting, a **4-provider LLM failover engine** (OpenRouter API → Groq Cloud API → Google Gemini API → AWS Bedrock), **Real-Time Server-Sent Events (SSE) word-by-word streaming**, **Document & PDF RAG Strict Grounding Mode**, **AI-powered Flashcard Generation**, **Pomodoro Study Timer**, **Citation Management**, and a full academic study toolkit.

---

## 1. System Architecture & Topology

> **Architecture Diagram** (see full draw.io source at [alphaask-architecture.drawio](alphaask-architecture.drawio)):

![AlphaAsk Architecture Diagram](alphaask-architecture.drawio.png)

```
                  ┌─────────────────────────────────────────┐
                  │          Client Browser / UI            │
                  │   React 19 + TypeScript + Vite + CSS    │
                  └────────────────────┬────────────────────┘
                                       │ HTTPS / JSON / SSE
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │          Cloudflare DNS & WAF           │
                  │        (alphaask.alphateam.live)        │
                  └────────────────────┬────────────────────┘
                                       │ HTTPS / Edge Security
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │      Amazon API Gateway (HTTP API v2)   │
                  │            ANY /{proxy+}                │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │    AWS Lambda (FastAPI + Mangum)         │
                  │    Docker Container Image (ECR)         │
                  └───────┬─────────────┬─────────────┬─────┘
                          │             │             │
        ┌─────────────────┘             │             └─────────────────┐
        ▼                               ▼                               ▼
┌──────────────┐                 ┌──────────────┐                ┌──────────────┐
│  DynamoDB    │                 │ ElastiCache  │                │ 4-LLM Engine │
│  5 Tables    │                 │ Redis Cache  │                │ Orchestrator │
│  (On-Demand) │                 │ 10 req/min   │                │ w/ Streaming │
└──────────────┘                 └──────────────┘                └──────┬───────┘
                                                                        │
        ┌────────────────────────────────┬──────────────────────────────┼──────────────────────────────┐
        ▼                                ▼                              ▼                              ▼
 ┌──────────────┐                ┌──────────────┐                ┌──────────────┐                ┌──────────────┐
 │  OpenRouter  │                │  Groq Cloud  │                │Google Gemini │                │ AWS Bedrock  │
 │ (1st — SSE) │                │ (2nd — SSE)  │                │ (3rd — Sync) │                │ (4th — Sync) │
 │ 400+ Models  │                │ Llama-3.3 70B│                │ Flash 2.5/2.0│                │ Claude 3.5   │
 └──────────────┘                └──────────────┘                └──────────────┘                └──────────────┘
```

---

## 2. Component Integration & Technical Stack

### A. Frontend Layer

- **Framework**: React 19 with TypeScript, bundled via Vite.
- **Styling**: Vanilla CSS design system — custom CSS properties, dark/light theme tokens, IBM Plex Sans & Source Serif typography, glassmorphic micro-animations.
- **Markdown Rendering**: `react-markdown` renders headers, lists, fenced code blocks, blockquotes with `white-space: pre-wrap`.
- **Icons**: Lucide React icon set (Send, Plus, LogIn, BookOpen, Bookmark, FolderKanban, Sparkles, ClipboardList, Moon, Sun, etc.).
- **API Client**: `frontend/src/lib/api.ts` — REST + SSE client. Reads `VITE_API_BASE_URL` at build time for environment-aware API routing. Strips trailing slashes.
- **UUID**: `frontend/src/lib/utils.ts` — `generateUUID()` using Web Crypto API with `Math.random()` fallback for HTTP environments.
- **Testing**: Vitest + React Testing Library — 4 test modules covering navigation, component rendering, modal workflows (6/6 passing).

#### Frontend Components (`frontend/src/components/`)

| Component | Purpose |
|---|---|
| `AlphaAskApp.tsx` | Top-level app shell — wraps routing, auth context, theme state |
| `App.tsx` | Root component (1,210 lines) — full state management for chat, auth, sessions, modals |
| `AuthModal.tsx` | Login/register forms with show/hide password toggle and JWT storage |
| `Composer.tsx` | Message composer — file attachment, RAG mode toggle (`⚡ RAG Strict Grounding`), send button |
| `MessageThread.tsx` | Scrollable conversation thread with auto-scroll to latest message |
| `MessageRow.tsx` | Individual message bubble — markdown rendering, copy-to-clipboard, save-answer action |
| `ThinkingIndicator.tsx` | Animated "thinking" loading state during LLM generation |
| `Sidebar.tsx` | Collapsible sidebar — session list, new chat button, study toolkit launchers |
| `TopBar.tsx` | Top navigation — dark/light theme toggle, auth controls (Login/Register/Logout) |
| `Hero.tsx` | Landing hero section shown to unauthenticated users |
| `SubjectsModal.tsx` | 6-discipline academic taxonomy explorer — click discipline to inject targeted prompt |
| `FlashcardModal.tsx` | AI-powered flashcard generation from chat content or uploaded lecture notes |
| `PomodoroTimer.tsx` | Built-in Pomodoro study timer (25 min work / 5 min break cycles) |
| `CitationModal.tsx` | Academic citation manager — generates APA/MLA formatted citations |
| `ClassesModal.tsx` | Course workspace manager — enroll in courses (e.g. `CS 301`, `MATH 202`), switch active course context; persisted in `localStorage` |
| `SavedAnswersModal.tsx` | Bookmark AI responses, full-text search saved items, copy markdown to clipboard; persisted in `localStorage` |
| `QuestionManagement.tsx` | Browse, search, and delete personal question history (calls `GET/DELETE /api/questions`) |
| `FAQ.tsx` | Frequently Asked Questions viewer (calls `GET /api/FAQ`) |
| `MoreModal.tsx` | Multi-provider AI diagnostics, keyboard shortcuts (`Ctrl+Enter` send, `Ctrl+K` new chat), academic integrity guide |

### B. Backend API Layer

- **Framework**: FastAPI (Python 3.12) + Uvicorn ASGI server.
- **Serverless Adapter**: Mangum wraps FastAPI for AWS Lambda execution (graceful `ImportError` fallback for local dev).
- **Authentication**: JWT (HS256 algorithm, 480-minute / 8-hour expiry) via `python-jose`; `bcrypt` password hashing via `passlib`.
- **Configuration**: Pydantic v2 `BaseSettings` (`SettingsConfigDict`) loading from `.env` file; strong JWT secret validation.
- **CORS Origins**: `https://alphaask.alphateam.live`, `http://localhost:5173`, `http://localhost:3000`, `http://127.0.0.1:5173`, S3 static website URL.
- **Route Mounting**: All routers mounted at **both** root (`/endpoint`) and `/api` prefix (`/api/endpoint`) for API Gateway proxy + local dev proxy compatibility.

#### Backend API Routes (`backend/app/api/`)

| File | Routes | Auth |
|---|---|:---:|
| `health.py` | `GET /health` | No |
| `auth.py` | `POST /auth/register`, `POST /auth/login` | No |
| `sessions.py` | `POST /sessions` | Yes |
| `history.py` | `GET /conversations`, `GET /history/{session_id}` | Yes |
| `ask.py` | `POST /ask` (sync), `POST /ask/stream` (SSE) | Yes |
| `questions.py` | `GET /questions`, `GET /questions/{id}`, `DELETE /questions/{id}` | Yes |
| `questions.py` (faq_router) | `GET /FAQ` | No |

### C. Data & State Storage Layer

#### Amazon DynamoDB (5 On-Demand NoSQL Tables)

| Table | PK | GSI | Data |
|---|---|---|---|
| `alphaask-Users` | `user_id` | — | Email, hashed password, created_at |
| `alphaask-Sessions` | `session_id` | — | user_id, title, created_at, updated_at |
| `alphaask-Messages` | `message_id` | — | session_id, role (user/assistant), content, timestamp |
| `alphaask-Questions` | `id` | `UserQuestionsIndex` (PK: `user_id`) | user_id, session_id, message_id, question, answer, created_at |
| `alphaask-FAQ` | `id` | — | Static FAQ entries (served inline) |

- **Questions GSI (`UserQuestionsIndex`)**: Enables O(1) user-scoped question history retrieval without full table scans.
- **Question Deletion Cascade**: `DELETE /questions/{id}` removes both the `alphaask-Questions` record and the associated `alphaask-Messages` entry.

#### Redis / ElastiCache
- **Rate Limiting**: Sliding-window algorithm — 10 requests per minute per `user_id`.
- **Fallback**: Graceful in-memory cache fallback when Redis is unavailable (local dev).
- **Terraform**: `elasticache.tf` provisions the Redis cluster + subnet group.

### D. Multi-Provider 4-LLM Orchestration Engine

#### Synchronous Failover (`get_llm_response` — `POST /ask`)

The failover cascade tries each provider in order; the **first successful response is returned**:

1. **OpenRouter API** (`OPENROUTER_API_KEY`) — Subject-aware discipline model routing; 20s timeout per model; iterates model list until success.
2. **Groq Cloud API** (`GROQ_API_KEY`) — `llama-3.3-70b-versatile`; 4,096 max tokens; 20s timeout.
3. **Google Gemini API** (`GEMINI_API_KEY`) — `gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash`; 4,096 max tokens.
4. **AWS Bedrock** (`boto3`) — `us.anthropic.claude-3-5-sonnet-20241022-v2:0`; 45s read timeout; 2 retry attempts.

#### SSE Streaming Failover (`stream_llm_response` — `POST /ask/stream`)

1. **Native OpenRouter streaming** — chunked HTTP SSE with `stream=True`; 2,048 max tokens (within API Gateway 29s hard limit).
2. **Native Groq streaming** — chunked HTTP SSE with `stream=True`; 4,096 max tokens; 60s socket timeout.
3. **Word-chunk fallback** — calls `get_llm_response()` (full cascade above), then splits result into 3-word chunks emitted as SSE events.

#### Subject-Discipline Model Routing (OpenRouter only)

| Subject | Primary | Fallback Chain |
|---|---|---|
| **Math** | `deepseek/deepseek-r1` | `openai/gpt-4o` → `meta-llama/llama-3.3-70b-instruct` → `openai/gpt-4o-mini` |
| **Writing** | `anthropic/claude-3.5-sonnet` | `openai/gpt-4o` → `google/gemini-2.0-flash-001` → `openai/gpt-4o-mini` |
| **Code** | `qwen/qwen-2.5-coder-32b-instruct` | `meta-llama/llama-3.3-70b-instruct` → `deepseek/deepseek-r1` → `openai/gpt-4o-mini` |
| **Science** | `google/gemini-2.0-flash-001` | `deepseek/deepseek-r1` → `anthropic/claude-3.5-sonnet` → `openai/gpt-4o-mini` |
| **History** | `anthropic/claude-3.5-sonnet` | `openai/gpt-4o` → `meta-llama/llama-3.3-70b-instruct` → `openai/gpt-4o-mini` |
| **Study** | `openai/gpt-4o-mini` | `google/gemini-2.0-flash-001` → `meta-llama/llama-3.3-70b-instruct` |

#### System Prompts

- **`SYSTEM_PROMPT`**: Positions AlphaAsk as a versatile academic + general knowledge assistant. Instructs detailed, Markdown-structured responses with examples and step-by-step guidance. No "be concise" instruction.
- **`RAG_SYSTEM_PROMPT`**: RAG Strict Grounding Mode — **5 strict rules**: answer ONLY from attached document passages; no external knowledge; explicit "document does not contain..." fallback; mandatory passage citations; Markdown formatting.

#### Subject Persona Injection (`SUBJECT_PERSONAS`)

When a subject is selected, a discipline-specific system instruction is prepended to the prompt:

| Subject | Injected Focus |
|---|---|
| **math** | Step-by-step reasoning, variable definitions, formula formatting, geometric intuition |
| **science** | Reaction mechanisms, physical principles, biological pathways, lab fundamentals |
| **writing** | Thesis formulation, essay structure, academic rhetoric, APA/MLA citations |
| **code** | Clean code snippets, Big-O analysis, algorithm steps, edge cases, debugging |
| **history** | Historical context, primary source analysis, cause-and-effect, comparative analysis |
| **study** | Active recall, Pomodoro technique, Feynman method, structured revision plans |

---

## 3. End-to-End Execution Workflows

### 3.1 User Authentication Flow
1. User enters credentials in `AuthModal.tsx` (login or register).
2. Request hits `POST /api/auth/register` or `POST /api/auth/login`.
3. Backend validates bcrypt password hash against `alphaask-Users` DynamoDB table.
4. Returns JWT Bearer Token (HS256, 8-hour expiry) stored in browser `localStorage`.

### 3.2 Real-Time SSE Streaming Q&A Flow (`POST /api/ask/stream`)
1. Student types question in `Composer.tsx` (optionally attaching a document and toggling RAG mode).
2. `useChat` hook in `useChat.ts` initiates SSE fetch to `POST /api/ask/stream`.
3. Backend enforces Redis rate limit (10 req/min); validates session ownership.
4. Persists user message to `alphaask-Messages` before stream starts (captures `message_id`).
5. `stream_llm_response()` tries native OpenRouter SSE → native Groq SSE → word-chunk fallback.
6. Frontend SSE reader in `api.ts` (`askAlphaAskStream`) consumes token chunks live, updating the active message placeholder word-by-word.
7. Upon stream completion, backend persists full accumulated answer to `alphaask-Messages` and creates a `alphaask-Questions` record (with `UserQuestionsIndex` GSI entry).

### 3.3 Document & PDF RAG Strict Grounding Flow
1. Student clicks the `+` attachment button in `Composer.tsx` and selects a `.pdf`, `.txt`, `.md`, or `.docx` file.
2. **Server-side extraction** (`pypdf`): `extract_pdf_with_pypdf()` extracts text page-by-page with `--- Page N ---` headers.
3. **Fallback cleaning** (`clean_pdf_text_context()`): handles raw PDF binary streams, base64 data URLs, Latin1 encoding, regex text literal extraction, and XML/DOCX tag stripping.
4. Student toggles **`[⚡ RAG Strict Grounding: ON]`** in the composer.
5. Backend receives `document_context` + `rag_mode: true`:
   - If document > 12,000 chars: `chunk_and_retrieve_context()` creates 1,500-char chunks with 200-char overlaps, scores each chunk against query keywords (stopword-filtered), and selects top-5 most relevant passages.
   - Injects passages with `RAG_STRICT GROUNDING` header into prompt (max 60,000 chars).
   - Activates `RAG_SYSTEM_PROMPT` with 5 strict anti-hallucination rules.
6. AI generates targeted, grounded responses citing only document passages.

### 3.4 Synchronous Q&A Flow (`POST /ask`)
1. Same rate-limit and session validation as streaming.
2. Fetches conversation history from DynamoDB for context.
3. Calls `get_llm_response()` (4-provider failover cascade).
4. Persists both user message and AI answer to `alphaask-Messages`.
5. Creates `alphaask-Questions` record for history tracking.

---

## 4. Study Toolkit Feature Modules

| Module | Component | Purpose | Persistence |
|---|---|---|---|
| **Academic Subjects Explorer** | `SubjectsModal.tsx` | 6-discipline taxonomy — click to inject focused prompts (Math, Science, Writing, Code, History, Study Skills) | Dynamic UI state |
| **AI Flashcard Generator** | `FlashcardModal.tsx` | Generate study flashcards from conversation content or uploaded lecture notes using LLM | Session state |
| **Pomodoro Study Timer** | `PomodoroTimer.tsx` | 25-minute focus / 5-minute break cycle timer with controls | UI state |
| **Citation Manager** | `CitationModal.tsx` | APA/MLA citation generation from conversation or document content | Session state |
| **Course Workspace Manager** | `ClassesModal.tsx` | Enroll in courses (`CS 301`, `MATH 202`), switch active course context, view course-specific questions | `localStorage` (`alphaask_enrolled_courses`) |
| **Saved Answers & Bookmarks** | `SavedAnswersModal.tsx` | Bookmark helpful AI responses, full-text search, copy markdown to clipboard, remove bookmarks | `localStorage` (`alphaask_saved_answers`) |
| **Question History** | `QuestionManagement.tsx` | View all past questions (O(1) GSI lookup), search, delete with cascade | DynamoDB GSI |
| **FAQ** | `FAQ.tsx` | 5-entry static FAQ on getting started, subjects, privacy, sharing, and accuracy | Static (API) |
| **System Info & Shortcuts** | `MoreModal.tsx` | Multi-provider AI status, keyboard shortcuts (`Ctrl+Enter` send, `Ctrl+K` new chat), academic integrity guide | System diagnostics |

---

## 5. System Operational Status Matrix

| Component / Feature | Status | Verification Method |
|---|:---:|---|
| **User Authentication** | ✅ Operational | Login, Registration, JWT Bearer Token (8h expiry) |
| **Session Management** | ✅ Operational | Multi-session create, list, switch, history load |
| **4-Provider LLM Engine** | ✅ Operational | OpenRouter → Groq → Gemini → Bedrock failover |
| **Subject Discipline Routing** | ✅ Operational | 6 subjects × dedicated OpenRouter model chains |
| **Real-Time SSE Streaming** | ✅ Operational | Native OpenRouter + Groq SSE; word-chunk fallback |
| **RAG Strict Grounding Mode** | ✅ Operational | Document chunking, keyword scoring, strict prompts |
| **PDF/Document Upload** | ✅ Operational | pypdf + base64 + regex fallback; 60K char limit |
| **AI Flashcard Generation** | ✅ Operational | `FlashcardModal.tsx` — LLM-powered cards |
| **Pomodoro Study Timer** | ✅ Operational | 25/5 min cycles with controls |
| **Citation Manager** | ✅ Operational | APA/MLA citation generation |
| **Academic Subjects Explorer** | ✅ Operational | 6-discipline prompt injection via `SubjectsModal.tsx` |
| **Course Workspace Manager** | ✅ Operational | `ClassesModal.tsx` — localStorage-persisted courses |
| **Saved Answers & Bookmarks** | ✅ Operational | `SavedAnswersModal.tsx` — search, copy, delete |
| **Question History & CRUD** | ✅ Operational | O(1) GSI lookup, delete with message cascade |
| **FAQ System** | ✅ Operational | 5 static FAQ entries via `GET /api/FAQ` |
| **Redis Rate Limiting** | ✅ Operational | 10 req/min/user; in-memory fallback |
| **DynamoDB Persistence** | ✅ Operational | 5 on-demand tables; `UserQuestionsIndex` GSI |
| **Automated Test Suites** | ✅ Operational | Pytest backend (13/13) + Vitest frontend (6/6) |
| **Terraform Infrastructure** | ✅ Operational | Lambda, API GW, DynamoDB, ECR, ElastiCache, S3, CloudFront, IAM |
| **CI/CD Pipeline** | ✅ Operational | 4-stage GitHub Actions: lint → test → ECR build → Terraform deploy |
| **Cloudflare DNS/WAF** | ✅ Operational | alphaask.alphateam.live — global DNS + edge WAF |

---

## 6. Team Summary: Completed vs. Future Roadmap

### A. Completed (100% Production Ready)
1. **Serverless AWS Architecture**: FastAPI + Mangum container on Lambda; API Gateway HTTP v2; ECR Docker registry; Cloudflare DNS + CloudFront CDN.
2. **4-Provider AI Engine**: Zero-downtime failover — OpenRouter (400+ models, discipline routing), Groq (Llama 3.3 70B native SSE), Google Gemini (Flash 2.5/2.0), AWS Bedrock (Claude 3.5 Sonnet).
3. **Real-Time SSE Streaming**: Native OpenRouter & Groq SSE; word-chunk fallback for Gemini/Bedrock.
4. **RAG Strict Grounding**: pypdf extraction, document chunking, keyword relevance scoring, strict anti-hallucination system prompts.
5. **Complete Study Toolkit**: Flashcard generator, Pomodoro timer, Citation manager, Course workspaces, Saved answers, Question history, FAQ, Subject explorer.
6. **Automated Testing**: 13 Pytest backend unit tests + 6 Vitest frontend integration tests.
7. **Full CI/CD**: 4-stage GitHub Actions pipeline with Terraform IaC deployment.

### B. Future Roadmap (Phase 2)
1. **Vector Database (Pinecone / pgvector)**: Persistent semantic similarity search across semester course materials.
2. **Multi-Modal Input**: OCR for handwritten equation photos; voice message transcription.
3. **Collaborative Study Groups**: Real-time shared chat workspaces for multi-student group study.
4. **Institutional Admin Dashboard**: Analytics for professors — top queries, subject trends, curriculum gap analysis.
5. **OpenRouter Streaming**: Full streaming support for all 400+ OpenRouter models.

---

## 7. Architecture Requirements Compliance Audit (Azubi Africa Specification)

| Required Service / Feature | Requirement Description | AlphaAsk Implementation | Compliance |
|:---|:---|:---|:---:|
| **AWS Cloud** | Host infrastructure on AWS Cloud | Provisioned via Terraform (`infra/terraform/`) in `us-east-1` | ✅ **100% Met** |
| **CI/CD Pipeline** | GitHub Actions automated workflow | 4-stage pipeline (`.github/workflows/deploy.yml`): lint → test → ECR build → Terraform deploy | ✅ **100% Met** |
| **Amazon API Gateway** | Public API endpoints | HTTP API v2 routing `ANY /{proxy+}` → Lambda; CORS-enabled | ✅ **100% Met** |
| **AWS Lambda** | Serverless compute | FastAPI container image via Amazon ECR; Mangum ASGI adapter | ✅ **100% Met** |
| **Amazon DynamoDB** | Store questions, messages, responses | 5 on-demand tables; `UserQuestionsIndex` GSI for O(1) user-scoped queries | ✅ **100% Met** |
| **AI Service** | External API / ML model | 4-provider: OpenRouter (400+ models) + Groq (Llama 3.3 70B) + Gemini (Flash 2.5) + Bedrock (Claude 3.5) | ✅ **100% Met** |
| **Trello / Jira** | Agile task & project management | Team workflow tracking user stories, bugs, and sprint task progress | ✅ **100% Met** |
