# AlphaAsk: Local Testing & Terraform Infrastructure Guide

This guide provides step-by-step instructions for testing the **AlphaAsk** backend and frontend locally, provisioning AWS Serverless Infrastructure using **Terraform**, and validating the **GitHub Actions CI/CD** pipeline.

---

## 1. Architecture Overview

```
[ React Frontend (Vite) ]
         │
         ▼ (HTTP / CORS)
[ Amazon API Gateway / FastAPI Server ]
         │
         ├──> [ Amazon DynamoDB ] (Users, Sessions, Messages, Questions, FAQ)
         └──> [ AWS Bedrock ] (Claude 3.5 Sonnet AI Model)
```

---

## 2. Local Testing Guide

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker (optional, for local container testing)
- AWS CLI configured (`aws configure`) with access to AWS Bedrock and DynamoDB

---

### Step 2.1: Run the Backend Locally

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables in `backend/.env`:
   ```env
   AWS_REGION=us-east-1
   JWT_SECRET_KEY=your-super-secret-jwt-key
   BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
   USERS_TABLE=alphaask-Users
   SESSIONS_TABLE=alphaask-Sessions
   MESSAGES_TABLE=alphaask-Messages
   QUESTIONS_TABLE=alphaask-Questions
   FAQ_TABLE=alphaask-FAQ
   ```

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. Open interactive API docs in your browser:
   [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Step 2.2: Run the Frontend Locally

1. Open a new terminal tab and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open the web interface in your browser:
   [http://localhost:5173](http://localhost:5173)

---

### Step 2.3: Test Docker Container Locally

To test the backend container locally before pushing to AWS ECR:

```bash
cd backend
docker build -t alphaask-backend .
docker run -p 8000:8000 \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret \
  alphaask-backend
```

---

## 3. Terraform Infrastructure Provisioning Guide

All Infrastructure as Code (IaC) files are located in `infra/terraform/`.

### Step 3.1: Initialize & Plan Terraform

1. Navigate to the Terraform directory:
   ```bash
   cd infra/terraform
   ```

2. Initialize Terraform providers and backend:
   ```bash
   terraform init
   ```

3. Validate Terraform configuration syntax:
   ```bash
   terraform validate
   ```

4. Generate and inspect the deployment plan:
   ```bash
   terraform plan
   ```

---

### Step 3.2: Deploy Infrastructure to AWS

1. Apply the Terraform configuration to provision AWS resources:
   ```bash
   terraform apply -auto-approve
   ```

2. Note the generated outputs:
   - `api_gateway_url`: The public REST endpoint for the backend API.
   - `ecr_repository_url`: The ECR repository URL for backend container images.
   - `cloudfront_domain_name`: The CloudFront HTTPS URL for the frontend.
   - `frontend_s3_bucket`: S3 bucket hosting frontend static build assets.

---

## 4. GitHub Actions CI/CD Pipelines

### 4.1 Deployment Pipeline (`.github/workflows/deploy.yml`)
Structured into 4 modular jobs:
1. `test-and-lint`: Runs pytest unit tests & verifies React production build.
2. `build-and-push-ecr`: Builds Docker container image and pushes to AWS ECR.
3. `terraform-deploy`: Validates, plans, and applies Terraform IaC.
4. `update-lambda-and-frontend`: Updates Lambda container code & syncs S3/CloudFront CDN.

### 4.2 Teardown & Destroy Pipeline (`.github/workflows/destroy.yml`)
Manual workflow triggered via **Actions > AlphaAsk Teardown Infrastructure Pipeline > Run workflow**:
- Empties S3 bucket & runs `terraform destroy -auto-approve` to safely remove all AWS resources.

### Required GitHub Secrets
In your GitHub repository under **Settings > Secrets and variables > Actions**, add:

| Secret Name | Description | Example |
| :--- | :--- | :--- |
| `AWS_ACCESS_KEY_ID` | IAM User Access Key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | IAM User Secret Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS Region | `us-east-1` |

---

## 5. Summary of Automated Verification Commands

Run unit tests and build checks anytime using:

```bash
# Backend Pytest
cd backend && python -m pytest

# Frontend Build & Typecheck
cd frontend && npm run build

# Terraform Formatting & Validation
cd infra/terraform && terraform fmt -check && terraform validate
```
