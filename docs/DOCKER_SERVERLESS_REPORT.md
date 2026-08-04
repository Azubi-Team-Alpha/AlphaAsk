# AlphaAsk — Docker Serverless Architecture Report

## Executive Summary

This report documents the implemented Docker + AWS Serverless architecture for **AlphaAsk**. The platform runs a Python 3.11 FastAPI backend packaged as an OCI Docker container image, stored in **Amazon Elastic Container Registry (ECR)**, and executed on **AWS Lambda** via the **AWS Lambda Adapter** extension — achieving full serverless Docker deployment with zero idle cost and native SSE streaming support.

---

## 1. Docker in AWS Serverless Architecture — How AlphaAsk Does It

AWS Lambda natively supports containerized deployments via OCI-compliant Docker images. AlphaAsk uses **Option A: Lambda Container Images via ECR** (the recommended production approach):

### How It Works

```
Developer Machine
   │
   ├─► docker build --platform linux/amd64 --provenance=false -t alphaask-backend .
   │
   ├─► docker push → Amazon ECR (alphaask-backend:latest)
   │
   └─► terraform apply → AWS Lambda (image URI = ECR URL)
                              │
                              ▼
                   API Gateway HTTP Event
                              │
                    Lambda Adapter (port 8000)
                              │
                    uvicorn app.main:app
                              │
                         FastAPI Routes
```

The **AWS Lambda Adapter** (`public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4`) is copied from the public ECR gallery at build time. It translates Lambda event payloads into standard HTTP requests and forwards them to Uvicorn running on `PORT=8000` — no `Mangum` wrapper required in `requirements.txt`.

---

## 2. Dockerfile (Implemented)

Located at `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

# Copy AWS Lambda Adapter binary — translates Lambda events → HTTP
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8000
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| `python:3.11-slim` base image | Minimizes cold start time vs. `python:3.11` full image |
| AWS Lambda Adapter (not Mangum) | Native HTTP routing; no code changes to FastAPI required |
| `--host 0.0.0.0 --port 8000` | Lambda Adapter forwards to this port |
| `ENV PORT=8000` | Lambda Adapter reads `PORT` env var to determine target port |
| `--platform linux/amd64` | Lambda runs on x86_64; required for cross-platform builds on ARM Macs |
| `--provenance=false` | Prevents Docker BuildKit from creating multi-platform manifest — ECR rejects these |

---

## 3. Architectural Comparison Matrix

| Feature | **AlphaAsk: Lambda Container (ECR)** | AWS App Runner | Native Zip Lambda |
|:---|:---|:---|:---|
| **Serverless Model** | Scale-to-zero, pay-per-request | Managed; pauses when idle | Scale-to-zero, pay-per-request |
| **Docker Support** | ✅ Full OCI image (up to 10 GB) | ✅ Full Docker image | ❌ No Docker (zip only, 250 MB) |
| **Code Changes** | Zero — AWS Lambda Adapter handles routing | Zero — runs standard Uvicorn | Requires handler wrappers |
| **SSE / Streaming** | ✅ Native via HTTP API v2 + StreamingResponse | ✅ Native | Limited — buffering issues |
| **Cold Starts** | ~1.2–2s (slim base image) | Near zero (warm baseline) | ~0.5–1s (simpler) |
| **Free Tier** | ✅ 1M req/mo + 400K GB-seconds | ⚠️ Small compute cost when paused | ✅ Same as Lambda container |
| **Dependency Limit** | ✅ Up to 10 GB image | ✅ Up to 10 GB image | ❌ 250 MB uncompressed |
| **Status** | ✅ **IMPLEMENTED** | Not used | Not used |

**Why Lambda Container was chosen:** Our `requirements.txt` includes `fastapi`, `uvicorn`, `pydantic`, `boto3`, `passlib`, `python-jose`, `pypdf`, `redis`, `httpx`, and `pytest` — easily exceeding the 250 MB native zip limit. Container images remove this constraint entirely.

---

## 4. Infrastructure as Code — Terraform Modules

The complete serverless infrastructure is defined in modular Terraform files at `infra/terraform/`:

```
infra/terraform/
├── main.tf              # AWS provider config (us-east-1 region)
├── variables.tf         # Input variables (app_name, region, env, enable_cloudfront)
├── outputs.tf           # 8 outputs: API GW URL, ECR URL, CloudFront URL, Redis endpoint, etc.
├── ecr.tf               # ECR repository: alphaask-backend
├── dynamodb.tf          # 5 DynamoDB tables (on-demand, PAY_PER_REQUEST):
│                        #   alphaask-Users    (EmailIndex GSI)
│                        #   alphaask-Sessions (UserSessionsIndex GSI)
│                        #   alphaask-Messages (SessionMessagesIndex GSI)
│                        #   alphaask-Questions (UserQuestionsIndex GSI)
│                        #   alphaask-FAQ
├── elasticache.tf       # Redis cluster + subnet group (rate limiting: 10 req/min/user)
├── iam.tf               # Lambda execution role + policies (DynamoDB, ECR, Bedrock, CloudWatch)
├── lambda_apigw.tf      # Lambda container function + API Gateway HTTP v2 (ANY /{proxy+})
└── s3_cloudfront.tf     # S3 static bucket (frontend SPA) + CloudFront distribution
```

---

## 5. CI/CD Pipeline — GitHub Actions (`.github/workflows/deploy.yml`)

```
[ git push to main ]
        │
        ▼
[ Stage 1: Lint & Validate ]
  ├── terraform fmt -check
  └── terraform validate

[ Stage 2: Automated Tests ]
  ├── pytest (13/13 backend tests)
  └── npm test (6/6 frontend tests)

[ Stage 3: Docker Build & ECR Push ]
  ├── aws ecr get-login-password | docker login
  ├── docker build --platform linux/amd64 --provenance=false
  └── docker push → ECR

[ Stage 4: Deploy ]
  ├── terraform import (idempotent: imports live resources into empty runner state)
  ├── terraform apply -auto-approve
  ├── npm run build (VITE_API_BASE_URL injected from terraform output)
  └── aws s3 sync dist/ → S3 + CloudFront invalidation
```

### Idempotency Solution
GitHub Actions runners are **ephemeral** — each run starts with an empty `terraform.tfstate`. The pipeline uses AWS CLI existence checks (`aws dynamodb describe-table`, `aws lambda get-function`, etc.) before `terraform import`, preventing `ResourceInUseException` on already-deployed resources. If a resource exists, it is imported; if not, Terraform creates it fresh.

---

## 6. Deployed Infrastructure Verification

After deployment, `terraform output` returns:

| Output | Example Value |
|---|---|
| `api_gateway_url` | `https://abc123.execute-api.us-east-1.amazonaws.com` |
| `ecr_repository_url` | `438776351319.dkr.ecr.us-east-1.amazonaws.com/alphaask-backend` |
| `frontend_s3_bucket` | `alphaask-frontend-static-dev` |
| `frontend_s3_website_url` | `http://alphaask-frontend-static-dev.s3-website-us-east-1.amazonaws.com` |
| `cloudfront_domain_name` | `d1abc.cloudfront.net` |
| `dynamodb_users_table` | `alphaask-Users` |
| `elasticache_redis_endpoint` | `alphaask-redis.xxxxx.0001.use1.cache.amazonaws.com` |
| `cloudflare_cname_target` | CNAME value for `alphaask.alphateam.live` DNS record |

---

## 7. Cost Model

For an institution with 10,000 monthly student queries:

| Service | Pricing Model | Estimated Cost |
|---|---|---|
| **API Gateway HTTP v2** | $1.00 / 1M requests | ~$0.01 |
| **AWS Lambda** | $0.20 / 1M requests + $0.0000166667/GB-sec | ~$0.50 |
| **DynamoDB On-Demand** | $1.25 / 1M write units + $0.25 / 1M read units | ~$0.30 |
| **ElastiCache `t3.micro`** | ~$0.017/hr | ~$12.24/month |
| **CloudFront** | First 1 TB free, then $0.0085/GB | ~$0.00 |
| **Groq / OpenRouter** | Free tier covers 10K queries/month | $0.00 |
| **TOTAL** | | **~$13/month** |

> **Note**: ElastiCache is the primary cost driver. For a zero-cost setup, disable ElastiCache and use the built-in in-memory rate-limit fallback in `rate_limit.py`.

---

## 8. Summary

AlphaAsk successfully demonstrates that **Docker containers and AWS serverless architectures are fully compatible and complementary**. The Lambda Container Image approach:

1. ✅ Eliminates the 250 MB zip size constraint
2. ✅ Provides environment parity between local dev and cloud Lambda
3. ✅ Supports native SSE streaming via HTTP API v2
4. ✅ Achieves scale-to-zero with pay-per-request pricing
5. ✅ Integrates seamlessly with Terraform IaC and GitHub Actions CI/CD
6. ✅ Runs a standard Uvicorn FastAPI application — no special Lambda handler code required
