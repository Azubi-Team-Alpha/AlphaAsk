# AlphaAsk — AI-Powered Student Support Platform

**AlphaAsk** is an enterprise-grade, fully serverless AI academic support platform designed for university students. The application features a modern decoupled architecture comprising a React single-page application (SPA), a FastAPI Python backend, AWS DynamoDB NoSQL persistence, ElastiCache Redis rate-limiting, and an automated multi-provider LLM failover engine (**AWS Bedrock Claude 3.5 Sonnet**, **Groq Llama-3.3 70B**, and **Google Gemini 2.5/2.0/1.5 Flash**).

---

## 1. System Architecture

```
                       ┌─────────────────────────────────────────┐
                       │          Client Browser / UI            │
                       │   React 19 + TypeScript + Vite + CSS    │
                       └────────────────────┬────────────────────┘
                                            │ HTTPS / JSON / SSE
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │       API Gateway / FastAPI             │
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
                                     │ AWS Bedrock  │                 │  Groq Cloud  │                 │Google Gemini │
                                     │ (Claude 3.5) │                 │ (Llama-3.3)  │                 │ (2.5/2.0/1.5)│
                                     └──────────────┘                 └──────────────┘                 └──────────────┘
```

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Lucide Icons, Modern Vanilla CSS Design Tokens.
- **Backend API**: Python 3.12, FastAPI, Uvicorn, Mangum (ASGI Serverless Adapter).
- **AI Orchestration Engine**: Multi-Provider Failover & Streaming:
  1. **AWS Bedrock** (`us.anthropic.claude-3-5-sonnet-20241022-v2:0`)
  2. **Groq Cloud API** (`llama-3.3-70b-versatile` with native SSE streaming)
  3. **Google Gemini API** (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`)
- **Database**: Amazon DynamoDB (5 On-Demand NoSQL Tables: `Users`, `Sessions`, `Messages`, `Questions` with `UserQuestionsIndex` GSI, and `FAQ`).
- **Authentication**: JWT (JSON Web Tokens via `python-jose`) and `bcrypt` password hashing via `passlib`.
- **Cache / Rate Limiting**: Amazon ElastiCache for Redis with graceful fallback.
- **Testing**: Pytest (Backend) and Vitest + React Testing Library (Frontend).
- **Infrastructure as Code**: Terraform (`infra/terraform/`).
- **CI/CD Pipeline**: GitHub Actions automated pipeline (`.github/workflows/deploy.yml`).

---

## 3. Platform Capabilities & Features

- **Interactive Academic Assistant**: Natural language Q&A for student inquiries across multiple subjects (Math, Science, Writing, Code, History, and Study Skills).
- **Real-Time Streaming Responses**: Live token-by-token streaming responses via Server-Sent Events (`/api/ask/stream`).
- **Multi-Provider LLM Resilience**: Automatic failover cascade ensuring continuous service availability across AWS Bedrock, Groq, and Google Gemini APIs.
- **Secure Auth & Session Persistence**: Student user registration, encrypted credentials, JWT tokens, and multi-session conversation tracking.
- **Optimized Question Indexing**: Direct O(1) user question history retrieval powered by DynamoDB Global Secondary Indexing (`UserQuestionsIndex`).
- **Document Context Support**: Capability to attach text and document context to questions for targeted academic support.
- **Saved Answers & Bookmarks**: Response bookmarking, subject taxonomy filtering, and quick copy-to-clipboard tools.

---

## 4. Repository Structure

```
alphaask/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routes (ask, auth, history, questions)
│   │   ├── core/         # Security, JWT, config, rate limiting
│   │   ├── db/           # DynamoDB data access service
│   │   ├── schemas/      # Pydantic request/response models
│   │   ├── services/     # Multi-provider LLM orchestration & SSE streaming
│   │   └── main.py       # FastAPI application entry point
│   ├── tests/            # Pytest test suite
│   ├── Dockerfile        # Container image build for AWS Lambda
│   └── requirements.txt
├── frontend/
│   ├── src/              # React application source code
│   ├── vite.config.ts    # Vite configuration
│   └── package.json
├── infra/
│   └── terraform/        # Infrastructure configuration (API GW, Lambda, DynamoDB, Redis, S3)
├── .github/
│   └── workflows/        # GitHub Actions CI/CD workflow
└── docs/                 # Platform design & architecture documentation
```

---

## 5. API Reference

| Method | Endpoint | Auth Required | Description |
|:---:|:--- |:---:|:--- |
| `GET` | `/health` | No | System health check |
| `POST` | `/auth/register` | No | Student registration, returns JWT token |
| `POST` | `/auth/login` | No | Student authentication, returns JWT token |
| `POST` | `/sessions` | Yes | Create a new academic chat session |
| `GET` | `/conversations` | Yes | List user's active conversation sessions |
| `POST` | `/ask` | Yes | Synchronous question submission & response |
| `POST` | `/ask/stream` | Yes | Real-time SSE streaming response |
| `GET` | `/history/{session_id}` | Yes | Fetch conversation history for a session |
| `GET` | `/questions` | Yes | List user's past submitted questions |
| `GET` | `/questions/{id}` | Yes | Get detailed question record by ID |
| `DELETE` | `/questions/{id}` | Yes | Delete a question record |
| `GET` | `/FAQ` | No | Retrieve frequently asked questions |

---

## 6. Local Setup & Execution

### 6.1 Backend Setup

```bash
cd backend

# Create & activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend test suite
pytest

# Launch FastAPI development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6.2 Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run frontend unit tests
npm test

# Launch Vite development server
npm run dev

# Create production build
npm run build
```

---

## 7. Documentation Index

- **System Architecture & Workflow**: [docs/SYSTEM_ARCHITECTURE_AND_WORKFLOW.md](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/docs/SYSTEM_ARCHITECTURE_AND_WORKFLOW.md)
- **Technical Challenges & Solutions Log**: [docs/CHALLENGES_AND_SOLUTIONS.md](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/docs/CHALLENGES_AND_SOLUTIONS.md)
- **Serverless Architecture Report**: [docs/DOCKER_SERVERLESS_REPORT.md](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/docs/DOCKER_SERVERLESS_REPORT.md)
- **Local Testing & Terraform Guide**: [docs/LOCAL_TESTING_AND_TERRAFORM_GUIDE.md](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/docs/LOCAL_TESTING_AND_TERRAFORM_GUIDE.md)
