# AlphaAsk — Product Presentation Slide Deck
## AI-Powered Student Academic Support Platform (AWS Serverless Architecture)

> **Azubi Africa — Level 2 Project 3 Deliverable**  
> **Team**: Team Alpha  
> **Customer**: Educational Institution  
> **Date**: August 2026  
> **Repository**: [https://github.com/Azubi-Team-Alpha/AlphaAsk](https://github.com/Azubi-Team-Alpha/AlphaAsk)  

---

## 🎨 Presentation Design System & Theme Specifications

Follow the design tokens, color palettes, font pairings, and layout guidelines below when presenting in PowerPoint, Google Slides, Keynote, Canva, or Marp.

### 1. Curated Color Palettes

#### Primary Theme: Executive Dark Mode (AWS Midnight & Flame Amber) — **Recommended**
- **Canvas Background**: Deep Midnight `#0B0F17` (`rgb(11, 15, 23)`)
- **Card / Surface**: Slate Glass `#1E293B` (`rgb(30, 41, 59)`)
- **Primary Accent**: AWS Flame Amber `#F97316` (`rgb(249, 115, 22)`)
- **Secondary Accent**: Electric Cyan `#06B6D4` (`rgb(6, 182, 212)`)
- **Success / Valid**: Emerald Green `#10B981` (`rgb(16, 185, 129)`)
- **Text Primary**: Crisp White `#F8FAFC` (`rgb(248, 250, 252)`)
- **Text Secondary**: Muted Silver `#94A3B8` (`rgb(148, 163, 184)`)
- **Border / Divider**: Subtly Lit Border `#334155` (`rgb(51, 65, 85)`)

### 2. Typography & Font Pairings
- **Headers / Slide Titles**: **Outfit** or **Source Serif 4** (700 Bold, `36px - 44px`)
- **Body / Bullet Points**: **IBM Plex Sans** or **Inter** (400 Regular / 500 Medium, `18px - 22px`)
- **Code / JSON / CLI**: **IBM Plex Mono** or **JetBrains Mono** (`#0F172A` background, `#38BDF8` text)

---

## 📋 10-Slide Master Index

1. [Slide 1: Title, Executive Summary & Team Roles](#slide-1-title-executive-summary--team-roles)
2. [Slide 2: Problem Statement & Project Objectives](#slide-2-problem-statement--project-objectives)
3. [Slide 3: Solution Overview & Core Capabilities](#slide-3-solution-overview--core-capabilities)
4. [Slide 4: End-to-End Serverless AWS Architecture](#slide-4-end-to-end-serverless-aws-architecture)
5. [Slide 5: Multi-Provider AI Orchestration & Streaming](#slide-5-multi-provider-ai-orchestration--streaming)
6. [Slide 6: Data Architecture & $O(1)$ DynamoDB Optimization](#slide-6-data-architecture--o1-dynamodb-optimization)
7. [Slide 7: Infrastructure as Code & Automated CI/CD Pipeline](#slide-7-infrastructure-as-code--automated-cicd-pipeline)
8. [Slide 8: Security, IAM Compliance & CloudWatch Observability](#slide-8-security-iam-compliance--cloudwatch-observability)
9. [Slide 9: Key Technical Challenges & Engineering Solutions](#slide-9-key-technical-challenges--engineering-solutions)
10. [Slide 10: Specification Compliance & Project Conclusion](#slide-10-specification-compliance--project-conclusion)
11. [👉 Live Product & Console Demo Script (Post-Slide Walkthrough)](#-live-product--console-demo-script-post-slide-walkthrough)

---

### Slide 1: Title, Executive Summary & Team Roles

```
================================================================================
                                   ALPHAASK
              AI-Powered Student Academic Support Platform
================================================================================
                 Azubi Africa - Level 2 Project 3 Submission
                             Presented by Team Alpha
================================================================================
```

#### Executive Summary & Team Collaboration
- **Mission**: Deliver a 24/7 AI academic assistant to eliminate support queues for university students.
- **Architecture**: 100% Serverless on AWS (React 19 SPA + FastAPI container on AWS Lambda via API Gateway HTTP API v2).
- **Agile Execution**: Managed via **Trello Sprint Boards** tracking User Stories, Tech Debt, and QA Verification.
- **Team Roles**:
  - **DevOps Lead**: Infrastructure as Code (Terraform), GitHub Actions CI/CD pipeline, ECR & API Gateway.
  - **Backend Engineer**: FastAPI architecture, DynamoDB service layer, JWT security, and multi-provider LLM failover.
  - **Frontend / QA Engineer**: React 19 SPA, SSE streaming consumer, dark-mode CSS design system, unit test suites.

> 🎙️ **Speaker Notes**:  
> Good morning evaluators and stakeholders. Team Alpha presents AlphaAsk—an enterprise-grade, cloud-native serverless AI platform engineered to solve academic support bottlenecks for educational institutions. We managed our project using Trello agile boards across sprints, dividing roles between DevOps, Backend, and Frontend engineering to deliver a production-ready application.

---

### Slide 2: Problem Statement & Project Objectives

#### The Academic Support Bottleneck
- **Inquiry Surges**: Support staff are swamped with thousands of repetitive questions during midterms and finals.
- **Delayed Student Help**: TAs and Tutors take 24–72 hours to respond via email queues or office hours.
- **Strained Manual Resources**: Staff spend >60% of their time answering basic recurring questions.
- **No Centralized Data**: Institutions lack automated tracking of common student learning gaps.

#### Core Project Objectives
1. **Automate Query Resolution**: Instant AI-generated academic answers across Math, Science, Writing, Code, and History.
2. **Durable Persistence**: Store all user sessions, messages, and questions in Amazon DynamoDB.
3. **Automated CI/CD**: 100% automated build, test, and deployment via GitHub Actions & Terraform.
4. **Zero Idle Overhead**: Fully serverless AWS execution with zero idle compute costs.

> 🎙️ **Speaker Notes**:  
> Educational institutions face severe operational strain during exam periods. Students wait days for answers, hurting their learning velocity. AlphaAsk addresses this by providing instant 24/7 answers while maintaining zero infrastructure cost when idle.

---

### Slide 3: Solution Overview & Core Capabilities

#### AlphaAsk: Intelligent, Serverless, Always-On Academic Assistance

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                         ALPHAASK SOLUTION                               │
  ├─────────────────────────────────────────────────────────────────────────┤
  │  1. Instant Multi-LLM AI       │ 2. High-Availability Serverless AWS     │
  │     - Bedrock + Groq + Gemini  │    - AWS Lambda + API Gateway v2        │
  │     - Zero single-point-of-fail│    - Zero idle compute cost             │
  ├────────────────────────────────┼────────────────────────────────────────┤
  │  3. Real-Time Token Streaming  │ 4. Automated CI/CD & Security           │
  │     - Server-Sent Events (SSE) │    - GitHub Actions + Terraform        │
  │     - Natural typing animation │    - Least-privilege IAM policies       │
  └────────────────────────────────┴────────────────────────────────────────┘
```

#### Key Product Features
- **Real-Time Token Streaming**: Word-by-word streaming using Server-Sent Events (`/api/ask/stream`).
- **Subject-Aware Guidance**: Tailored academic prompts for Math, Science, Writing, Code, History, and Study Skills.
- **Session History & Memory**: Automatic persistence and retrieval of prior student chats.
- **Fail-Safe Rate Limiting**: ElastiCache Redis token bucket protecting endpoints against abuse.

> 🎙️ **Speaker Notes**:  
> AlphaAsk combines serverless compute with real-time SSE token streaming. Students experience instant, word-by-word AI answers, while our multi-provider fallback engine guarantees uninterrupted uptime even if an underlying LLM service experiences a rate limit.

---

### Slide 4: End-to-End Serverless AWS Architecture

![AlphaAsk Official AWS Serverless Architecture Diagram](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/docs/alphaask_official_aws_architecture_diagram.png)

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

#### Decoupled Serverless Layer Breakdown
- **Frontend**: React 19 SPA hosted on Amazon S3 with CloudFront CDN distribution.
- **API Gateway (HTTP API v2)**: Edge CORS handling and low-latency route proxying (`ANY /{proxy+}`).
- **AWS Lambda Compute**: Docker container image (`alphaask-backend:latest`) running FastAPI via `Mangum`.
- **Data & Cache**: 5 DynamoDB On-Demand tables + Amazon ElastiCache for Redis cluster.

> 🎙️ **Speaker Notes**:  
> Here is our complete AWS architecture. The client browser hits API Gateway, which proxies to our containerized FastAPI Lambda function. Data is persisted in DynamoDB and cached in ElastiCache Redis, while AI inference cascades across Bedrock, Groq, and Gemini.

---

### Slide 5: Multi-Provider AI Orchestration & Streaming

#### Failover Cascade Architecture
To eliminate single-provider outages and rate limits, AlphaAsk uses a 3-tier cascade:

```
           ┌────────────────────────────────────────────────────────┐
           │                  User Query Submission                 │
           └───────────────────────────┬────────────────────────────┘
                                       │
                                       ▼
           ┌────────────────────────────────────────────────────────┐
           │ PRIMARY: AWS Bedrock (Claude 3.5 Sonnet)              │
           └───────────────────────────┬────────────────────────────┘
                                       │ (On Failure / Limit)
                                       ▼
           ┌────────────────────────────────────────────────────────┐
           │ FALLBACK 1: Groq Cloud (Llama 3.3 70B Native SSE)       │
           └───────────────────────────┬────────────────────────────┘
                                       │ (On Failure / Limit)
                                       ▼
           ┌────────────────────────────────────────────────────────┐
           │ FALLBACK 2: Google Gemini (2.5 / 2.0 / 1.5 Flash)      │
           └────────────────────────────────────────────────────────┘
```

#### Real-Time SSE Token Streaming
- **Endpoint**: `POST /api/ask/stream`
- **Mechanism**: Streams chunks formatted as `data: {"content": "..."}\n\n` directly to client `ReadableStream`.
- **User Benefit**: Eliminates long wait times—students see answers begin rendering within milliseconds.

> 🎙️ **Speaker Notes**:  
> AI reliability is paramount. If AWS Bedrock reaches a quota, our engine seamlessly falls back to Groq Llama 3.3 70B with native chunked streaming, and then to Google Gemini. The student experiences unbroken streaming regardless of provider status.

---

### Slide 6: Data Architecture & $O(1)$ DynamoDB Optimization

#### DynamoDB Table Matrix & Schema Design

| Table Name | Partition Key | Sort Key / GSI | Function |
|---|---|---|---|
| `alphaask-Users` | `user_id` (S) | `EmailIndex` (`email`) | Student authentication & profiles |
| `alphaask-Sessions` | `session_id` (S) | `UserSessionsIndex` (`user_id`) | Conversation thread tracking |
| `alphaask-Messages` | `message_id` (S) | `SessionMessagesIndex` (`session_id`) | Chronological chat history |
| `alphaask-Questions` | `id` (S) | `UserQuestionsIndex` (`user_id`) | Fast question history lookups |
| `alphaask-FAQ` | `faq_id` (S) | N/A | Centralized institutional FAQs |

#### Performance Engineering: $O(1)$ GSI Indexing
- **The Problem**: Scanning session messages to build user question lists caused expensive $O(N \times M)$ table scans.
- **The Optimization**: Created `UserQuestionsIndex` GSI on `alphaask-Questions`. Question records are written on answer creation, allowing questions to be retrieved via direct $O(1)$ GSI query.
- **Rate Limiting**: ElastiCache Redis sliding-window token bucket (max 10 requests/min per user) with graceful fail-open resilience.

> 🎙️ **Speaker Notes**:  
> We optimized our database layer from expensive $O(N \times M)$ table scans to $O(1)$ GSI queries by indexing `alphaask-Questions` on `user_id`. Redis protects our API from rate limit abuse with fail-open fallback.

---

### Slide 7: Infrastructure as Code & Automated CI/CD Pipeline

#### 100% Automated Declarative Infrastructure (Terraform)
- **Modules**: `ecr.tf`, `dynamodb.tf`, `elasticache.tf`, `iam.tf`, `lambda_apigw.tf`, `s3_cloudfront.tf`.
- **Zero Drift**: All AWS resources are created, updated, and managed declaratively.

#### 4-Stage GitHub Actions Pipeline (`.github/workflows/deploy.yml`)

```
 ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
 │ STAGE 1:        │     │ STAGE 2:        │     │ STAGE 3:        │     │ STAGE 4:        │
 │ Test & Validate │ ──► │ Provision ECR   │ ──► │ Build & Push    │ ──► │ Deploy Infra    │
 │ (Pytest+Vitest) │     │ (Repo Check)    │     │ (Docker Image)  │     │ (Terraform+S3)  │
 └─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

#### Dynamic API Gateway Injection
- Stage 4 extracts `API_URL=$(terraform output -raw api_gateway_url)` after `terraform apply`.
- Compiles React SPA with `VITE_API_BASE_URL="$API_URL" npm run build` and syncs `dist/` to S3.
- **Result**: Destroying and recreating infrastructure automatically reconnects the frontend to the new API Gateway URL without manual code changes.

> 🎙️ **Speaker Notes**:  
> Our CI/CD pipeline automates everything. When we push code, Stage 1 tests, Stage 2 verifies ECR, Stage 3 builds the Docker container, and Stage 4 runs `terraform apply` while dynamically injecting the new API Gateway URL into the frontend build.

---

### Slide 8: Security, IAM Compliance & CloudWatch Observability

#### Enterprise Security & IAM Hardening
- **Least Privilege IAM**: Policies restricted strictly to `alphaask-*` DynamoDB table ARNs and Bedrock model ARNs.
- **Password & Token Security**: Passwords hashed with `bcrypt` (12 rounds). JWTs signed with HS256 algorithm.
- **Startup Validator**: Pydantic validator in `config.py` enforces strong $\ge 32$-character JWT secrets with safe default fallbacks.
- **Edge CORS**: API Gateway manages preflight `OPTIONS` requests natively at the edge, returning `200 OK` with single CORS headers.

#### CloudWatch Monitoring & Observability
- **Log Streams**: `/aws/lambda/alphaask-backend` logs container startup, execution, and FastAPI requests.
- **Gateway Metrics**: API Gateway access logs monitor latency, request counts, and HTTP status codes.
- **Alarms**: CloudWatch Alarms notify on Lambda error spikes and 5xx response thresholds.

> 🎙️ **Speaker Notes**:  
> Security and observability are built-in. We enforce least privilege IAM, bcrypt hashing, edge CORS at API Gateway, and CloudWatch alarms for real-time monitoring and log extraction.

---

### Slide 9: Key Technical Challenges & Engineering Solutions

| Challenge | Root Cause | Engineering Solution |
|---|---|---|
| **CORS Preflight Failure & 405 Errors** | Disabling API Gateway CORS caused 405s; enabling both caused duplicate headers | Managed 100% CORS at API Gateway (`lambda_apigw.tf`) and added `CORSMiddleware` with `allow_origin_regex` to FastAPI |
| **Lambda VPC Network Trap** | Lambda attached to subnets without NAT Gateway lost internet/AWS access | Introduced dynamic `enable_vpc_lambda` variable (default `false`) so Lambda operates with direct internet access |
| **Reversed Chat History Order** | DynamoDB query returned unordered messages | Updated `get_session_messages()` to sort by timestamp ASC with role priority (`user`=0, `assistant`=1) |
| **Startup Import Crash on JWT Key** | Validator checked `len < 32` before checking empty string during container init | Re-ordered validator in `config.py` to return fallback default `"alphaask-super-secret-jwt-key..."` |

> 🎙️ **Speaker Notes**:  
> Every complex project encounters challenges. We resolved CORS duplicate header collisions, fixed the Lambda VPC network trap, resolved reversed chat history ordering, and made our container initialization completely bulletproof.

---

### Slide 10: Specification Compliance & Project Conclusion

#### Azubi Africa Project Specification Compliance Matrix

| Requirement | Project Specification | Implementation | Status |
|---|---|---|:---:|
| **AWS Cloud** | Host infrastructure on AWS Cloud | Provisioned via Terraform in `us-east-1` | ✅ **100% Met** |
| **API Gateway** | Public API Endpoints / Proxy Requests | Amazon API Gateway (HTTP API v2) | ✅ **100% Met** |
| **AWS Lambda** | Process backend requests | Docker container image on Lambda | ✅ **100% Met** |
| **DynamoDB** | Store questions & responses durably | 5 On-Demand DynamoDB tables + GSI | ✅ **100% Met** |
| **AI Integration** | Connect to external AI service | Bedrock -> Groq -> Gemini failover cascade | ✅ **100% Met** |
| **CI/CD Pipeline** | GitHub Actions automated workflow | 4-Stage automated pipeline | ✅ **100% Met** |
| **Agile Management**| Track issues using Trello/Jira | Sprint workflow tracking stories & bugs | ✅ **100% Met** |

#### Summary
AlphaAsk delivers a high-performance, cost-optimized AI Academic Support platform that eliminates support queues, guarantees 24/7 availability, and scales to zero when idle.

> 🎙️ **Speaker Notes**:  
> In conclusion, AlphaAsk meets 100% of the Azubi Africa Level 2 Project 3 specifications. We now transition to our Live Product, CI/CD, and AWS Console Demonstration.

---

## 👉 Live Product & Console Demo Script (Post-Slide Walkthrough)

After concluding Slide 10, conduct the live demonstration following this 3-part verification script:

### Part 1: Live AlphaAsk Application Demonstration
1. **Open Live App**: Navigate to `https://alphaask.alphateam.live` (or S3 website URL).
2. **User Authentication**: Demonstrate student registration and login (showing JWT token stored in browser `localStorage`).
3. **Academic Q&A & Real-Time SSE Streaming**:
   - Select a subject pill (e.g. `Science` or `Code`).
   - Submit an academic question: *"Explain how AWS Lambda scales automatically."*
   - Point out the **word-by-word real-time SSE typing animation**.
4. **Session History & Message Ordering**:
   - Click to start a new chat session.
   - Click back on the previous chat session in the sidebar.
   - Verify that the **User Question appears at the top** and the **AI Answer appears directly underneath**.

### Part 2: GitHub Actions CI/CD Pipeline Verification
1. **Open GitHub Repository**: Navigate to `https://github.com/Azubi-Team-Alpha/AlphaAsk/actions`.
2. **Review Execution Log**:
   - Show Stage 1: Pytest backend tests & Vitest frontend tests.
   - Show Stage 2: Amazon ECR repository verification.
   - Show Stage 3: Docker container image build & push.
   - Show Stage 4: `terraform apply` & dynamic `VITE_API_BASE_URL` injection to S3.

### Part 3: AWS Management Console Verification
1. **Amazon API Gateway Console**: Show `alphaask-api` HTTP API v2, `ANY /{proxy+}` route, and edge CORS configuration.
2. **AWS Lambda Console**: Show function `alphaask-backend`, ECR container package type, 512 MB memory, 30s timeout, and environment variables.
3. **Amazon DynamoDB Console**: Show the 5 active tables (`alphaask-Users`, `Sessions`, `Messages`, `Questions`, `FAQ`) and the `UserQuestionsIndex` GSI on `alphaask-Questions`.
4. **Amazon ECR Console**: Show repository `alphaask-backend` and uploaded `latest` container image digest.
