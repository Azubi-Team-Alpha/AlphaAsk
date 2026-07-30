# AlphaAsk — AI-Powered Student Support Platform

**AlphaAsk** is an enterprise-grade, fully serverless AI academic support platform designed for university students. The application features a modern decoupled microservices architecture comprising a high-performance React 19 single-page application (SPA), a FastAPI Python backend, AWS DynamoDB NoSQL persistence, ElastiCache Redis rate-limiting, and an automated multi-provider LLM failover engine (**Groq Llama-3.3 70B**, **Google Gemini 3.6/3.5/2.0 Flash**, and **AWS Bedrock Claude 3.5 Sonnet**).

---

## 1. System Architecture (Serverless AWS)

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

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Lucide Icons, Modern CSS Design Tokens tokens.
- **Backend API**: Python 3.11+, FastAPI, Uvicorn, Mangum (ASGI Serverless Adapter).
- **AI Orchestration Engine**: Multi-Provider Failover:
  1. **Groq Cloud API** (`llama-3.3-70b-versatile`)
  2. **Google Gemini API** (`gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`)
  3. **AWS Bedrock** (`us.anthropic.claude-3-5-sonnet-20241022-v2:0`, `us.amazon.nova-micro-v1:0`, `amazon.titan-text-express-v1`)
- **Database**: Amazon DynamoDB (5 On-Demand NoSQL Tables for `Users`, `Sessions`, `Messages`, `Questions`, `FAQ`).
- **Authentication**: JWT (JSON Web Tokens via `python-jose`) and `bcrypt` password hashing.
- **Cache / Rate Limiting**: Amazon ElastiCache for Redis with graceful serverless fallback.
- **Testing**: Pytest (Backend 13/13 passing) and Vitest + React Testing Library (Frontend 6/6 passing).
- **Infrastructure as Code**: Terraform (`>= 1.5.0`, AWS Provider `~> 5.0`).
- **CI/CD Pipeline**: GitHub Actions 4-Stage automated pipeline (`.github/workflows/deploy.yml`).

---

## 3. Architecture Requirements Compliance (Azubi Africa Specification)

| Required Service / Feature | Slide Description | Implementation Status in AlphaAsk | Compliance |
|:---|:---|:---|:---:|
| **AWS Cloud** | Host infrastructure on AWS Cloud | Provisioned via Terraform (`infra/terraform/`) in AWS region `us-east-1` | ✅ **100% Met** |
| **CI/CD Pipeline** | GitHub Actions automated workflow | 4-Stage CI/CD pipeline (`.github/workflows/deploy.yml`) for lint, test, ECR build, and Terraform deploy | ✅ **100% Met** |
| **Amazon API Gateway** | Public API Endpoints / Receives Requests | HTTP API v2 instance routing all incoming requests to Lambda (`ANY /{proxy+}`) | ✅ **100% Met** |
| **AWS Lambda** | Processes backend API requests | FastAPI container image hosted on Amazon ECR and executed serverlessly via Lambda | ✅ **100% Met** |
| **Amazon DynamoDB** | Store questions, messages, and responses | 5 On-Demand NoSQL tables (`Users`, `Sessions`, `Messages`, `Questions`, `FAQ`) | ✅ **100% Met** |
| **AI Service** | Call external API / ML model | Multi-Provider failover engine: Groq (`llama-3.3-70b`), Google Gemini (`3.6`/`3.5`/`2.0`/`1.5 Flash`), and AWS Bedrock (`Claude 3.5 Sonnet`) | ✅ **100% Met** |
| **Trello / Jira** | Agile task & project management | Team workflow tracking user stories, bugs, and sprint task progress | ✅ **100% Met** |

---

## 4. Complete Platform Feature Matrix

| Feature Module | Implementation Details | Status |
|---|---|:---:|
| **User Auth & JWT** | Student registration, password hashing (`bcrypt`), JWT bearer tokens | ✅ Operational |
| **Session Management** | Multi-session creation, switching, timestamps, session message persistence | ✅ Operational |
| **Multi-LLM Failover** | Groq $\rightarrow$ Gemini 3.6/3.5/2.0 Flash $\rightarrow$ AWS Bedrock failover chain | ✅ Operational |
| **Real-Time SSE Streaming** | Live word-by-word streaming endpoint (`/api/ask/stream`) via Server-Sent Events | ✅ Operational |
| **PDF & Document RAG Upload** | Client & server text stream extraction for PDF, TXT, and MD lecture notes | ✅ Operational |
| **Academic Subjects Explorer** | Taxonomy modal covering Math, Science, Writing, Code, History, and Study Skills | ✅ Operational |
| **Classes & Courses Manager** | Enrolled course workspace manager (`CS 301`, `MATH 202`, etc.) with local state | ✅ Operational |
| **Saved Answers & Bookmarks** | Bookmarking AI responses with search filtering, clipboard copy, and removal | ✅ Operational |
| **Platform Study Toolkit** | System diagnostics, keyboard shortcuts, and academic integrity policies | ✅ Operational |
| **Automated Test Suites** | Pytest backend suite (13/13) + Vitest frontend suite (6/6) | ✅ Operational |

---

## 5. API Endpoints Reference

| Method | Endpoint | Auth Required | Description |
|:---:|:--- |:---:|:--- |
| `GET` | `/health` | No | System health check |
| `POST` | `/auth/register` | No | Student registration, returns JWT token |
| `POST` | `/auth/login` | No | Student authentication, returns JWT token |
| `POST` | `/sessions` | Yes | Create a new academic chat session |
| `GET` | `/sessions` | Yes | List user's active chat sessions |
| `POST` | `/ask` | Yes | Synchronous question submission & response |
| `POST` | `/ask/stream` | Yes | Real-time SSE word-by-word streaming response |
| `GET` | `/history/{session_id}` | Yes | Fetch conversation history for a session |
| `GET` | `/questions` | Yes | List user's past submitted questions |
| `GET` | `/questions/{id}` | Yes | Get detailed question by ID |
| `DELETE` | `/questions/{id}` | Yes | Delete a question and its answer |
| `GET` | `/FAQ` | No | Retrieve frequently asked questions |

---

## 6. Local Setup & Testing

### 6.1 Backend Setup & Unit Tests

```bash
cd backend

# Activate virtual environment
source .venv/bin/activate

# Run Pytest unit test suite
.venv/bin/pytest

# Run FastAPI server locally
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6.2 Frontend Setup & Vitest Suite

```bash
cd frontend

# Install dependencies
npm install

# Run Vitest unit & component test suite
npm test

# Run Vite dev server
npm run dev

# Run production build
npm run build
```

---

## 7. Documentation Index

- **Comprehensive Architecture Specification**: [docs/SYSTEM_ARCHITECTURE_AND_WORKFLOW.md](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/docs/SYSTEM_ARCHITECTURE_AND_WORKFLOW.md)
- **Technical Challenges & Solutions Log**: [docs/CHALLENGES_AND_SOLUTIONS.md](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/docs/CHALLENGES_AND_SOLUTIONS.md)
- **Serverless Architecture Report**: [docs/DOCKER_SERVERLESS_REPORT.md](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/docs/DOCKER_SERVERLESS_REPORT.md)
- **Local Testing & Terraform Guide**: [docs/LOCAL_TESTING_AND_TERRAFORM_GUIDE.md](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/docs/LOCAL_TESTING_AND_TERRAFORM_GUIDE.md)
