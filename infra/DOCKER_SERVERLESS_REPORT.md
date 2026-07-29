# AlphaAsk: Serverless Docker Architecture & Infrastructure Report

## Executive Summary

This report evaluates the feasibility, benefits, and architectural design for deploying the **AlphaAsk** backend using **Docker containers within an AWS Serverless Architecture**, as requested in the project requirements (`docs/L2_Project 3 (1).pdf`).

---

## 1. Can Docker Files Be Used in AWS Serverless Architecture?

**YES, absolutely.** AWS provides native support for containerized serverless deployments through two primary mechanisms:

### Option A: AWS Lambda Container Images (OCI Image Support) — *Recommended for pure Serverless*
AWS Lambda allows deploying container images (up to 10 GB) stored in **Amazon Elastic Container Registry (ECR)**. 
- **How it works:** We package the FastAPI application into a Docker container. By using the **AWS Lambda Web Adapter** or **Mangum** (an ASGI adapter for FastAPI), AWS Lambda routes API Gateway events directly to FastAPI routes without changing application code.
- **Cost & Scaling:** Scale-to-zero, pay strictly per request (Free Tier includes 1,000,000 requests/month and 400,000 GB-seconds/month).

### Option B: AWS App Runner — *Fully Managed Serverless Container Platform*
AWS App Runner is a fully managed service that builds and deploys containerized web applications directly from ECR or source repos.
- **How it works:** Runs standard `uvicorn app.main:app` containers behind an automatically provisioned load balancer with built-in auto-scaling and TLS encryption.
- **Cost & Scaling:** Scales container instances down to 1 pause state when idle.

---

## 2. Architectural Comparison Matrix

| Feature | Option A: AWS Lambda Container (ECR + API Gateway) | Option B: AWS App Runner | Option C: Native Zip Lambda |
| :--- | :--- | :--- | :--- |
| **Serverless Model** | Pure pay-per-request (Scale-to-zero) | Managed serverless containers | Pure pay-per-request (Scale-to-zero) |
| **Docker Support** | ✅ Full Docker image support (up to 10GB) | ✅ Full Docker image support | ❌ No Docker (Zip package only, max 250MB) |
| **Code Changes** | Minimal (Add `mangum` adapter to FastAPI) | Zero code changes (runs standard Uvicorn) | Requires custom Lambda handler wrappers |
| **Cold Starts** | ~1.2s - 2s on initial request | Near zero (keeps baseline container warm) | ~0.5s - 1s |
| **Free Tier Eligibility** | ✅ 1M requests/mo free | ⚠️ Includes free tier build time; small compute cost | ✅ 1M requests/mo free |
| **Recommendation** | **PRIMARY CHOICE** (Fulfills project requirements) | **ALTERNATIVE CHOICE** | Legacy approach |

---

## 3. Backend Analysis & Required Code Modifications

After auditing the existing `backend/` codebase against serverless container requirements:

### 3.1 Dockerfile Fixes
- **Issue:** Existing `backend/Dockerfile` had a broken CMD placeholder: `--host "[IP_ADDRESS]"`.
- **Fix:** Update `Dockerfile` to bind to `--host 0.0.0.0 --port 8000` or use AWS Lambda Web Adapter base image for direct Lambda deployment.

### 3.2 FastAPI Serverless Adapter (`mangum`)
- To allow FastAPI to run inside AWS Lambda, add `mangum` to `requirements.txt` and export the ASGI handler in `backend/app/main.py`:
  ```python
  from mangum import Mangum
  from app.main import app

  handler = Mangum(app)
  ```

### 3.3 Database & Cache Resilience
- **DynamoDB:** The app already uses `boto3` for DynamoDB operations. In AWS environment, `boto3.resource("dynamodb")` automatically inherits IAM credentials from the Lambda Execution Role.
- **Redis Rate Limiting:** Add graceful fallback in `backend/app/core/rate_limit.py` so requests succeed even if ElastiCache/Redis is initializing or unreachable.

---

## 4. Proposed Infrastructure as Code (Terraform) Structure

The infrastructure will be defined in modular Terraform files inside `infra/terraform/`:

```
infra/terraform/
├── main.tf              # AWS Provider & Backend config
├── variables.tf         # Input variables (AWS region, environment, table names)
├── outputs.tf           # Resource URLs and API Gateway endpoints
├── ecr.tf               # ECR Repository for backend container images
├── dynamodb.tf          # DynamoDB Tables (Users, Sessions, Messages, FAQ)
├── elasticache.tf       # AWS ElastiCache for Redis (Managed Caching & Rate Limiting)
├── iam.tf               # IAM execution roles for Lambda (DynamoDB & Bedrock access)
├── lambda_apigw.tf      # AWS Lambda Container function & API Gateway HTTP API
└── s3_cloudfront.tf     # S3 bucket & CloudFront distribution for React frontend
```

---

## 5. CI/CD Strategy (GitHub Actions)

A unified workflow in `.github/workflows/deploy.yml`:

```
[ Push to Main ]
       │
       ├──> 1. Run Unit Tests (pytest in backend, tsc build in frontend)
       │
       ├──> 2. Build & Push Docker Container Image to AWS ECR
       │
       ├──> 3. Execute Terraform (Provision/Update AWS Resources)
       │
       └──> 4. Deploy Frontend Static Assets to S3 + Invalidate CloudFront
```

---

## Next Steps & Implementation Plan

1. **Backend Integration**: Add `mangum` adapter, update `backend/Dockerfile`, and verify local container execution.
2. **Terraform Infrastructure**: Implement modular `.tf` scripts inside `infra/terraform/`.
3. **CI/CD Pipeline**: Create `.github/workflows/deploy.yml` for automated testing and AWS deployment.
