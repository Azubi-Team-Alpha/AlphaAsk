# AlphaAsk — Complete Product Presentation & Demo Guide

**Team Alpha** | **Azubi Africa AWS AI Project 3**  
**Platform**: AlphaAsk — Serverless AI-Powered Academic Support System  
**Live URL**: https://alphaask.alphateam.live  
**Target Presentation Duration**: 12–15 Minutes (Slides + Live Interactive Demo + Q&A)

---

## Executive Presentation Overview

This guide provides a comprehensive, turn-by-turn presentation script, live demonstration walkthrough, architectural defense, and technical Q&A response playbook for **AlphaAsk**.

### Presentation Structure & Time Allocation

| Segment | Topic | Time | Speaker Focus |
|:---:|:---|:---:|:---|
| **Part 1** | **Introduction & Problem Statement** | 2 Mins | Educational bottleneck, student pain points, lack of query tracking |
| **Part 2** | **Solution Vision & Architecture** | 3 Mins | Serverless AWS topology, 4-LLM orchestration, SSE streaming, RAG grounding |
| **Part 3** | **Live Platform Demonstration** | 5 Mins | Auth, streaming Q&A, RAG, flashcards, Pomodoro timer, citations, toolkit |
| **Part 4** | **DevOps, CI/CD & Engineering Challenges** | 2 Mins | GitHub Actions, Terraform IaC, 14 technical challenges resolved |
| **Part 5** | **Future Roadmap & Technical Q&A** | 3 Mins | Phase 2 features, judge/evaluator questions |

---

## Part 1: High-Impact Opening & Customer Problem Statement (2 Mins)

### Slide 1: Title Slide — AlphaAsk
> **Speaker Notes**:  
> *"Good morning/afternoon, evaluators and Team Alpha! Today we're presenting **AlphaAsk** — an enterprise-grade, fully serverless AI academic support platform engineered for university students. AlphaAsk eliminates the academic support bottleneck by delivering instant, intelligent, document-grounded AI assistance, 24/7, at zero idle cost."*

### Slide 2: The Student Problem
> **Speaker Notes**:  
> *"Modern universities face a severe operational challenge. During peak semester periods, academic support desks are overwhelmed. This creates three critical problems:*
>
> 1. **Response Delays**: Students wait hours or days for basic coursework clarification.
> 2. **Strained Faculty Resources**: TAs spend valuable time answering the same fundamental questions repeatedly instead of focusing on high-value teaching.
> 3. **No Centralized Query Tracking**: Institutions have zero visibility into what students struggle with most — making it impossible to proactively address curriculum gaps.
>
> *AlphaAsk was engineered to eliminate all three bottlenecks simultaneously."*

---

## Part 2: Solution Vision & Architecture (3 Mins)

### Slide 3: The AlphaAsk Solution

> **Speaker Notes**:  
> *"AlphaAsk delivers an automated, 24/7 AI-powered student assistant. It combines:*
> - *Instant word-by-word streaming responses via SSE*
> - *4-provider LLM resilience with zero-downtime failover*
> - *RAG Strict Grounding Mode for document-based, anti-hallucination answers*
> - *A complete academic study toolkit: flashcard generator, Pomodoro timer, citation manager, and more*
> - *All hosted on a zero-idle-cost AWS serverless infrastructure — costing under $5/month for 10,000 student queries."*

### Slide 4: System Architecture & AWS Infrastructure Topology

![AlphaAsk Architecture Diagram](alphaask-architecture.drawio.png)

> **Speaker Notes**:  
> *"Our architecture is built on 7 engineering pillars:*
>
> 1. **Cloudflare DNS & WAF**: Global DNS resolution + web application firewall at `alphaask.alphateam.live` — edge security before traffic reaches AWS.
> 2. **Amazon API Gateway (HTTP API v2)**: Public HTTPS entry point routing `ANY /{proxy+}` to Lambda with automated CORS handling.
> 3. **AWS Lambda (Containerized FastAPI)**: Python 3.12 FastAPI backend packaged as an OCI Docker container image in Amazon ECR; serverless execution via the `Mangum` ASGI adapter.
> 4. **Amazon DynamoDB**: 5 on-demand NoSQL tables — `Users`, `Sessions`, `Messages`, `Questions` (with `UserQuestionsIndex` GSI for O(1) history lookup), and `FAQ`.
> 5. **Amazon ElastiCache Redis**: Sliding-window rate-limiting (10 req/min/user) protecting all downstream API providers.
> 6. **4-Provider AI Resilience Engine**: Zero-downtime failover cascade — **OpenRouter API** (1st, 400+ models, native SSE, discipline routing) → **Groq Cloud** (2nd, Llama-3.3 70B, native SSE) → **Google Gemini** (3rd, Flash 2.5/2.0) → **AWS Bedrock** (4th, Claude 3.5 Sonnet).
> 7. **S3 + CloudFront CDN**: React 19 SPA served globally from Amazon S3 via CloudFront edge locations."*

### Slide 5: 4-Provider LLM Engine & Discipline Model Routing

> **Speaker Notes**:  
> *"One of our most powerful innovations is the subject-aware discipline model router. Rather than sending every question to one generic model, OpenRouter routes queries to the optimal specialist model based on the academic subject:*
>
> - **Math questions** → `deepseek/deepseek-r1` (world-class reasoning) with GPT-4o as fallback
> - **Code & CS questions** → `qwen/qwen-2.5-coder-32b-instruct` (specialized code model) with Llama and DeepSeek fallbacks
> - **Writing & Humanities** → `anthropic/claude-3.5-sonnet` (best for nuanced writing) with GPT-4o fallback
> - **Science** → `google/gemini-2.0-flash-001` with DeepSeek-R1 fallback
> - **History & Social Sciences** → Claude 3.5 Sonnet with GPT-4o fallback
> - **Study Strategy** → GPT-4o-mini with Gemini fallback
>
> *If OpenRouter is unavailable, we seamlessly fall back to Groq native SSE streaming, then Gemini, then AWS Bedrock — with zero interruption to the student's experience."*

---

## Part 3: Live Interactive Platform Demonstration (5 Mins)

> **Pre-Demo Checklist**:
> - Open browser to live URL: **https://alphaask.alphateam.live** (or local `http://localhost:5173`)
> - Prepare a sample PDF/TXT file (e.g. `Data_Structures_Lecture_3.pdf` or `algorithms_notes.txt`)
> - Ensure browser console is clear; JWT token cleared if testing fresh registration
> - Confirm `/health` endpoint returns `{"status": "ok"}`

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              LIVE DEMO TIMELINE & ACTIONS                           │
├──────┬──────────────────────────────┬───────────────────────────────────────────────┤
│ Step │ Demonstration Module         │ Action & Speaker Script                       │
├──────┼──────────────────────────────┼───────────────────────────────────────────────┤
│ 3.1  │ Authentication & Onboarding  │ Register / Login student account              │
│ 3.2  │ SSE Real-Time Streaming Q&A  │ Ask complex CS question, watch live streaming  │
│ 3.3  │ Subject Taxonomy Explorer    │ Switch to Math, explore discipline model routing│
│ 3.4  │ RAG Strict Grounding Mode    │ Upload PDF, toggle RAG, ask targeted question  │
│ 3.5  │ AI Flashcard Generator       │ Generate flashcards from conversation content  │
│ 3.6  │ Pomodoro Timer               │ Launch 25-min Pomodoro study timer             │
│ 3.7  │ Citation Manager             │ Generate APA/MLA citation from content         │
│ 3.8  │ Study Toolkit (sidebar)      │ Bookmarks, Course workspaces, Question history │
└──────┴──────────────────────────────┴───────────────────────────────────────────────┘
```

### Step 3.1: Student Authentication & Session Management
- **Action**: Click **"Sign In / Register"** in the TopBar. Register a new student (e.g., `alex.student@university.edu`) or sign in with an existing account.
- **Presenter Dialogue**:
  > *"Our authentication system uses bcrypt password hashing and HS256 JWT Bearer Tokens with an 8-hour session window — long enough that students don't get logged out mid-study session. Sessions are stored in `localStorage` and the JWT is sent as an `Authorization: Bearer` header on every protected API call."*

### Step 3.2: Real-Time SSE Word-by-Word Streaming Q&A
- **Action**: Type a multi-part CS question in the Composer:
  > *"Explain the difference between Dynamic Programming and Greedy Algorithms. Include a Python code example for the 0/1 Knapsack problem."*
- **Action**: Click **Send** (or press `Ctrl + Enter`). Observe word-by-word live streaming.
- **Presenter Dialogue**:
  > *"Watch the response stream word-by-word in real time — that's our `POST /api/ask/stream` endpoint using native OpenRouter or Groq Server-Sent Events. Unlike traditional APIs that block for 5–10 seconds, students see the answer forming immediately — dramatically improving perceived responsiveness.*
  >
  > *Our SSE engine tries native streaming on OpenRouter first, then Groq, then falls back to chunked word emission from any provider. The full accumulated answer is persisted to DynamoDB only after the stream completes — never before."*

### Step 3.3: Subject Taxonomy & Discipline Model Routing
- **Action**: Click **"Subjects"** in the sidebar to open `SubjectsModal`. Select **Mathematics**.
- **Action**: Ask: *"Solve the quadratic equation 3x² + 7x - 6 = 0 step by step."*
- **Presenter Dialogue**:
  > *"When a student selects a subject discipline, two things happen: a subject-specific persona is injected into the system prompt (for Math: step-by-step reasoning, formula formatting, geometric intuition), AND OpenRouter routes the request to `deepseek/deepseek-r1` — one of the strongest mathematical reasoning models available — instead of the general-purpose default."*

### Step 3.4: RAG Strict Document Grounding & PDF Upload
- **Action**: Click the **`+` attachment button** in the Composer. Select a lecture notes PDF or TXT file.
- **Action**: Toggle **`[⚡ RAG Strict Grounding: ON]`** in the Composer.
- **Action**: Type: *"What are the main data structures covered in this document? Answer ONLY using facts from the attached file."*
- **Action**: Click **Send**.
- **Presenter Dialogue**:
  > *"This is our RAG Strict Grounding engine. When activated, the backend:*
  > 1. *Extracts text from the PDF using `pypdf` — with base64, Latin1 encoding, and regex fallbacks*
  > 2. *If the document exceeds 12,000 characters, chunks it into 1,500-character passages with 200-character overlaps*
  > 3. *Scores each chunk against the student's question keywords and selects the top-5 most relevant passages*
  > 4. *Activates a strict RAG system prompt with 5 anti-hallucination rules — the AI MUST answer from the document, cite passage locations, and explicitly state when the information is not available*
  >
  > *This is critically important for academic integrity — students get grounded, verifiable answers from their own course materials."*

### Step 3.5: AI Flashcard Generator
- **Action**: Click **"Flashcards"** in the sidebar to open `FlashcardModal`.
- **Action**: Generate flashcards from the last conversation or uploaded document content.
- **Presenter Dialogue**:
  > *"Students can instantly convert any AI response or uploaded lecture notes into a set of study flashcards. The LLM identifies key concepts, definitions, and Q&A pairs — turning passive reading into active recall practice."*

### Step 3.6: Pomodoro Study Timer
- **Action**: Open `PomodoroTimer` from the study toolkit. Start a 25-minute session.
- **Presenter Dialogue**:
  > *"Built directly into the platform — a Pomodoro timer for structured study sessions. 25 minutes of focused work, 5 minutes break. Students can use AlphaAsk for answers and the Pomodoro timer to maintain productive study rhythms — all in one platform."*

### Step 3.7: Citation Manager
- **Action**: Open `CitationModal`. Generate an APA or MLA citation from the conversation content.
- **Presenter Dialogue**:
  > *"Academic writing requires proper citations. Our Citation Manager helps students format references in APA or MLA style directly from the AI conversation context — eliminating a major friction point in essay and report writing."*

### Step 3.8: Study Toolkit — Bookmarks, Courses & Question History
- **Actions**:
  1. Click **"Save Answer"** (bookmark icon) on a response → opens `SavedAnswersModal` showing bookmarks with full-text search and clipboard copy.
  2. Click **"Classes"** in sidebar → `ClassesModal` — add course `CS 301 - Data Structures`, switch active course context.
  3. Click **"Questions"** → `QuestionManagement` — browse full personal question history, search, delete.
  4. Click **"More"** → `MoreModal` — multi-provider AI diagnostics, keyboard shortcuts (`Ctrl+K` new chat, `Ctrl+Enter` send).
- **Presenter Dialogue**:
  > *"The complete study workflow is covered: bookmark key answers for later review, organize conversations by course workspace, manage your full question history with O(1) GSI-powered retrieval from DynamoDB, and monitor the health of all 4 AI providers in real time."*

---

## Part 4: Technical Deep Dive, DevOps & Infrastructure (2 Mins)

### Slide 6: Architectural Requirements & Compliance Audit

We have achieved **100% compliance** with all Azubi Africa project requirements:

| Azubi Africa Requirement | AlphaAsk Implementation | Status |
|:---|:---|:---:|
| **AWS Cloud Infrastructure** | Deployed in `us-east-1` via modular Terraform IaC (`infra/terraform/`) | ✅ **100%** |
| **Amazon API Gateway** | HTTP API v2 — `ANY /{proxy+}` → Lambda; CORS-enabled; dual `/` + `/api/` prefix mount | ✅ **100%** |
| **AWS Lambda (Serverless)** | FastAPI OCI container image via Amazon ECR; Mangum ASGI adapter | ✅ **100%** |
| **Amazon DynamoDB** | 5 on-demand NoSQL tables; `UserQuestionsIndex` GSI for O(1) user-scoped queries | ✅ **100%** |
| **AI Service Integration** | 4-provider: OpenRouter (400+ models, discipline routing) + Groq (Llama 3.3 70B) + Gemini (Flash 2.5) + Bedrock (Claude 3.5) | ✅ **100%** |
| **CI/CD Automation** | 4-stage GitHub Actions (`.github/workflows/deploy.yml`): lint → test → ECR build → Terraform deploy | ✅ **100%** |
| **Agile Task Tracking** | Trello/Jira board — backlog, user stories, sprint tasks, bug tracking | ✅ **100%** |

### Slide 7: Automated Testing & Quality Assurance

```
============================== TEST SUITE RESULTS ================================
Backend (Pytest):   13/13 PASSING (100%)
  ├── test_api.py     — Health check & session route tests
  ├── test_ask.py     — /ask sync & /ask/stream SSE endpoint tests
  ├── test_history.py — /conversations & /history/{session_id} tests
  └── test_signup.py  — /auth/register & /auth/login authentication tests

Frontend (Vitest):   6/6 PASSING (100%)
  ├── Navigation component rendering tests
  ├── Composer & modal component tests
  └── LocalStorage persistence tests

Combined: Full unit & integration test coverage across all architectural layers
==================================================================================
```

### Slide 8: Key Engineering Challenges Resolved (14 Total)

> **Speaker Notes**: *"We documented and resolved 14 real engineering challenges — here are the 4 most impactful:*

1. **Terraform State Synchronization in CI/CD**:
   - *Challenge*: Ephemeral GitHub Actions runners start with empty Terraform state, causing `ResourceInUseException` on live DynamoDB tables and IAM roles.
   - *Solution*: Built a pre-apply AWS CLI resource existence check into `deploy.yml`. Live resources are imported into Terraform state before `apply` runs — making deployments fully idempotent.

2. **OpenRouter + Groq Native SSE Streaming via API Gateway**:
   - *Challenge*: API Gateway HTTP responses are traditionally buffered, breaking SSE chunked streams.
   - *Solution*: HTTP API v2 (payload format 2.0) + FastAPI `StreamingResponse(media_type="text/event-stream")` + native chunked HTTP transfer on OpenRouter and Groq endpoints within the 29-second API Gateway hard timeout.

3. **PDF Binary Byte Stream Pollution**:
   - *Challenge*: `FileReader.readAsText()` on PDFs dumps raw binary syntax (`/FirstChar`, `/Widths`, font metrics) into prompts — causing the LLM to output font tables instead of answers.
   - *Solution*: Multi-stage `clean_pdf_text_context()` — pypdf server-side extraction, base64 data URL decode, Latin1 re-encode, regex text literal extraction, XML/DOCX tag stripping.

4. **Subject-Aware Discipline Model Routing**:
   - *Challenge*: A single generic model handles all academic domains sub-optimally — math questions get worse answers from writing-tuned models.
   - *Solution*: `DISCIPLINE_MODEL_ROUTING` — a routing table mapping each subject (math, science, writing, code, history, study) to an ordered list of specialist OpenRouter models with automatic fallback."*

---

## Part 5: Future Roadmap & Technical Q&A (3 Mins)

### Slide 9: Phase 2 Expansion Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              ALPHAASK FUTURE ROADMAP                                │
├──────────────────────┬──────────────────────────────────────────────────────────────┤
│ Milestone            │ Capability                                                   │
├──────────────────────┼──────────────────────────────────────────────────────────────┤
│ 1. Vector DB         │ Pinecone/pgvector persistent semantic search across          │
│    (RAG Reranking)   │ semester-long course textbooks & multi-document libraries    │
├──────────────────────┼──────────────────────────────────────────────────────────────┤
│ 2. Multi-Modal Input │ OCR for handwritten math formulas & diagrams;                │
│    (Vision + Voice)  │ voice transcription for hands-free question submission       │
├──────────────────────┼──────────────────────────────────────────────────────────────┤
│ 3. Collaborative     │ Shared real-time study rooms for multi-student group         │
│    Study Rooms       │ sessions with AI co-pilot tutoring                           │
├──────────────────────┼──────────────────────────────────────────────────────────────┤
│ 4. Institutional     │ Faculty analytics dashboard — most common student            │
│    Analytics         │ misconceptions, top queries, subject gap analysis            │
├──────────────────────┼──────────────────────────────────────────────────────────────┤
│ 5. Full OpenRouter   │ Native streaming for all 400+ OpenRouter models;             │
│    Streaming         │ user model selection UI                                      │
└──────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## Technical Q&A Playbook (Anticipated Judge Questions & Model Answers)

### Q1: Why AWS Lambda Docker Containers instead of zip packages?
> **Answer**:  
> *"Standard Lambda zip deployments have a 250 MB uncompressed size limit. Our backend requires `boto3`, `fastapi`, `mangum`, `pydantic`, `pypdf`, `python-jose`, `passlib`, and `urllib3` — easily exceeding this. OCI containers in ECR support **up to 10 GB image sizes**, guarantee environment parity between local and cloud, and enable `linux/amd64` architecture pinning for consistent cross-platform builds with `--provenance=false`."*

### Q2: How does the 4-provider failover cascade work technically?
> **Answer**:  
> *"The `get_llm_response()` function in `llm_services.py` tries each provider in order, catching any exception and moving to the next. For streaming, `stream_llm_response()` tries native OpenRouter SSE first, then native Groq SSE, then falls back to splitting a full synchronous response into 3-word chunks emitted as SSE events. The first successful stream or response wins — students experience zero interruption."*

### Q3: How does the RAG chunking engine work?
> **Answer**:  
> *"`chunk_and_retrieve_context()` processes documents over 12,000 characters by splitting them into 1,500-character chunks with 200-character overlaps to avoid cutting mid-sentence. Each chunk is scored against the student's query using simple keyword matching (with stopword filtering) — a scoring approach that's fast enough for Lambda's execution window while being surprisingly effective for academic content. Top-5 scored passages are injected into the prompt with a strict `RAG_SYSTEM_PROMPT` that prohibits hallucination and mandates document citations."*

### Q4: How do you achieve O(1) question history retrieval in DynamoDB?
> **Answer**:  
> *"The `alphaask-Questions` table has a Global Secondary Index (`UserQuestionsIndex`) partitioned by `user_id` with `created_at` as the sort key. This enables instant chronological lookup of any student's question history without a full table scan — O(1) regardless of how many total questions exist in the system."*

### Q5: How does your system scale to zero while keeping costs minimal?
> **Answer**:  
> *"Every component is pay-per-use: API Gateway HTTP API ($1/million requests), Lambda (per-millisecond execution, zero idle cost), DynamoDB On-Demand (per read/write unit), ElastiCache (smallest t3.micro node). For an institution with 10,000 monthly queries, total AWS infrastructure cost is under **$5/month** — with the AI compute itself paid through free-tier Groq and OpenRouter quotas."*

### Q6: What's the JWT security model?
> **Answer**:  
> *"HS256 algorithm with an 8-hour expiry (480 minutes — long enough for a full study session, short enough to limit exposure). The secret key is validated at startup — if empty or under 32 characters, a production fallback secret is substituted. Passwords are hashed with bcrypt via `passlib`. JWTs are stored in `localStorage` and sent as `Authorization: Bearer` headers on all protected endpoints."*

### Q7: How does the CI/CD pipeline handle Terraform idempotency?
> **Answer**:  
> *"Ephemeral GitHub Actions runners start with an empty `terraform.tfstate`. Our `deploy.yml` runs AWS CLI existence checks (`aws dynamodb describe-table`, `aws lambda get-function`, etc.) before `terraform apply`. If a resource exists, `terraform import` maps it into the empty state file. If it doesn't exist, the import step is skipped. This makes every deployment fully idempotent — safe to run on ephemeral runners without destroying live infrastructure."*

---

## Presenter Emergency & Technical Contingency Plan

```
┌──────────────────────────┬───────────────────────────────────────┬──────────────────────────────────────┐
│ Issue Scenario           │ Backup Action                         │ Command / Procedure                  │
├──────────────────────────┼───────────────────────────────────────┼──────────────────────────────────────┤
│ Live LLM rate limit      │ Failover orchestrator auto-switches   │ No action needed — transparent to    │
│ or provider outage       │ to next provider in cascade           │ student (OpenRouter→Groq→Gemini→      │
│                          │                                       │ Bedrock)                             │
├──────────────────────────┼───────────────────────────────────────┼──────────────────────────────────────┤
│ Internet/Wi-Fi issue     │ Switch to local dev server with       │ cd backend && uvicorn app.main:app   │
│                          │ offline API keys in .env              │ cd frontend && npm run dev           │
├──────────────────────────┼───────────────────────────────────────┼──────────────────────────────────────┤
│ CORS error on live URL   │ Use pre-created backup demo account   │ demo.student@azubi.edu / Pass123!    │
├──────────────────────────┼───────────────────────────────────────┼──────────────────────────────────────┤
│ Lambda cold start delay  │ Pre-warm Lambda with a /health ping   │ curl https://alphaask.alphateam.live │
│ (>3s first response)     │ 2 minutes before demo starts          │ /api/health                          │
└──────────────────────────┴───────────────────────────────────────┴──────────────────────────────────────┘
```

---

## Team Alpha Presenter Summary Checklist

- [x] Architecture diagram updated: `docs/alphaask-architecture.drawio.png`
- [x] Live URL accessible: **https://alphaask.alphateam.live**
- [x] `/api/health` endpoint verified healthy
- [x] Sample PDF/TXT file prepared on desktop for RAG demo
- [x] JWT cleared in browser for fresh registration demo
- [x] Pytest backend 13/13 passing verified
- [x] Vitest frontend 6/6 passing verified
- [x] All 4 LLM provider API keys configured in Lambda environment variables
- [x] Team roles assigned: Slide Presenter | Live Demo Operator | Architecture Q&A Lead
- [x] Backup local dev server ready on `localhost:5173` / `localhost:8000`
