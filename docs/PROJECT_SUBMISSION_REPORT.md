# AlphaAsk: AI-Powered Student Support System
## Official Project Submission & Technical Report

**Course**: Azubi Africa AWS Cloud & AI Engineering  
**Level / Project**: Level 2 — Project 3: AI-Powered Student Support System  
**Team**: Team Alpha  
**Customer**: Educational Institution  
**Date**: August 2026  
**Repository**: [https://github.com/Azubi-Team-Alpha/AlphaAsk](https://github.com/Azubi-Team-Alpha/AlphaAsk)  

---

## 1. Executive Summary

Educational institutions face an escalating volume of student academic queries during peak periods such as midterms and final exams. Traditional manual support channels—such as email queues and in-person teaching assistant office hours—suffer from severe backlogs, causing long delays for students seeking critical academic assistance.

To solve this challenge, **Team Alpha** engineered **AlphaAsk**, a cloud-native, fully serverless AI academic support platform built on Amazon Web Services (AWS). AlphaAsk provides university students with immediate, 24/7 academic support through natural language Q&A and real-time response streaming.

### Key Highlights & Technical Accomplishments
- **Serverless AWS Compute**: Containerized FastAPI Python 3.12 application deployed to AWS Lambda via Amazon API Gateway (HTTP API v2).
- **Multi-Provider AI Orchestration**: Multi-tier failover engine incorporating **AWS Bedrock (Claude 3.5 Sonnet)**, **Groq Cloud (Llama 3.3 70B)** with native chunked streaming, and **Google Gemini (2.5/2.0/1.5 Flash)**.
- **Optimized Data Layer**: 5 Amazon DynamoDB On-Demand NoSQL tables with $O(1)$ Global Secondary Indexing (`UserQuestionsIndex`).
- **Distributed Caching & Rate Limiting**: Amazon ElastiCache for Redis backing a sliding-window rate limiter with graceful fail-open resilience.
- **Declarative Infrastructure**: 100% automated infrastructure provisioning via Terraform (`infra/terraform/`).
- **Automated CI/CD Pipeline**: 4-Stage GitHub Actions pipeline (`.github/workflows/deploy.yml`) executing unit testing, ECR container packaging, Terraform deployment, and S3 static frontend deployment.

---

## 2. Customer Problem Statement & Objectives

### Problem Statement
An educational institution is overwhelmed by a high volume of student academic queries, leading to delayed response times and strained manual support resources. They currently lack an automated system to provide immediate answers or a centralized database to track frequently asked questions.

### Project Objectives
1. **Automate Query Resolution**: Build a cloud-based API allowing students to ask academic questions and receive instant AI-generated answers.
2. **Durable Persistence**: Durably store all user sessions, messages, questions, and responses in Amazon DynamoDB.
3. **Automated CI/CD Pipeline**: Streamline updates and deployments via a GitHub Actions pipeline.
4. **Agile Management**: Track tasks, user stories, and bug resolution using project management tools (Trello/Jira).
5. **Cost & Operational Efficiency**: Utilize serverless cloud services to ensure zero idle costs.

---

## 3. Team Organization & Agile Methodology

### Roles & Responsibilities
- **DevOps Lead**: Infrastructure as Code (Terraform), GitHub Actions CI/CD pipeline, API Gateway, IAM security policies, and ECR management.
- **Backend Engineer**: FastAPI application architecture, DynamoDB data service, JWT authentication, and multi-provider LLM failover engine.
- **Frontend / QA Engineer**: React 19 SPA development, SSE streaming consumer, responsive UI styling, unit test suites (Pytest and Vitest).

### Sprint Execution & Workflow
- **Backlog Management**: Trello/Jira boards organized into Sprints tracking User Stories, Tech Debt, and QA Verification.
- **Branching Strategy**: Git Flow methodology with `main` (production), `dev` (integration), and `feat/*` (feature branches).

---

## 4. System Architecture

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

### Component Breakdown
1. **Frontend Tier**: React 19 Single Page Application hosted on Amazon S3 with CloudFront CDN distribution.
2. **API & Ingress Tier**: Amazon API Gateway (HTTP API v2) handling route proxying (`ANY /{proxy+}`).
3. **Compute Tier**: AWS Lambda executing a Docker container image packaging FastAPI via `Mangum`.
4. **Data & Storage Tier**: 5 Amazon DynamoDB On-Demand tables (`Users`, `Sessions`, `Messages`, `Questions`, `FAQ`).
5. **Caching Tier**: Amazon ElastiCache for Redis providing rate-limiting protection.
6. **AI Tier**: Multi-provider LLM failover engine.

---

## 5. Technology Stack & Decoupled Microservices

- **Frontend**: React 19, TypeScript, Vite, Lucide Icons, Modern CSS Design System.
- **Backend API**: Python 3.12, FastAPI, Uvicorn, Mangum (ASGI Adapter).
- **AI Orchestration**: AWS Bedrock, Groq Cloud API, Google Gemini API.
- **Database**: Amazon DynamoDB (5 tables + `UserQuestionsIndex` GSI).
- **Caching**: Amazon ElastiCache for Redis.
- **IaC**: Terraform (`>= 1.5.0`, AWS Provider `~> 5.0`).
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`).

---

## 6. API Reference & Request Contracts

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

## 7. Multi-Provider AI Failover & Real-Time Streaming Engine

### Failover Cascade Architecture
To prevent single-point-of-failure risks associated with third-party LLM rate limits or service outages, AlphaAsk implements a multi-provider fallback engine:

1. **Primary Provider**: **AWS Bedrock** (`us.anthropic.claude-3-5-sonnet-20241022-v2:0`) via `boto3`.
2. **First Fallback**: **Groq Cloud API** (`llama-3.3-70b-versatile`) with native HTTP chunked SSE streaming (`_stream_groq_native`).
3. **Second Fallback**: **Google Gemini API** (`gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash`).

### Real-Time SSE Streaming
The `/api/ask/stream` endpoint utilizes Server-Sent Events (SSE). As tokens arrive from the underlying AI provider, they are formatted as `data: {"content": "..."}\n\n` and streamed to the client's `ReadableStream` consumer, creating a natural typing animation.

---

## 8. Data Architecture & DynamoDB Optimization

### DynamoDB Table Schema Matrix

| Table Name | Partition Key | Sort Key / GSI | Key Attributes |
|---|---|---|---|
| `alphaask-Users` | `user_id` (S) | `EmailIndex` (`email`) | `email`, `hashed_password`, `name`, `created_at` |
| `alphaask-Sessions` | `session_id` (S) | `UserSessionsIndex` (`user_id`) | `user_id`, `created_at` |
| `alphaask-Messages` | `message_id` (S) | `SessionMessagesIndex` (`session_id`) | `session_id`, `role`, `content`, `created_at` |
| `alphaask-Questions` | `id` (S) | `UserQuestionsIndex` (`user_id`) | `user_id`, `session_id`, `question`, `answer`, `created_at` |
| `alphaask-FAQ` | `faq_id` (S) | N/A | `question`, `answer`, `category`, `created_at` |

### Database Optimization: $O(1)$ GSI Indexing
- **Previous Pattern**: Scanning all user sessions and reading every session message—an expensive $O(N \times M)$ scan.
- **Implemented Optimization**: Added `UserQuestionsIndex` GSI to `alphaask-Questions`. When an answer is generated, a `QuestionRecord` is written to `alphaask-Questions`. Listing user questions now executes as a direct $O(1)$ GSI query.

---

## 9. Caching & Rate Limiting (ElastiCache Redis)

- **Algorithm**: Sliding window token bucket implemented via Redis `ZREMRANGEBYSCORE`, `ZADD`, `ZCARD`, and `EXPIRE` pipeline calls.
- **Quota**: Max 10 requests per minute per user.
- **Fail-Open Resilience**: If Redis is un-provisioned or unreachable, the system catches the connection warning and allows requests through without crashing.

---

## 10. Infrastructure as Code (Terraform)

All AWS resources are declaratively defined in `infra/terraform/`:
- `ecr.tf`: ECR repository for Lambda Docker container images.
- `dynamodb.tf`: 5 DynamoDB tables + `UserQuestionsIndex` GSI.
- `elasticache.tf`: ElastiCache Redis cluster and security group.
- `iam.tf`: IAM execution role with least-privilege policies.
- `lambda_apigw.tf`: Lambda container function, security group, and API Gateway HTTP API v2.
- `s3_cloudfront.tf`: S3 static website bucket & CloudFront distribution.

---

## 11. Automated CI/CD Pipeline (GitHub Actions)

Defined in `.github/workflows/deploy.yml`:
1. **Stage 1: Test & Validate**: Runs Pytest backend test suite, Vitest frontend suite, and `terraform validate`.
2. **Stage 2: Provision ECR**: Ensures Amazon ECR repository exists.
3. **Stage 3: Docker Build & Push**: Builds backend container image and pushes `latest` tag to ECR.
4. **Stage 4: Deploy Infrastructure & Code**: Runs `terraform apply` for AWS resources and syncs static assets to S3.

---

## 12. Security, IAM & Least Privilege

- **Least Privilege IAM**: Policy strictly scopes permissions to `alphaask-*` table ARNs and Bedrock models.
- **JWT & Password Security**: Passwords hashed with `bcrypt` (12 rounds). Tokens validated via `python-jose`.
- **JWT Secret Validator**: Pydantic startup validator enforces strong $\ge 32$ character JWT secrets.
- **CORS Hardening**: API Gateway `cors_configuration` uses explicit domain allowlists and `allow_credentials = true`.

---

## 13. Observability & CloudWatch Monitoring

- **AWS CloudWatch Logs**: Captures Lambda container execution output and FastAPI access logs.
- **API Gateway Access Logs**: Tracks API request counts, latencies, and 4xx/5xx status codes.
- **CloudWatch Alarms**: Configured to alert on Lambda execution errors and 5xx error spikes.

---

## 14. Cost & Lifecycle Optimization

- **Zero Idle Cost**: AWS Lambda, API Gateway HTTP API v2, and DynamoDB On-Demand scale to zero when idle.
- **Free Tier Eligibility**: 1,000,000 free Lambda requests/month and 25 GB free DynamoDB storage.

---

## 15. Technical Challenges & Solutions Log

| Challenge | Root Cause | Implemented Solution |
|---|---|---|
| **CORS Preflight Failure** | Missing `allow_credentials` in API Gateway CORS | Updated `lambda_apigw.tf` with `allow_credentials = true` and explicit header allowlist. |
| **Lambda VPC Network Trap** | Lambda inside VPC without NAT Gateway lost internet | Made `vpc_config` dynamic via `enable_vpc_lambda` (disabled by default) so Lambda has direct internet/AWS service access. |
| **DynamoDB $O(N \times M)$ Scans** | Question retrieval scanned all session messages | Added `UserQuestionsIndex` GSI to `alphaask-Questions` table for $O(1)$ query performance. |
| **Outdated Model References** | Legacy references to non-existent Gemini models | Updated models to `gemini-2.5-flash` and implemented native Groq chunked SSE streaming (`_stream_groq_native`). |

---

## 16. Azubi Africa Specification Compliance Matrix

| Requirement | Project Specification | Implementation | Compliance |
|---|---|---|:---:|
| **AWS Cloud** | Host infrastructure on AWS Cloud | Provisioned via Terraform in `us-east-1` | ✅ **100% Met** |
| **API Gateway** | Public API Endpoints / Receives Requests | Amazon API Gateway (HTTP API v2) | ✅ **100% Met** |
| **AWS Lambda** | Process backend requests | Docker container image on Lambda | ✅ **100% Met** |
| **DynamoDB** | Store questions & responses durably | 5 On-Demand DynamoDB tables + GSI | ✅ **100% Met** |
| **AI Integration** | Connect to external AI service | Bedrock → Groq → Gemini failover cascade | ✅ **100% Met** |
| **CI/CD Pipeline** | GitHub Actions automated workflow | 4-Stage automated pipeline | ✅ **100% Met** |
| **Agile Management**| Track issues using Trello/Jira | Sprint workflow tracking stories & bugs | ✅ **100% Met** |

---

## 17. Conclusion

AlphaAsk successfully delivers a modern, serverless AI Student Support Platform that solves the educational institution's support backlog challenge. Through containerized AWS Lambda functions, multi-provider AI failover, DynamoDB GSI optimizations, Terraform automation, and GitHub Actions CI/CD, the platform guarantees high availability, rapid response streaming, and zero idle infrastructure costs.
