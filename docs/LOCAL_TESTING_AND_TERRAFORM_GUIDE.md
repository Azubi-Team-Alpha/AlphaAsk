# AlphaAsk: Full Local Setup, Testing & Terraform Deployment Guide

This document provides complete, step-by-step instructions to provision the AWS Serverless Infrastructure using **Terraform**, run and test the **FastAPI Backend** and **React Frontend** locally, and resolve model connection or API gateway integration issues.

---

## 1. Architecture Overview

```
[ React Frontend (Vite) ]  ───►  [ Amazon API Gateway (HTTP API) ]
                                            │
                                            ▼
                               [ AWS Lambda Container (FastAPI) ]
                                 │            │           │
                                 ▼            ▼           ▼
                           [ DynamoDB ]   [ Redis ]  [ AWS Bedrock ]
                           (5 Tables)     (Cache)    (Claude 3.5 Sonnet)
```

---

## 2. Prerequisites & Environment Setup

Ensure you have the following installed on your local machine:
- **AWS CLI** (configured with `aws configure` using an IAM user with permissions for DynamoDB, ECR, Lambda, API Gateway, and Bedrock)
- **Terraform v1.5+**
- **Python 3.11+**
- **Node.js 20+** & **npm 10+**
- **Docker Engine** (running locally)

---

## 3. Provision AWS Infrastructure via Terraform

Before running backend/frontend services, provision the required AWS resources (DynamoDB tables, ElastiCache Redis, ECR, API Gateway, S3).

### Step 3.1: Initialize & Provision ECR Repository

```bash
cd infra/terraform
terraform init
terraform apply -auto-approve -target=aws_ecr_repository.backend
```

### Step 3.2: Build & Push Backend Container to ECR

AWS Lambda requires an initial Docker container image in Amazon ECR before function creation. Build with single-architecture `linux/amd64` and `--provenance=false`:

```bash
# 1. Login to Amazon ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

# 2. Build backend container image
cd ../../backend
docker build --provenance=false --platform linux/amd64 \
  -t $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/alphaask-backend:latest .

# 3. Push container image to ECR
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/alphaask-backend:latest
```

### Step 3.3: Deploy Full Infrastructure

```bash
cd ../infra/terraform
terraform apply -auto-approve
```

Save the generated outputs:
- **`api_gateway_url`**: e.g., `https://4tsuwbgeb3.execute-api.us-east-1.amazonaws.com/`
- **`frontend_s3_website_url`**: e.g., `http://alphaask-frontend-static-dev.s3-website-us-east-1.amazonaws.com`

---

## 4. Local Backend Setup & Execution

### Step 4.1: Configure Backend Environment

Create a `.env` file in the `backend/` directory:

```env
AWS_REGION=us-east-1
JWT_SECRET_KEY=super-secret-jwt-key-alphaask-2026-production
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
USERS_TABLE=alphaask-Users
SESSIONS_TABLE=alphaask-Sessions
MESSAGES_TABLE=alphaask-Messages
QUESTIONS_TABLE=alphaask-Questions
FAQ_TABLE=alphaask-FAQ
REDIS_URL=redis://localhost:6379  # Or use deployed ElastiCache Redis endpoint
```

### Step 4.2: Install Dependencies & Run FastAPI

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run pytest unit tests
pytest

# Start FastAPI development server on port 8000
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify backend health at: [http://localhost:8000/health](http://localhost:8000/health) or API documentation at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 5. Local Frontend Setup & Execution

### Step 5.1: Configure Frontend API Target

Create `.env.local` inside the `frontend/` directory to configure the target backend:

```env
# To connect frontend to local FastAPI server:
VITE_API_BASE_URL=http://localhost:8000

# OR to connect frontend directly to live AWS API Gateway:
# VITE_API_BASE_URL=https://4tsuwbgeb3.execute-api.us-east-1.amazonaws.com
```

### Step 5.2: Install Dependencies & Run Vite Dev Server

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to test the UI!

---

## 6. Full End-to-End Verification Flow

1. Open **[http://localhost:5173](http://localhost:5173)** in your browser.
2. Click **Sign Up** to create a test user account.
3. Select a subject chip (e.g. **Science** or **Code**) or select a starter prompt.
4. Send a prompt to AlphaAsk (e.g. *"Explain how recursion works with a Python example"*).
5. The frontend will communicate with the backend (`/ask`), which invokes **AWS Bedrock Claude 3.5 Sonnet** and returns an AI response with annotations and conversation memory!

---

## 7. Troubleshooting Guide

### Issue 1: "AlphaAsk couldn't reach the model" in Frontend
- **Cause**: The Vite development server proxy is missing or `VITE_API_BASE_URL` is pointing to an invalid address.
- **Fix**: Verify `frontend/vite.config.ts` includes the dev server proxy for `/api`, and ensure `backend` is running on `http://localhost:8000` or `VITE_API_BASE_URL` is correctly set in `frontend/.env.local`.

### Issue 2: `InvalidParameterValueException: Reserved keys used in this request: AWS_REGION`
- **Cause**: Setting `AWS_REGION` under Lambda environment variables in Terraform.
- **Fix**: `AWS_REGION` is injected automatically by AWS Lambda runtime. Remove `AWS_REGION` from `lambda_apigw.tf` environment variables.

### Issue 3: `InvalidParameterValueException: Image manifest ... not supported`
- **Cause**: Building Docker images with Docker Buildx multi-arch / OCI index format.
- **Fix**: Build with `--provenance=false --platform linux/amd64`.

---

## 8. Summary of Quick Commands

```bash
# 1. Run Pytest Backend Unit Tests
cd backend && pytest

# 2. Check Frontend Production Build
cd frontend && npm run build

# 3. Validate Terraform Configuration
cd infra/terraform && terraform validate

# 4. Deploy Infrastructure via Terraform
cd infra/terraform && terraform apply -auto-approve
```

