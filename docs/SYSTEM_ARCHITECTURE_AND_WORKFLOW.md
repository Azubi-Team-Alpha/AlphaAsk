# AlphaAsk — Comprehensive System Architecture & Workflow Specification

## Executive Overview

**AlphaAsk** is an enterprise-grade, academic support AI web application engineered for university students. The platform leverages a modern decoupled microservices architecture featuring a high-performance React 19 single-page application (SPA), a FastAPI Python backend, AWS DynamoDB NoSQL persistence, ElastiCache Redis rate-limiting, and an automated multi-provider LLM failover engine (Groq, Google Gemini, and AWS Bedrock).

---

## 1. System Architecture & Topology

```
                  ┌─────────────────────────────────────────┐
                  │          Client Browser / UI            │
                  │   React 19 + TypeScript + Vite + CSS    │
                  └────────────────────┬────────────────────┘
                                       │ HTTPS / JSON
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
                                │ (Llama-3.3)  │                 │(Flash 1.5/2.0)│                │ (Claude 3.5) │
                                └──────────────┘                 └──────────────┘                 └──────────────┘
```

---

## 2. Component Integration & Technical Stack

### A. Frontend Layer
- **Framework**: React 19 with TypeScript, bundled via Vite.
- **Styling**: Modern CSS design system featuring custom properties, dark/light theme tokens, IBM Plex Sans & Source Serif typography, and glassmorphic micro-animations.
- **Rendering & Markdown**: Integrated `react-markdown` to parse headers, lists, code blocks, and blockquotes with `white-space: pre-wrap` styling.
- **API Client**: Modular REST client ([frontend/src/lib/api.ts](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/frontend/src/lib/api.ts)) with cross-browser `generateUUID()` fallback and JWT token header injection.

### B. Backend API Layer
- **Framework**: FastAPI (Python 3.11+) wrapped with Mangum for serverless AWS Lambda execution.
- **Authentication**: JWT-based authentication using HS256 algorithm and bcrypt password hashing.
- **Configuration & Core**: Pydantic Settings loading environment variables (`.env`).

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
  2. **Google Gemini API** (`gemini-2.0-flash` / `gemini-1.5-flash`) — Secondary high-capacity fallback.
  3. **AWS Bedrock** (`us.anthropic.claude-3-5-sonnet-20241022-v2:0` / `amazon.nova-micro-v1:0` / `amazon.titan-text-express-v1`) — Cloud infrastructure fallback.
- **Token Output Limit**: 4,096 tokens per request.
- **HTTP Request Timeout**: 45 seconds.

---

## 3. End-to-End Execution Workflows

### 3.1 User Authentication Flow
1. User enters credentials via `AuthModal.tsx`.
2. Request hits `/api/auth/login` or `/api/auth/register`.
3. Backend validates password hash against DynamoDB `alphaask-Users`.
4. Returns JWT Bearer Token stored in browser `localStorage`.

### 3.2 Chat & Question Answering Flow
1. Student inputs prompt in `Composer.tsx`.
2. Frontend generates local message item and sends POST request to `/api/ask`.
3. Backend checks Redis rate limits.
4. Session ownership is verified in `alphaask-Sessions`.
5. Recent conversation history is retrieved from `alphaask-Messages`.
6. History + System Prompt + New Prompt sent to LLM Orchestrator.
7. LLM returns formatted Markdown response.
8. Prompt and response are persisted to DynamoDB `alphaask-Messages`.
9. `MessageRow.tsx` renders response with `ReactMarkdown`.

---

## 4. Current System Status Matrix

| Component / Feature | Operational Status | Notes / Capabilities |
|---|---|---|
| **User Authentication** | Operational | Login, Registration, JWT Bearer Token auth |
| **Session Management** | Operational | Multi-session creation, switching, history loading |
| **Multi-Provider LLM Chain** | Operational | Groq -> Gemini 1.5/2.0 Flash -> AWS Bedrock failover |
| **Response Length & Detail** | Operational | Supports comprehensive outputs (up to 4,096 tokens) |
| **Markdown & Formatting** | Operational | Headers, bullet lists, bold text, code blocks render cleanly |
| **Question Management & FAQ**| Operational | Question submission, filtering, administrative FAQ modal |
| **CI/CD Pipeline** | Operational | 4-Stage GitHub Actions pipeline with Terraform provision |

---

## 5. Known Limitations & Recommended Fixes

### 1. Real-time Streaming (SSE / WebSockets)
- **Current Limitation**: AI responses are returned as a single block after completion.
- **Recommended Fix**: Implement Server-Sent Events (SSE) or WebSockets on `/api/ask` for real-time word-by-word streaming.

### 2. Document & PDF Context Upload
- **Current Limitation**: Students currently submit text prompts only.
- **Recommended Fix**: Add S3 upload integration for PDFs/lecture notes to enable Retrieval-Augmented Generation (RAG).

### 3. AWS Bedrock IAM & Model Access Verification
- **Current Limitation**: When Groq & Gemini keys are omitted, AWS Bedrock requires active model access grants in AWS Console `us-east-1`.
- **Recommended Fix**: Maintain Groq/Gemini API keys in environment config or ensure Bedrock model access permissions remain granted.
