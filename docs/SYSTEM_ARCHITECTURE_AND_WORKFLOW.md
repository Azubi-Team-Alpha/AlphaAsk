# AlphaAsk — Comprehensive System Architecture & Workflow Specification

## Executive Overview

**AlphaAsk** is an enterprise-grade, academic support AI web application engineered for university students. The platform leverages a modern decoupled microservices architecture featuring a high-performance React 19 single-page application (SPA), a FastAPI Python backend, AWS DynamoDB NoSQL persistence, ElastiCache Redis rate-limiting, an automated multi-provider LLM failover engine (**Groq**, **Google Gemini 3.6/3.5/2.0 Flash**, and **AWS Bedrock**), **Real-Time Server-Sent Events (SSE) word-by-word streaming**, and **Document & PDF RAG upload context injection**.

---

## 1. System Architecture & Topology

```
                  ┌─────────────────────────────────────────┐
                  │          Client Browser / UI            │
                  │   React 19 + TypeScript + Vite + CSS    │
                  └────────────────────┬────────────────────┘
                                       │ HTTPS / JSON / SSE
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │       API Gateway / Fast API            │
                  │        (Local Dev / AWS Lambda)          │
                  └───────┬─────────────┬─────────────┬─────┘
                          │             │             │
        ┌─────────────────┘             │             └─────────────────┐
        ▼                               ▼                               ▼
┌──────────────┐                 ┌──────────────┐                ┌──────────────┐
│  DynamoDB    │                 │    Redis     │                │ Multi-LLM    │
│ Persistence  │                 │ Rate Limiter │                │ Orchestrator │
└──────────────┘                 └──────────────┘                └──────┬───────┘
                                                                        │
                                       ┌────────────────────────────────┼────────────────────────────────┐
                                       ▼                                ▼                                ▼
                                ┌──────────────┐                 ┌──────────────┐                 ┌──────────────┐
                                │   Groq Cloud │                 │Google Gemini │                 │ AWS Bedrock  │
                                │ (Llama-3.3)  │                 │(Flash 3.6/3.5│                 │ (Claude 3.5) │
                                │              │                 │ 2.0 / 1.5)   │                 │              │
                                └──────────────┘                 └──────────────┘                 └──────────────┘
```

---

## 2. Component Integration & Technical Stack

### A. Frontend Layer
- **Framework**: React 19 with TypeScript, bundled via Vite.
- **Styling**: Modern CSS design system featuring custom properties, dark/light theme tokens, IBM Plex Sans & Source Serif typography, and glassmorphic micro-animations.
- **Rendering & Markdown**: Integrated `react-markdown` to parse headers, lists, code blocks, and blockquotes with `white-space: pre-wrap` styling.
- **API Client**: Modular REST & SSE client ([frontend/src/lib/api.ts](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/frontend/src/lib/api.ts)) supporting synchronous POST calls and real-time streaming event readers with cross-browser `generateUUID()` fallback.
- **Automated Test Suite**: Vitest + React Testing Library suite (`npm test`) covering navigation, component rendering, and modal workflows (6/6 tests passing).

### B. Backend API Layer
- **Framework**: FastAPI (Python 3.11+) wrapped with Mangum for serverless AWS Lambda execution.
- **Authentication**: JWT-based authentication using HS256 algorithm and `bcrypt` password hashing.
- **Configuration & Core**: Pydantic v2 Settings (`ConfigDict`) loading environment variables (`.env`).
- **Automated Test Suite**: Pytest suite (`.venv/bin/pytest`) verifying API routes, authentication, history retrieval, and question management (13/13 tests passing).

### C. Data & State Storage Layer
- **Amazon DynamoDB**:
  - `alphaask-Users`: User credentials and subscription tier data.
  - `alphaask-Sessions`: Active student chat sessions.
  - `alphaask-Messages`: Full timestamped exchange history.
  - `alphaask-Questions`: Submitted student questions and status tracking.
  - `alphaask-FAQ`: Curated knowledgebase items.
- **Redis / ElastiCache**: Sliding-window rate-limiting to prevent API abuse (fallback to memory cache in local environment).

### D. Multi-Provider LLM Orchestration Engine
- **Failover Chain**:
  1. **Groq Cloud API** (`llama-3.3-70b-versatile`) — Ultra-low latency primary provider.
  2. **Google Gemini API** (`gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`) — Secondary high-capacity fallback.
  3. **AWS Bedrock** (`us.anthropic.claude-3-5-sonnet-20241022-v2:0`, `us.amazon.nova-micro-v1:0`, `amazon.titan-text-express-v1`) — Cloud infrastructure fallback.
- **Token Output Limit**: 4,096 tokens per request.
- **HTTP Request Timeout**: 45 seconds.

---

## 3. End-to-End Execution Workflows

### 3.1 User Authentication Flow
1. User enters credentials via `AuthModal.tsx`.
2. Request hits `/api/auth/login` or `/api/auth/register`.
3. Backend validates password hash against DynamoDB `alphaask-Users`.
4. Returns JWT Bearer Token stored in browser `localStorage`.

### 3.2 Real-Time SSE Word-by-Word Streaming Q&A Flow (`/api/ask/stream`)
1. Student types question in `Composer.tsx` (optionally attaching lecture notes/PDFs).
2. `useChat` hook initiates SSE fetch request to `POST /api/ask/stream`.
3. Backend checks Redis rate limits and constructs context prompt (`prepare_user_question`).
4. Backend yields real-time word chunks (`data: {"content": "..."}\n\n`) via `StreamingResponse(media_type="text/event-stream")`.
5. Frontend `askAlphaAskStream` reader consumes tokens live, updating active assistant message placeholder word-by-word.
6. Upon stream completion, backend automatically persists user prompt and generated answer into DynamoDB `alphaask-Messages`.

### 3.3 Document & PDF Upload (RAG Strict Grounding) Flow
1. Student clicks attachment button `+` in `Composer.tsx` and selects a `.pdf`, `.txt`, `.md`, or `.doc` file.
2. Client-side stream text parser extracts clean printable text lines (stripping PDF metric arrays `/Widths` and binary headers `/FirstChar`).
3. Student toggles **`[⚡ RAG Strict Grounding: ON]`** in the UI composer (`rag_mode = True`).
4. Upon submission, backend receives `document_context` and `rag_mode: true`:
   - `chunk_and_retrieve_context()` divides long documents into overlapping passages (~1,500 chars with 200 char overlap).
   - Performs keyword relevance scoring against the student query to select the top relevant passages.
   - Activates `RAG_SYSTEM_PROMPT` enforcing strict document grounding, anti-hallucination rules, and mandatory passage citations.
5. Content is injected into the AI prompt structure:
   ```
   [RAG STRICT GROUNDING DOCUMENT PASSAGES]:
   The following passages were retrieved from the attached document. Answer ONLY using these passages:
   ... (Top retrieved document passages) ...
   [STUDENT QUESTION (RAG STRICT GROUNDING)]: (User prompt)
   ```
6. AI model generates targeted, grounded responses based exclusively on the uploaded document text.

---

## 4. Interactive Sidebar Feature Modules

| Component | Purpose & Functionality | Persistence / State |
|---|---|---|
| **SubjectsModal (`SubjectsModal.tsx`)** | Taxonomy explorer for 6 core academic disciplines: Mathematics, Computer Science, Natural Sciences, Humanities, Business, and Study Skills. Allows direct prompt injection. | Dynamic UI state |
| **ClassesModal (`ClassesModal.tsx`)** | Course workspace manager (`CS 301`, `MATH 202`, etc.) allowing students to add courses, switch active course context, and view course-specific questions. | `localStorage` (`alphaask_enrolled_courses`) |
| **SavedAnswersModal (`SavedAnswersModal.tsx`)** | Bookmarked answers repository allowing students to save helpful AI responses, search bookmarks, copy content to clipboard, or remove bookmarks. | `localStorage` (`alphaask_saved_answers`) |
| **MoreModal (`MoreModal.tsx`)** | Multi-provider AI status explorer, keyboard shortcuts cheat-sheet (`Ctrl+Enter` send, `Ctrl+K` new chat), and academic integrity compliance guide. | System diagnostics |

---

## 5. System Operational Status Matrix

| Component / Feature | Operational Status | Verification Method & Notes |
|---|---|---|
| **User Authentication** | ✅ Operational | Login, Registration, JWT Bearer Token auth |
| **Session Management** | ✅ Operational | Multi-session creation, switching, history loading |
| **Multi-Provider LLM Chain** | ✅ Operational | Groq $\rightarrow$ Gemini 3.6/3.5/2.0 Flash $\rightarrow$ AWS Bedrock failover |
| **Real-Time SSE Streaming** | ✅ Operational | `/api/ask/stream` word-by-word streaming |
| **Document & PDF Upload (RAG)** | ✅ Operational | Client/server text stream extraction for PDF/TXT notes |
| **Academic Subjects Explorer** | ✅ Operational | `SubjectsModal.tsx` discipline prompt injection |
| **Classes & Courses Manager** | ✅ Operational | `ClassesModal.tsx` enrolled course manager |
| **Saved Answers & Bookmarks** | ✅ Operational | `SavedAnswersModal.tsx` search & bookmarking |
| **Platform Study Toolkit** | ✅ Operational | `MoreModal.tsx` AI diagnostics & cheatsheets |
| **Automated Test Suites** | ✅ Operational | Pytest backend (13/13) + Vitest frontend (6/6) |
| **CI/CD & Terraform Infra** | ✅ Operational | 4-Stage GitHub Actions pipeline + AWS Terraform provision |

---

## 6. Team Meeting Summary: Completed vs. Future Roadmap

### A. What Has Been Completed (100% Production Ready)
1. **Core Serverless AWS Backend**: FastAPI container app running on AWS Lambda with API Gateway HTTP v2 routing, DynamoDB NoSQL database, and Redis rate limiting.
2. **Multi-Provider AI Resilience**: Zero-downtime failover between Groq (Llama 3.3 70B), Google Gemini (Flash 3.6/3.5/2.0), and AWS Bedrock (Claude 3.5 Sonnet).
3. **Real-Time SSE Streaming**: Word-by-word live AI response streaming.
4. **Document RAG Upload**: Lecture notes & PDF text extraction and context injection.
5. **Complete Sidebar Toolsuite**: Enrolled course workspaces, saved answer bookmarks, academic subjects explorer, and system diagnostics.
6. **Automated Testing Suite**: 13 Pytest backend unit tests and 6 Vitest frontend integration tests.

### B. Future Roadmap (Post-Launch Phase 2 Opportunities)
1. **Server-Side Vector Database (Pinecone / Pgvector)**: Persistent multi-document semantic similarity search across semester-long course materials.
2. **Multi-Modal Image & Voice Input**: Direct OCR scanning of handwritten equation photos and voice message transcriptions.
3. **Collaborative Study Groups**: Real-time shared chat workspaces for multi-student group study.
4. **Institutional Admin Dashboard**: Analytics dashboard for university professors to view top academic queries and subject trends.

---

## 7. Architecture Requirements Compliance Audit (Azubi Africa Specification)

| Required Service / Feature | Slide Requirement Description | Implementation Status in AlphaAsk | Compliance |
|:---|:---|:---|:---:|
| **AWS Cloud** | Host infrastructure on AWS Cloud | Provisioned via Terraform (`infra/terraform/`) in AWS region `us-east-1` | ✅ **100% Met** |
| **CI/CD Pipeline** | GitHub Actions automated workflow | 4-Stage CI/CD pipeline (`.github/workflows/deploy.yml`) for lint, test, ECR build, and Terraform deploy | ✅ **100% Met** |
| **Amazon API Gateway** | Public API Endpoints / Receives Requests | HTTP API v2 instance routing all incoming requests to Lambda (`ANY /{proxy+}`) | ✅ **100% Met** |
| **AWS Lambda** | Processes backend API requests | FastAPI container image hosted on Amazon ECR and executed serverlessly via Lambda | ✅ **100% Met** |
| **Amazon DynamoDB** | Store questions, messages, and responses | 5 On-Demand NoSQL tables (`Users`, `Sessions`, `Messages`, `Questions`, `FAQ`) | ✅ **100% Met** |
| **AI Service** | Call external API / ML model | Multi-Provider failover engine: Groq (`llama-3.3-70b`), Google Gemini (`3.6`/`3.5`/`2.0 Flash`), and AWS Bedrock (`Claude 3.5 Sonnet`) | ✅ **100% Met** |
| **Trello / Jira** | Agile task & project management | Team workflow tracking user stories, bugs, and sprint task progress | ✅ **100% Met** |
