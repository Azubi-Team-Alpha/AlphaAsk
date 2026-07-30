# AlphaAsk: Full Local Setup, Testing & Terraform Deployment Guide

This document provides complete, step-by-step instructions to provision the AWS Serverless Infrastructure using **Terraform**, run and test the **FastAPI Backend** and **React Frontend** locally, run the **Automated Test Suites (Pytest & Vitest)**, and verify streaming and RAG document uploads.

---

## 1. Architecture Overview

```
[ React Frontend (Vite) ]  ───►  [ Amazon API Gateway (HTTP API) ]
                                            │
                                            ▼
                               [ AWS Lambda Container (FastAPI) ]
                                 │            │           │
                                 ▼            ▼           ▼
                           [ DynamoDB ]   [ Redis ]  [ Multi-LLM Orchestrator ]
                           (5 Tables)     (Cache)    (Groq, Gemini, Bedrock)
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
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 438776351319.dkr.ecr.us-east-1.amazonaws.com

# 2. Build backend container image
cd backend
docker build --platform linux/amd64 --provenance=false -t alphaask-backend .

# 3. Tag container image
docker tag alphaask-backend:latest 438776351319.dkr.ecr.us-east-1.amazonaws.com/alphaask-backend:latest

# 4. Push container image to ECR
docker push 438776351319.dkr.ecr.us-east-1.amazonaws.com/alphaask-backend:latest
```

### Step 3.3: Apply Complete Infrastructure

```bash
cd infra/terraform
terraform apply -auto-approve
```

---

## 4. Local Development & Testing Workflow

### 4.1 Backend Setup & Pytest Execution

```bash
cd backend

# Create & activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Execute automated Pytest backend unit test suite (13 tests)
.venv/bin/pytest

# Run FastAPI server locally
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 4.2 Frontend Setup & Vitest Execution

```bash
cd frontend

# Install packages
npm install

# Execute Vitest component test suite (6 tests)
npm test

# Start Vite dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Automated Testing Verification Matrix

```bash
# 1. Backend Pytest Suite
cd backend
.venv/bin/pytest
# Result: 13 passed

# 2. Frontend Vitest Suite
cd frontend
npm test
# Result: 6 passed (2 test files)

# 3. Frontend Production Build
cd frontend
npm run build
# Result: Built in 1.33s cleanly
```

---

## 6. Troubleshooting Guide

### Issue 1: "AlphaAsk couldn't reach the model" in Frontend
- **Cause**: The Vite development server proxy is missing or `VITE_API_BASE_URL` is pointing to an invalid address.
- **Fix**: Verify `frontend/vite.config.ts` includes the dev server proxy for `/api`, and ensure `backend` is running on `http://localhost:8000` or `VITE_API_BASE_URL` is correctly set in `frontend/.env.local`.

### Issue 2: `InvalidParameterValueException: Reserved keys used in this request: AWS_REGION`
- **Cause**: Setting `AWS_REGION` under Lambda environment variables in Terraform.
- **Fix**: `AWS_REGION` is injected automatically by AWS Lambda runtime. Remove `AWS_REGION` from `lambda_apigw.tf` environment variables.

### Issue 3: Binary PDF Byte Pollution in Document Upload
- **Cause**: Attaching raw `.pdf` files without text extraction passed PDF syntax `/FirstChar` and metric arrays `/Widths`.
- **Fix**: Handled via client-side PDF stream regex parser in `useChat.ts` and backend `clean_pdf_text_context()` in `llm_services.py`.

---

## 7. Summary of Key Commands

```bash
# 1. Run Pytest Backend Unit Tests
cd backend && .venv/bin/pytest

# 2. Run Vitest Frontend Unit Tests
cd frontend && npm test

# 3. Check Frontend Production Build
cd frontend && npm run build

# 4. Validate Terraform Configuration
cd infra/terraform && terraform validate

# 5. Deploy Infrastructure via Terraform
cd infra/terraform && terraform apply -auto-approve
```
