# AlphaAsk — Full Local Setup, Testing & Terraform Deployment Guide

This document provides complete, step-by-step instructions to run the **FastAPI backend** and **React frontend** locally, execute all **automated test suites** (Pytest + Vitest), and provision the complete **AWS serverless infrastructure** via Terraform.

---

## 1. Architecture Overview

```
[ Student Browser ]
        │
        ▼ HTTPS
[ Cloudflare DNS & WAF ] — alphaask.alphateam.live — edge security
        │
        ▼ HTTPS
[ Amazon CloudFront CDN ] ──────────────────────► [ S3 Static Bucket ]
        │                                          (React 19 SPA assets)
        ▼ HTTPS
[ Amazon API Gateway HTTP API v2 ]
        │ ANY /{proxy+}
        ▼
[ AWS Lambda — FastAPI (python:3.11-slim + AWS Lambda Adapter) ]
   (Container image from Amazon ECR)
        │               │               │
        ▼               ▼               ▼
[ DynamoDB ]     [ ElastiCache ]  [ 4-LLM Engine ]
 5 Tables          Redis              OpenRouter (1st)
 On-Demand         10 req/min         Groq (2nd, SSE)
 PAY_PER_REQUEST   rate limit         Gemini (3rd)
                                      Bedrock (4th)
```

---

## 2. Prerequisites

Ensure the following are installed and configured on your local machine:

| Tool | Version | Purpose |
|---|---|---|
| **Python** | 3.11+ | Backend FastAPI server |
| **Node.js** | 20+ | Frontend Vite dev server |
| **npm** | 10+ | Frontend package manager |
| **AWS CLI** | Latest | ECR login, Terraform AWS auth |
| **Terraform** | v1.5+ | Infrastructure provisioning |
| **Docker Engine** | Latest | Container image build & push |

### AWS IAM Permissions Required
The AWS user/role must have policies for:
`AmazonDynamoDBFullAccess`, `AmazonElastiCacheFullAccess`, `AmazonECR_FullAccess`, `AWSLambda_FullAccess`, `AmazonAPIGatewayAdministrator`, `AmazonBedrockFullAccess`, `AmazonS3FullAccess`, `CloudFrontFullAccess`, `IAMFullAccess`, `CloudWatchLogsFullAccess`

---

## 3. Backend Environment Variables

Create `backend/.env` with the following:

```env
# AWS Core
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# JWT Auth (must be 32+ characters)
JWT_SECRET_KEY=your-secure-jwt-secret-key-minimum-32-chars

# AI Provider API Keys
OPENROUTER_API_KEY=your_openrouter_key        # Primary provider (400+ models)
GROQ_API_KEY=your_groq_key                    # 2nd provider (Llama-3.3 70B SSE)
GEMINI_API_KEY=your_gemini_key                # 3rd provider (Gemini Flash 2.5)

# AWS Bedrock (uses IAM credentials above — no extra key needed)
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0

# OpenRouter default model (discipline routing overrides this per-subject)
OPENROUTER_MODEL_ID=openai/gpt-4o-mini

# Redis (ElastiCache or local)
REDIS_URL=redis://localhost:6379

# Rate limiting
RATE_LIMIT_PER_MINUTE=10

# DynamoDB table names (must match Terraform variables)
USERS_TABLE=alphaask-Users
SESSIONS_TABLE=alphaask-Sessions
MESSAGES_TABLE=alphaask-Messages
QUESTIONS_TABLE=alphaask-Questions
FAQ_TABLE=alphaask-FAQ
```

---

## 4. Local Development Setup

### 4.1 Backend — FastAPI

```bash
cd backend

# Create & activate virtual environment
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt

# Start FastAPI dev server (hot-reload enabled)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

FastAPI interactive API docs available at: **http://localhost:8000/docs**  
Alternative Redoc docs at: **http://localhost:8000/redoc**

#### Python Dependencies (from `requirements.txt`)
| Package | Version | Purpose |
|---|---|---|
| `fastapi` | 0.115.0 | ASGI web framework |
| `uvicorn[standard]` | 0.32.0 | ASGI server |
| `pydantic` | 2.9.2 | Data validation & settings |
| `pydantic-settings` | 2.5.2 | `.env` config loading |
| `python-jose[cryptography]` | 3.3.0 | JWT encode/decode |
| `passlib[bcrypt]` | 1.7.4 | Password hashing |
| `bcrypt` | 4.1.2 | Bcrypt backend |
| `python-multipart` | 0.0.12 | File upload handling |
| `redis` | 5.1.1 | ElastiCache rate-limit client |
| `boto3` | 1.35.36 | DynamoDB + Bedrock SDK |
| `python-dotenv` | 1.0.1 | `.env` file loading |
| `pytest` | 8.3.3 | Test runner |
| `pytest-asyncio` | 0.24.0 | Async test support |
| `httpx` | 0.27.2 | HTTP test client for FastAPI |
| `email-validator` | 2.3.0 | Email validation |
| `pypdf` | 6.14.2 | PDF text extraction |

> **Note**: `mangum` is NOT in `requirements.txt` — it is pre-installed in the Dockerfile via the AWS Lambda Adapter layer (`public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4`).

### 4.2 Frontend — React 19 + Vite

```bash
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```

Frontend available at: **http://localhost:5173**

The Vite dev server automatically proxies `/api/*` requests to `http://localhost:8000` (configured in `vite.config.ts`). No CORS issues during local development.

#### Frontend Environment (optional override)
Create `frontend/.env.local` to point at a deployed backend:
```env
VITE_API_BASE_URL=https://your-api-gateway-url.amazonaws.com
```

Leave unset to use the Vite proxy (local backend at `localhost:8000`).

---

## 5. Automated Test Suites

### 5.1 Backend — Pytest (13 Tests)

```bash
cd backend
source .venv/bin/activate

# Run full test suite
pytest

# Verbose output with test names
pytest -v

# Run a specific test module
pytest tests/test_ask.py -v
```

**Expected Result:**
```
========================= 13 passed in X.XXs ==========================
```

#### Test Modules
| File | Tests | Coverage |
|---|---|---|
| `tests/test_api.py` | Health check & sessions routes | `GET /health`, `POST /sessions` |
| `tests/test_ask.py` | Q&A endpoints | `POST /ask`, `POST /ask/stream` (sync + SSE) |
| `tests/test_history.py` | Conversation history | `GET /conversations`, `GET /history/{session_id}` |
| `tests/test_signup.py` | Authentication | `POST /auth/register`, `POST /auth/login` |

### 5.2 Frontend — Vitest (6 Tests)

```bash
cd frontend

# Run test suite once
npm test

# Watch mode (re-runs on file changes)
npm run test:watch
```

**Expected Result:**
```
 ✓ 6 tests pass
```

### 5.3 Frontend Production Build Validation

```bash
cd frontend
npm run build
```

**Expected Result:**
```
✓ built in ~1.3s
dist/ ready for S3 deployment
```

---

## 6. Provision AWS Infrastructure via Terraform

### Step 6.1: Configure AWS Credentials

```bash
aws configure
# AWS Access Key ID: [your key]
# AWS Secret Access Key: [your secret]
# Default region name: us-east-1
# Default output format: json
```

### Step 6.2: Initialize Terraform

```bash
cd infra/terraform
terraform init
```

### Step 6.3: Provision ECR Repository First

ECR must exist before Lambda can be created (Lambda requires an ECR image URI):

```bash
terraform apply -auto-approve -target=aws_ecr_repository.backend
```

### Step 6.4: Build & Push Backend Container to ECR

The Dockerfile uses `python:3.11-slim` + `aws-lambda-adapter:0.8.4` + `uvicorn` — **no Mangum required** (the Lambda Adapter handles routing natively):

```bash
# Authenticate Docker with ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

cd backend

# Build for Lambda's linux/amd64 architecture
# --provenance=false prevents multi-platform manifest issues in ECR
docker build --platform linux/amd64 --provenance=false -t alphaask-backend .

# Tag for ECR
docker tag alphaask-backend:latest \
  <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/alphaask-backend:latest

# Push to ECR
docker push \
  <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/alphaask-backend:latest
```

### Step 6.5: Deploy Complete AWS Infrastructure

```bash
cd infra/terraform
terraform apply -auto-approve
```

This provisions all resources:

| Terraform File | Resources Created |
|---|---|
| `ecr.tf` | ECR repository `alphaask-backend` |
| `dynamodb.tf` | 5 DynamoDB tables with GSIs (see below) |
| `elasticache.tf` | ElastiCache Redis cluster + subnet group |
| `lambda_apigw.tf` | Lambda function (container) + API Gateway HTTP v2 |
| `s3_cloudfront.tf` | S3 static bucket + CloudFront distribution |
| `iam.tf` | Lambda execution role + DynamoDB/Bedrock/ECR/Logs policies |

### Step 6.6: Review Terraform Outputs

```bash
terraform output
```

| Output Key | Description |
|---|---|
| `api_gateway_url` | API Gateway invoke URL for backend (set as `VITE_API_BASE_URL`) |
| `ecr_repository_url` | ECR registry URL for Docker push |
| `frontend_s3_bucket` | S3 bucket name for frontend asset deployment |
| `frontend_s3_website_url` | S3 static website URL |
| `cloudfront_domain_name` | CloudFront CDN URL (or `CloudFront Disabled` if toggled off) |
| `dynamodb_users_table` | `alphaask-Users` table name |
| `elasticache_redis_endpoint` | Redis primary node endpoint |
| `cloudflare_cname_target` | CNAME value to enter in Cloudflare DNS |

### Step 6.7: Deploy Frontend to S3

```bash
cd frontend

# Build with API Gateway URL injected
VITE_API_BASE_URL=$(cd ../infra/terraform && terraform output -raw api_gateway_url) npm run build

# Sync built assets to S3
aws s3 sync dist/ s3://$(cd ../infra/terraform && terraform output -raw frontend_s3_bucket) --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <CLOUDFRONT_DIST_ID> \
  --paths "/*"
```

### Step 6.8: Configure Lambda Environment Variables

After Terraform apply, set AI provider keys in the Lambda function:

```bash
aws lambda update-function-configuration \
  --function-name alphaask-backend \
  --environment "Variables={
    JWT_SECRET_KEY=your-strong-secret-min-32-chars,
    OPENROUTER_API_KEY=your_openrouter_key,
    GROQ_API_KEY=your_groq_key,
    GEMINI_API_KEY=your_gemini_key,
    REDIS_URL=redis://your-elasticache-endpoint:6379,
    RATE_LIMIT_PER_MINUTE=10
  }"
```

---

## 7. DynamoDB Tables Reference (from `dynamodb.tf`)

| Table | Hash Key | GSI Name | GSI Key | Purpose |
|---|---|---|---|---|
| `alphaask-Users` | `user_id` (S) | `EmailIndex` | `email` | User accounts; email lookup |
| `alphaask-Sessions` | `session_id` (S) | `UserSessionsIndex` | `user_id` | Chat sessions per user |
| `alphaask-Messages` | `message_id` (S) | `SessionMessagesIndex` | `session_id` | Full conversation history |
| `alphaask-Questions` | `id` (S) | `UserQuestionsIndex` | `user_id` | Question history with O(1) user-scoped lookup |
| `alphaask-FAQ` | `faq_id` (S) | — | — | Static FAQ entries |

All tables use `PAY_PER_REQUEST` billing mode (on-demand) — zero provisioned capacity cost.

---

## 8. Verification Checklist

After deployment, verify all components are operational:

```bash
# 1. Health check — Lambda + API Gateway
curl https://alphaask.alphateam.live/api/health
# Expected: {"status": "ok"} or {"status": "healthy"}

# 2. Auth — Register a test user
curl -X POST https://alphaask.alphateam.live/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","name":"Test"}'
# Expected: {"token":"eyJ..."}

# 3. Terraform outputs
cd infra/terraform && terraform output

# 4. Backend Pytest suite (13/13)
cd backend && source .venv/bin/activate && pytest -v

# 5. Frontend Vitest suite (6/6)
cd frontend && npm test

# 6. Frontend build
cd frontend && npm run build
```

---

## 9. Troubleshooting Reference

### Issue 1: "AlphaAsk couldn't reach the model"
- **Cause**: Vite proxy misconfigured or `VITE_API_BASE_URL` not set.
- **Fix**: Confirm `frontend/vite.config.ts` proxies `/api` → `http://localhost:8000`. Confirm backend is running.

### Issue 2: `InvalidParameterValueException: Reserved keys used in this request: AWS_REGION`
- **Cause**: Terraform `lambda_apigw.tf` includes `AWS_REGION` in Lambda environment variables.
- **Fix**: Remove `AWS_REGION` from the Lambda env block — AWS Lambda injects it automatically.

### Issue 3: PDF binary syntax appearing in LLM responses
- **Cause**: Raw PDF stream bytes passed to the LLM without text extraction.
- **Fix**: Handled automatically by `clean_pdf_text_context()` in `llm_services.py` — pypdf extraction, base64 decode, Latin1 re-encode, regex fallback.

### Issue 4: Docker build fails with multi-platform manifest error on ECR
- **Cause**: `docker build` without `--provenance=false` creates a multi-platform manifest that ECR rejects.
- **Fix**: Always include `--platform linux/amd64 --provenance=false` in the build command.

### Issue 5: `ResourceInUseException` during `terraform apply` in CI/CD
- **Cause**: Ephemeral GitHub Actions runner starts with empty Terraform state; tries to create already-existing resources.
- **Fix**: Run `terraform import` for each existing resource before `terraform apply`. The `deploy.yml` workflow handles this automatically via AWS CLI existence checks.

### Issue 6: Pytest ImportError / ModuleNotFoundError
- **Cause**: Running `pytest` without the virtual environment activated.
- **Fix**: Always activate `.venv` first: `source backend/.venv/bin/activate && pytest`.

### Issue 7: Redis connection refused locally
- **Cause**: No local Redis server running; `REDIS_URL` defaults to `redis://localhost:6379`.
- **Fix**: The rate limiter (`rate_limit.py`) gracefully falls back to in-memory when Redis is unavailable — local dev works without Redis. Alternatively: `docker run -d -p 6379:6379 redis:alpine`.

---

## 10. Quick Command Reference

```bash
# ── Local Development ──────────────────────────────────────────────────────────
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload
cd frontend && npm run dev

# ── Testing ───────────────────────────────────────────────────────────────────
cd backend && source .venv/bin/activate && pytest -v          # 13/13 backend
cd frontend && npm test                                        # 6/6 frontend
cd frontend && npm run build                                   # Production build

# ── Terraform ─────────────────────────────────────────────────────────────────
cd infra/terraform && terraform init
cd infra/terraform && terraform validate
cd infra/terraform && terraform plan
cd infra/terraform && terraform apply -auto-approve
cd infra/terraform && terraform output
cd infra/terraform && terraform destroy -auto-approve          # CAUTION: tears down all AWS resources

# ── Docker (ECR) ──────────────────────────────────────────────────────────────
cd backend && docker build --platform linux/amd64 --provenance=false -t alphaask-backend .
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/alphaask-backend:latest

# ── Health Verification ───────────────────────────────────────────────────────
curl https://alphaask.alphateam.live/api/health
```
