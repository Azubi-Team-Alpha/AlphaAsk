# AlphaAsk — Comprehensive System Architecture & Workflow Specification

## Executive Overview

**AlphaAsk** is an enterprise-grade, academic support AI web application engineered for university students. The platform leverages a modern decoupled microservices architecture featuring a high-performance React 19 single-page application (SPA), Cloudflare DNS & WAF edge security, AWS CloudFront CDN, a FastAPI Python backend on AWS Lambda, AWS DynamoDB NoSQL persistence, ElastiCache Redis rate-limiting, an automated 4-provider LLM failover engine (**AWS Bedrock**, **Groq Cloud API**, **Google Gemini API**, and **OpenRouter API**), **Real-Time Server-Sent Events (SSE) word-by-word streaming**, and **Document RAG Strict Grounding Mode**.

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
                  │          Cloudflare DNS & WAF           │
                  │        (alphaask.alphateam.live)        │
                  └────────────────────┬────────────────────┘
                                       │ HTTPS / Edge CDN
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │       API Gateway / FastAPI             │
                  │        (Local Dev / AWS Lambda)          │
                  └───────┬─────────────┬─────────────┬─────┘
                          │             │             │
        ┌─────────────────┘             │             └─────────────────┐
        ▼                               ▼                               ▼
┌──────────────┐                 ┌──────────────┐                ┌──────────────┐
│  DynamoDB    │                 │    Redis     │                │ 4-LLM Engine │
│ Persistence  │                 │ Rate Limiter │                │ Orchestrator │
└──────────────┘                 └──────────────┘                └──────┬───────┘
                                                                        │
        ┌───────────────────────────────┬───────────────────────────────┼───────────────────────────────┐
        ▼                               ▼                               ▼                               ▼
 ┌──────────────┐                ┌──────────────┐                ┌──────────────┐                ┌──────────────┐
 │ AWS Bedrock  │                │  Groq Cloud  │                │Google Gemini │                │  OpenRouter  │
 │ (Claude 3.5) │                │ (Llama-3.3)  │                │ (Flash 2.5)  │                │(DeepSeek/GPT)│
 └──────────────┘                └──────────────┘                └──────────────┘                └──────────────┘
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
- **Framework**: FastAPI (Python 3.12) wrapped with Mangum for serverless AWS Lambda execution.
- **Authentication**: JWT-based authentication using HS256 algorithm and `bcrypt` password hashing.
- **Configuration & Core**: Pydantic v2 Settings (`ConfigDict`) loading environment variables (`.env`).
- **Automated Test Suite**: Pytest suite (`.venv/bin/pytest`) verifying API routes, authentication, history retrieval, and question management (13/13 tests passing).

### C. Data & State Storage Layer
- **Amazon DynamoDB**:
  - `alphaask-Users`: User credentials and subscription tier data.
  - `alphaask-Sessions`: Active student chat sessions.
  - `alphaask-Messages`: Full timestamped exchange history.
  - `alphaask-Questions`: Submitted student questions with `UserQuestionsIndex` GSI.
  - `alphaask-FAQ`: Curated knowledgebase items.
- **Redis / ElastiCache**: Sliding-window rate-limiting to prevent API abuse (fallback to memory cache in local environment).

### D. Multi-Provider 4-LLM Orchestration Engine
- **Failover Chain & Model Routing**:
  1. **AWS Bedrock** (`us.anthropic.claude-3-5-sonnet-20241022-v2:0`) — Primary cloud model for high-reasoning tasks.
  2. **Groq Cloud API** (`llama-3.3-70b-versatile`) — Ultra-low latency streaming provider (`GROQ_API_KEY`).
  3. **Google Gemini API** (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`) — Secondary high-capacity fallback (`GEMINI_API_KEY`).
  4. **OpenRouter API** (`deepseek/deepseek-r1`, `openai/gpt-4o`, `anthropic/claude-3.5-sonnet`, `meta-llama/llama-3.3-70b-instruct`, `qwen/qwen-2.5-coder-32b-instruct`) — Tertiary multi-model fallback (`OPENROUTER_API_KEY`).
- **Token Output Limit**: 4,096 tokens per request (2,048 tokens on SSE streaming).
- **HTTP Request Timeout**: 45 seconds (20s per provider in failover loop).

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
| **4-Provider LLM Chain** | ✅ Operational | AWS Bedrock $\rightarrow$ Groq $\rightarrow$ Gemini Flash $\rightarrow$ OpenRouter failover |
| **Real-Time SSE Streaming** | ✅ Operational | `/api/ask/stream` word-by-word streaming |
| **Document & PDF Upload (RAG)** | ✅ Operational | Client/server text stream extraction & strict document grounding mode |
| **Academic Subjects Explorer** | ✅ Operational | `SubjectsModal.tsx` discipline prompt & model routing |
| **Classes & Courses Manager** | ✅ Operational | `ClassesModal.tsx` enrolled course manager |
| **Saved Answers & Bookmarks** | ✅ Operational | `SavedAnswersModal.tsx` search & bookmarking |
| **Platform Study Toolkit** | ✅ Operational | `MoreModal.tsx` AI diagnostics & cheatsheets |
| **Automated Test Suites** | ✅ Operational | Pytest backend (13/13) + Vitest frontend (6/6) |
| **CI/CD & Terraform Infra** | ✅ Operational | 4-Stage GitHub Actions pipeline + AWS Terraform provision |

---

## 6. Team Meeting Summary: Completed vs. Future Roadmap

### A. What Has Been Completed (100% Production Ready)
1. **Core Serverless AWS Backend**: FastAPI container app running on AWS Lambda with API Gateway HTTP v2 routing, Cloudflare DNS, DynamoDB NoSQL database, and Redis rate limiting.
2. **4-Provider AI Resilience Engine**: Zero-downtime failover cascade between AWS Bedrock (Claude 3.5 Sonnet), Groq (Llama 3.3 70B), Google Gemini (Flash 2.5/2.0), and OpenRouter API (DeepSeek-R1, GPT-4o, Qwen-Coder).
3. **Real-Time SSE Streaming**: Word-by-word live AI response streaming.
4. **Document RAG Upload & Strict Grounding**: Lecture notes & PDF text extraction, passage chunking, keyword relevance scoring, and strict document grounding mode.
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
| **Amazon DynamoDB** | Store questions, messages, and responses | 5 On-Demand NoSQL tables (`Users`, `Sessions`, `Messages`, `Questions` with `UserQuestionsIndex` GSI, `FAQ`) | ✅ **100% Met** |
| **AI Service** | Call external API / ML model | 4-Provider LLM engine: AWS Bedrock (`Claude 3.5`), Groq (`Llama-3.3 70B`), Google Gemini (`Flash 2.5`), and OpenRouter (`DeepSeek-R1`) | ✅ **100% Met** |
| **Trello / Jira** | Agile task & project management | Team workflow tracking user stories, bugs, and sprint task progress | ✅ **100% Met** |
