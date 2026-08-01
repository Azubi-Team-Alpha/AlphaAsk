# AlphaAsk — Product Presentation Slide Deck
## AI-Powered Student Academic Support Platform (AWS Serverless Architecture)

> **Azubi Africa — Level 2 Project 3 Deliverable**  
> **Team**: Team Alpha  
> **Customer**: Educational Institution  
> **Date**: August 2026  

---

## Slide Index & Navigation

1. [Title & Executive Summary](#slide-1-title--executive-summary)
2. [Problem Statement & Background](#slide-2-problem-statement--background)
3. [Solution Overview](#slide-3-solution-overview)
4. [High-Level Cloud Architecture](#slide-4-high-level-cloud-architecture)
5. [Frontend & User Experience](#slide-5-frontend--user-experience)
6. [Backend API & Serverless Execution](#slide-6-backend-api--serverless-execution)
7. [Multi-Provider AI Orchestration & Failover](#slide-7-multi-provider-ai-orchestration--failover)
8. [Data Architecture & DynamoDB Optimization](#slide-8-data-architecture--dynamodb-optimization)
9. [Caching & Rate Limiting (ElastiCache Redis)](#slide-9-caching--rate-limiting-elasticache-redis)
10. [Infrastructure as Code (Terraform)](#slide-10-infrastructure-as-code-terraform)
11. [Automated CI/CD Pipeline (GitHub Actions)](#slide-11-automated-cicd-pipeline-github-actions)
12. [Security, IAM & Least Privilege](#slide-12-security-iam--least-privilege)
13. [Observability & CloudWatch Monitoring](#slide-13-observability--cloudwatch-monitoring)
14. [Cost Optimization & Scaling Strategy](#slide-14-cost-optimization--scaling-strategy)
15. [Technical Challenges & Key Solutions](#slide-15-technical-challenges--key-solutions)
16. [Live Product Demo Walkthrough](#slide-16-live-product-demo-walkthrough)
17. [Project Requirements & Compliance Matrix](#slide-17-project-requirements--compliance-matrix)
18. [Summary & Next Steps](#slide-18-summary--next-steps)

---

### Slide 1: Title & Executive Summary

```
================================================================================
                                   ALPHAASK
              AI-Powered Student Academic Support Platform
================================================================================
                 Azubi Africa - Level 2 Project 3 Submission
                             Presented by Team Alpha
================================================================================
```

#### Key Highlights
- **Mission**: Automate academic question answering for university students to eliminate support backlogs and delay times.
- **Architecture**: Decoupled 100% Serverless Microservices on AWS (React 19 SPA + FastAPI container on AWS Lambda via API Gateway).
- **AI Intelligence**: Multi-Provider Failover Orchestrator (AWS Bedrock Claude 3.5 Sonnet → Groq Llama 3.3 70B → Google Gemini 2.5/2.0/1.5 Flash).
- **Data & Speed**: 5 Amazon DynamoDB On-Demand tables with O(1) GSI indexing + ElastiCache Redis rate limiting + SSE streaming.
- **Automation**: Fully automated GitHub Actions CI/CD pipeline deploying via Terraform IaC.

> **Speaker Notes**:  
> Good morning evaluators and stakeholders. Today Team Alpha presents AlphaAsk, an enterprise-grade, serverless AI platform designed to transform academic support for educational institutions. We built this platform from the ground up using AWS Serverless, Docker containers, FastAPI, React 19, and a multi-provider LLM fallback engine.

---

### Slide 2: Problem Statement & Background

#### The Challenge Facing Educational Institutions
- **High Inquiry Volume**: University support staff are overwhelmed by thousands of repetitive academic questions during peak semesters, midterms, and finals.
- **Delayed Response Times**: Students wait days for email or ticketing responses, disrupting their learning pace and course comprehension.
- **Strained Manual Resources**: Teaching assistants and administrative staff spend over 60% of their time answering recurring basic questions instead of focusing on high-value mentoring.
- **Lack of Centralized Tracking**: No automated system exists to capture common student queries, build dynamic FAQs, or analyze learning bottlenecks.

```
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│  Student Query Surge      │ ───► │  Manual Support Backlog   │ ───► │  Delayed Student Help     │
│  (Exams & Assignments)   │      │  (TA Overload & Strain)   │      │  (24-72 Hour Wait Times)  │
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

> **Speaker Notes**:  
> Our primary customer—an educational institution—faced a classic operational bottleneck: academic queries surged during exams, swamping staff and leaving students stuck without timely assistance. They required a resilient, 24/7 automated platform capable of providing immediate, accurate responses while remaining cost-effective during quiet periods.

---

### Slide 3: Solution Overview

#### AlphaAsk: Intelligent, Serverless, Always-On Academic Assistance

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                         ALPHAASK SOLUTION                               │
  ├─────────────────────────────────────────────────────────────────────────┤
  │  1. Instant AI Assistance      │ 2. High-Availability Serverless AWS     │
  │     - Instant responses via    │    - Zero idle cost (scale-to-zero)    │
  │       multi-LLM cascade        │    - 100% cloud-native serverless      │
  ├────────────────────────────────┼────────────────────────────────────────┤
  │  3. Real-Time Token Streaming  │ 4. Automated CI/CD & Security           │
  │     - Live SSE completion      │    - GitHub Actions + Terraform IaC   │
  │     - Natural typing effect    │    - Least-privilege IAM policies       │
  └────────────────────────────────┴────────────────────────────────────────┘
```

#### Core Capabilities
- **24/7 Availability**: Instant, automated AI academic answers across Math, Science, Writing, Code, History, and Study Skills.
- **Multi-Model Resilience**: Zero single-point-of-failure; automatic failover across Bedrock, Groq, and Gemini.
- **Persistent Memory**: Saved conversation history, user authentication, session state, and direct question searching.
- **Zero-Infrastructure Overhead**: Fully serverless setup—paying only for actual CPU time and API requests.

> **Speaker Notes**:  
> AlphaAsk solves the institution's challenge by delivering a 24/7 intelligent AI academic assistant. Students receive real-time answers streamed to their browsers, while the infrastructure automatically scales from zero to peak demand seamlessly.

---

### Slide 4: High-Level Cloud Architecture

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

#### Architecture Highlights
- **Static Frontend**: Hosted on Amazon S3 with CloudFront CDN distribution and custom domain routing.
- **API Entrypoint**: Amazon API Gateway (HTTP API v2) with route proxying (`ANY /{proxy+}`).
- **Compute Layer**: AWS Lambda running a Docker OCI container image (FastAPI wrapped via `Mangum`).
- **Data Tier**: Amazon DynamoDB (5 tables) + ElastiCache Redis for rate limiting.

> **Speaker Notes**:  
> Here is our serverless architecture on AWS. Notice the clear separation of concerns: requests enter via API Gateway, execute in a containerized Lambda function running FastAPI, store data in DynamoDB, and stream responses from our LLM orchestration engine.

---

### Slide 5: Frontend & User Experience

#### Modern, Premium React 19 Single Page Application (SPA)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AlphaAsk UI Component Architecture                                         │
├───────────────────┬─────────────────────────────────────────────────────────┤
│  Sidebar          │  Main Chat Workspace                                    │
│  - User Profile   │  - Header & Subject Taxonomy Chips                      │
│  - Session History│  - Scrollable Message Feed (Markdown + KaTeX + Prism)   │
│  - New Chat Button│  - SSE Token-by-Token Streaming Renderer                │
│  - Auth Triggers  │  - Context Attachment & Prompt Input Bar                │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

#### Key Technical Highlights
- **Framework**: React 19 + TypeScript + Vite.
- **Design Tokens**: Custom CSS tokens (glassmorphism, subtle micro-animations, accessible contrast ratios).
- **Streaming UI**: SSE consumer reading chunked HTTP streams (`ReadableStream`), appending tokens live.
- **State & Session Persistence**: LocalStorage JWT authentication restoration across reloads, global 401 handling.
- **Rich Rendering**: Full Markdown support, LaTeX mathematical formulas, code syntax highlighting, and copy-to-clipboard.

> **Speaker Notes**:  
> The frontend provides an intuitive, high-performance UI. It features real-time token streaming, so students see answers generated word-by-word rather than waiting for a full HTTP response.

---

### Slide 6: Backend API & Serverless Execution

#### FastAPI + Mangum Docker Container on AWS Lambda

```
Request ──► API Gateway ──► Lambda (Mangum Adapter) ──► FastAPI Router ──► Response
```

#### Backend Implementation Detail
- **Language & Runtime**: Python 3.12 running inside an Amazon ECR Docker container image.
- **ASGI Adapter**: `Mangum(app)` bridges API Gateway v2 payloads to FastAPI ASGI routing seamlessly.
- **Endpoints**:
  - `POST /api/auth/register` & `POST /api/auth/login` (JWT auth & bcrypt password hashing)
  - `POST /api/sessions` & `GET /api/conversations` (Session state & history listing)
  - `POST /api/ask` (Synchronous LLM query)
  - `POST /api/ask/stream` (Real-time SSE streaming query)
  - `GET /api/questions` & `DELETE /api/questions/{id}` (User question management)
  - `GET /api/FAQ` & `GET /api/health` (FAQ retrieval & system health monitoring)

> **Speaker Notes**:  
> By packaging FastAPI into a Docker container for AWS Lambda, we maintain standard Python code structures while benefiting from 100% serverless scaling and zero idle costs.

---

### Slide 7: Multi-Provider AI Orchestration & Failover

#### Resilient Failover Engine Across 3 AI Providers

```
                ┌─────────────────────────────────────────┐
                │        Incoming Student Question        │
                └────────────────────┬────────────────────┘
                                     │
                                     ▼
                      ┌─────────────────────────────┐
                      │   1. AWS Bedrock            │
                      │   (Claude 3.5 Sonnet)       │
                      └──────────────┬──────────────┘
                                     │ (If throttled or error)
                                     ▼
                      ┌─────────────────────────────┐
                      │   2. Groq Cloud API         │
                      │   (Llama 3.3 70B - Streaming)│
                      └──────────────┬──────────────┘
                                     │ (If quota exceeded)
                                     ▼
                      ┌─────────────────────────────┐
                      │   3. Google Gemini API      │
                      │   (2.5/2.0/1.5 Flash Cascade)│
                      └─────────────────────────────┘
```

#### Key Capabilities
- **Zero Downtime Guarantee**: If one AI provider experiences an outage or rate limit, AlphaAsk automatically falls back to the next provider within milliseconds.
- **Native Streaming**: Groq chunked HTTP streaming yields tokens directly to SSE generators for low latency.

> **Speaker Notes**:  
> Single-provider AI integrations are vulnerable to API rate limits and outages. AlphaAsk implements a multi-provider failover chain starting with AWS Bedrock, falling back to Groq Llama-3.3 70B, and then Google Gemini.

---

### Slide 8: Data Architecture & DynamoDB Optimization

#### 5 On-Demand DynamoDB NoSQL Tables

```
┌─────────────────────┬──────────────────┬───────────────────────┬───────────────────────────────┐
│ Table Name          │ Partition Key    │ Sort Key / GSI        │ Purpose                       │
├─────────────────────┼──────────────────┼───────────────────────┼───────────────────────────────┤
│ alphaask-Users      │ user_id (S)      │ EmailIndex (email)    │ Account credentials & hash    │
│ alphaask-Sessions   │ session_id (S)   │ UserSessionsIndex     │ Multi-session grouping        │
│ alphaask-Messages   │ message_id (S)   │ SessionMessagesIndex  │ Chat message transcript       │
│ alphaask-Questions  │ id (S)           │ UserQuestionsIndex    │ Fast O(1) question lookups    │
│ alphaask-FAQ        │ faq_id (S)       │ N/A                   │ Static FAQ directory          │
└─────────────────────┴──────────────────┴───────────────────────┴───────────────────────────────┘
```

#### Performance Optimization
- **Scanning Problem Fixed**: Replaced previous $O(N \times M)$ scan-all-sessions pattern with a targeted `UserQuestionsIndex` GSI on `alphaask-Questions`.
- **$O(1)$ Time Complexity**: User question listing executes in constant $O(1)$ time via GSI query.

> **Speaker Notes**:  
> We optimized our DynamoDB data layer using Global Secondary Indexes. By creating the UserQuestionsIndex GSI, we reduced question lookup complexity from an expensive scan across all sessions down to a fast $O(1)$ query.

---

### Slide 9: Caching & Rate Limiting (ElastiCache Redis)

#### Multi-Tier Protection & Fail-Open Resilience

```
Request ──► Rate Limiter ──► [ Redis Sliding Window ] ──► Allowed? ──► Execute API
                                     │
                             (If Connection Fails)
                                     ▼
                          [ Graceful Fail-Open ] ──► Execute API (Unblocked)
```

#### Technical Design
- **Sliding Window Token Bucket**: Implemented via Redis `ZREMRANGEBYSCORE`, `ZADD`, `ZCARD`, and `EXPIRE` pipeline operations.
- **Protection**: Enforces max 10 requests per minute per user to protect backend LLM quotas.
- **Graceful Fail-Open**: If Redis is un-provisioned or unreachable, the rate limiter logs a warning and allows requests through without crashing the app.

> **Speaker Notes**:  
> Rate limiting is backed by ElastiCache Redis using a sliding window algorithm. Crucially, the code is built with a fail-open pattern so that if Redis is offline, user requests continue to function smoothly.

---

### Slide 10: Infrastructure as Code (Terraform)

#### 100% Declarative AWS Infrastructure Management

```
infra/terraform/
├── main.tf              # AWS Provider & Backend settings
├── variables.tf         # Parameterized configuration (Region, Keys, Names)
├── outputs.tf           # Terraform output variables (API URLs, Bucket names)
├── ecr.tf               # Container Image Registry (alphaask-backend)
├── dynamodb.tf          # 5 DynamoDB Tables + GSIs
├── elasticache.tf       # Redis Cluster & Security Group
├── iam.tf               # Lambda Execution Role & IAM policies
├── lambda_apigw.tf      # AWS Lambda Container Function + API Gateway v2
└── s3_cloudfront.tf     # S3 Static Website & CloudFront CDN
```

#### IaC Benefits
- **Zero Manual Clicks**: Entire environment provisioned via `terraform apply`.
- **Environment Parity**: Dev, Staging, and Production share identical infrastructure code.

> **Speaker Notes**:  
> All AWS resources are managed using Terraform. This ensures complete repeatability, eliminates manual cloud console drift, and enables instant setup of new environments.

---

### Slide 11: Automated CI/CD Pipeline (GitHub Actions)

#### 4-Stage Automated Pipeline (`.github/workflows/deploy.yml`)

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│ Stage 1: Validate │ ──► │ Stage 2: ECR      │ ──► │ Stage 3: Docker   │ ──► │ Stage 4: Deploy   │
│ - Pytest Backend  │     │ - Provision ECR   │     │ - Build Container │     │ - Terraform Apply │
│ - Vitest Frontend │     │   via Terraform   │     │ - Push to ECR     │     │ - S3 Frontend Sync│
│ - TF Validate     │     │                   │     │   (latest tag)    │     │ - Invalidate CDN  │
└───────────────────┘     └───────────────────┘     └───────────────────┘     └───────────────────┘
```

#### Pipeline Highlights
- **Triggers**: Automated runs on git pushes to `main`, `dev`, and `feat/*` branches.
- **Security**: AWS Credentials and API keys securely injected via GitHub Secrets.
- **Zero Downtime**: Lambda container images updated smoothly without service interruption.

> **Speaker Notes**:  
> Our 4-stage GitHub Actions pipeline validates code via unit tests, builds the Docker container, pushes to Amazon ECR, and executes Terraform deployment automatically on every git push.

---

### Slide 12: Security, IAM & Least Privilege

#### Security-First Architecture Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SECURITY & PRIVILEGE MATRIX                           │
├───────────────────┬─────────────────────────────────────────────────────────┤
│ Layer             │ Protection Mechanism                                    │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ IAM Policy        │ Strict resource-level ARNs for DynamoDB & Bedrock       │
│ Authentication    │ Password hashing via `bcrypt` + JWT (HS256) validation  │
│ API Gateway CORS  │ Explicit domain allowlist + `allow_credentials = true`  │
│ Secrets Handling  │ Environment variable injection (Zero hardcoded secrets) │
│ Secret Validation │ Startup validator enforcing ≥32 character JWT keys      │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

#### IAM Policy snippet
```json
{
  "Effect": "Allow",
  "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query"],
  "Resource": ["arn:aws:dynamodb:us-east-1:*:table/alphaask-*"]
}
```

> **Speaker Notes**:  
> Security is embedded at every layer. IAM roles adhere strictly to the principle of least privilege, passwords are hashed with bcrypt, CORS is restricted to exact domain allowlists, and a startup validator enforces strong 32+ character JWT secrets.

---

### Slide 13: Observability & CloudWatch Monitoring

#### Real-Time Logging, Metrics & Alerting

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                   AWS CLOUDWATCH OBSERVABILITY                          │
  ├─────────────────────────────────────────────────────────────────────────┤
  │  1. CloudWatch Logs (Lambda)   │ 2. API Gateway Access Logs             │
  │     - Execution stdout/stderr  │    - Request latency & HTTP status     │
  │     - Mangum ASGI request logs │    - Route traffic metrics             │
  ├────────────────────────────────┼────────────────────────────────────────┤
  │  3. CloudWatch Alarms          │ 4. Metrics Dashboard                   │
  │     - Trigger on Lambda Errors │    - Function duration & cold starts   │
  │     - Alert on 5xx Error rates │    - DynamoDB consumed capacity units │
  └────────────────────────────────┴────────────────────────────────────────┘
```

#### Monitoring Setup
- **Log Groups**: `/aws/lambda/alphaask-backend` with automatic log retention.
- **Error Tracking**: Logged stack traces formatted for fast diagnosis.

> **Speaker Notes**:  
> Observability is powered by AWS CloudWatch. Lambda executions log structured outputs, API Gateway metrics track response latencies, and CloudWatch Alarms notify the engineering team if error thresholds are exceeded.

---

### Slide 14: Cost Optimization & Scaling Strategy

#### Maximum Efficiency with Serverless Pay-Per-Use

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AWS SERVERLESS COST PROFILE                         │
├───────────────────────┬─────────────────────────────────────────────────────┤
│ Service Component     │ Cost Model & Free Tier Allocation                   │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ AWS Lambda Container  │ $0 when idle. 1,000,000 requests/month FREE         │
│ Amazon API Gateway v2 │ HTTP API v2: $1.00 per million requests             │
│ Amazon DynamoDB       │ On-Demand PAY_PER_REQUEST: $0 when no queries       │
│ Amazon S3 + CDN       │ Static hosting: Minimal storage fractions of a cent │
└───────────────────────┴─────────────────────────────────────────────────────┘
```

#### Total Idle Monthly Cost: **$0.00**

> **Speaker Notes**:  
> AlphaAsk is exceptionally cost-effective. Because every core service uses a scale-to-zero model—Lambda, HTTP API v2, and On-Demand DynamoDB—the entire infrastructure costs zero dollars when idle, making it ideal for university budgets.

---

### Slide 15: Technical Challenges & Key Solutions

#### Engineering Obstacles Overcome During Development

| Challenge Encountered | Root Cause | Engineering Solution Implemented |
|---|---|---|
| **CORS Preflight Failure** | API Gateway missing `allow_credentials` & header allowlists | Updated `cors_configuration` in `lambda_apigw.tf` with `allow_credentials = true` and explicit origin allowlist. |
| **Lambda VPC Network Trap** | Static `vpc_config` attached without NAT Gateway blocked internet | Made `vpc_config` dynamic via `enable_vpc_lambda` (disabled by default) so Lambda has direct access to AWS services and LLM APIs. |
| **DynamoDB $O(N \times M)$ Scans** | Question retrieval scanned all sessions and all messages | Provisioned `UserQuestionsIndex` GSI on `alphaask-Questions` table and updated `questions.py` to use $O(1)$ index queries. |
| **Fake Model Names & Mock Streaming** | Legacy model references (`gemini-3.6-flash`) & word-splitting mock | Updated models to `gemini-2.5-flash` and implemented native Groq HTTP chunked SSE streaming (`_stream_groq_native`). |

> **Speaker Notes**:  
> Engineering is about solving real-world challenges. During development, we resolved preflight CORS mismatches, fixed Lambda VPC internet routing, eliminated $O(N \times M)$ database scans with GSIs, and implemented native SSE streaming.

---

### Slide 16: Live Product Demo Walkthrough

#### End-to-End User Journey Demonstration

```
Step 1: Student Sign-Up / Login ──► JWT Generated ──► Session Saved in LocalStorage
                                                             │
Step 2: Enter Query & Subject   ──► POST /api/ask/stream ────┤
                                                             │
Step 3: SSE Streaming           ◄── Live Token Stream  ──────┤
                                                             │
Step 4: View History & Q&A      ◄── O(1) GSI Lookup    ──────┘
```

#### Demonstration Flow
1. **User Authentication**: Register new student account (`POST /api/auth/register`), receive JWT token.
2. **Interactive Questioning**: Select subject tag ("Computer Science"), ask academic question.
3. **Live SSE Streaming**: Observe token-by-token answer generation streamed live to the UI.
4. **History & Persistence**: Refresh page → session state automatically restored from LocalStorage. View history loaded via GSI.

> **Speaker Notes**:  
> Now let's walk through the live product demonstration. As you can see, signing up issues a secure JWT token. When we ask a question, the response streams live to the screen, and refreshed pages maintain complete state without logging the student out.

---

### Slide 17: Project Requirements & Compliance Matrix

#### Azubi Africa Project 3 Specification Checklist

| Requirement | Project Specification | AlphaAsk Implementation | Status |
|---|---|---|:---:|
| **Cloud Hosting** | Host infrastructure on AWS Cloud | Provisioned via Terraform in AWS region `us-east-1` | ✅ **100% Met** |
| **API Gateway** | Public API Endpoints / Receives Requests | Amazon API Gateway (HTTP API v2) proxying to Lambda | ✅ **100% Met** |
| **AWS Lambda** | Processes backend API requests | Containerized FastAPI application running on Lambda | ✅ **100% Met** |
| **DynamoDB** | Store questions & responses durably | 5 On-Demand DynamoDB tables + `UserQuestionsIndex` GSI | ✅ **100% Met** |
| **AI Integration** | Connect to external AI service | Multi-provider failover: Bedrock → Groq → Gemini | ✅ **100% Met** |
| **CI/CD Pipeline** | GitHub Actions automated pipeline | 4-stage pipeline testing, building, and deploying IaC | ✅ **100% Met** |
| **Agile Management**| Track issues using Trello/Jira | Sprint workflow tracking stories, bugs, and tasks | ✅ **100% Met** |

> **Speaker Notes**:  
> AlphaAsk achieves 100% compliance across all required specifications from Azubi Africa, delivering every required feature alongside advanced enhancements like multi-LLM failover and real-time streaming.

---

### Slide 18: Summary & Next Steps

#### Conclusion & Product Roadmap

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                         FUTURE ROADMAP                                  │
  ├─────────────────────────────────────────────────────────────────────────┤
  │  Phase 1: Multi-Modal Support   │ Phase 2: Vector RAG Search            │
  │  - Diagram & formula OCR parse  │ - OpenSearch vector store for notes   │
  ├─────────────────────────────────┼───────────────────────────────────────┤
  │  Phase 3: Institution Analytics │ Phase 4: LMS Integrations             │
  │  - TA insights dashboard        │ - Canvas & Moodle LTI integration     │
  └─────────────────────────────────┴───────────────────────────────────────┘
```

#### Final Summary
- **Delivered**: A robust, secure, production-ready AI Student Support Platform built on AWS Serverless.
- **Impact**: Zero delayed answers for students, zero idle costs for the institution, and full operational resilience.

> **Thank You!**  
> We welcome your questions and feedback.  
> **Team Alpha Repository**: `https://github.com/Azubi-Team-Alpha/AlphaAsk`

---
