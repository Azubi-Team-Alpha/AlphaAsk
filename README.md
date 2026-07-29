# AlphaAsk — AI-Powered Student Support Platform

**AlphaAsk** is a cloud-native, fully serverless AI academic support platform designed for higher education institutions. It enables university students to submit academic queries and receive instant, context-aware responses powered by **AWS Bedrock (Claude 3.5 Sonnet)**, backed by **Amazon DynamoDB** for conversation state and session history.

---

## 1. System Architecture (Serverless AWS)

```
[ React 19 Frontend (Vite) ]
           │
           ├──> (Static Assets) ──> [ Amazon CloudFront CDN ] ──> [ S3 Static Bucket ]
           │
           └──> (API Calls) ─────> [ Amazon API Gateway (HTTP API v2) ]
                                                │
                                                ▼ (AWS_PROXY)
                                   [ AWS Lambda Container (ECR) ]
                                                │
                                ┌───────────────┴───────────────┐
                                ▼                               ▼
                     [ Amazon DynamoDB ]                [ AWS Bedrock ]
                  (Users, Sessions, Messages)        (Claude 3.5 Sonnet)
```

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Lucide Icons, Modern CSS Design Tokens.
- **Backend API**: Python 3.11+, FastAPI, Uvicorn, Mangum (ASGI Serverless Adapter).
- **AI Service**: AWS Bedrock — Anthropic Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20240620-v1:0`).
- **Database**: Amazon DynamoDB (On-Demand NoSQL Tables for Users, Sessions, Messages, Questions, FAQ).
- **Authentication**: JWT (JSON Web Tokens via `python-jose`) and `bcrypt` password hashing.
- **Cache / Rate Limiting**: Redis with graceful serverless fallback.
- **Infrastructure as Code**: Terraform (`>= 1.5.0`, AWS Provider `~> 5.0`).
- **CI/CD Pipeline**: GitHub Actions (automated linting, testing, ECR container build, and Terraform deployment).

---

## 3. Project Implementation Status

| Phase | Focus Area | Status | Deliverables |
|:---:|:--- |:---:|:--- |
| **1** | Project Setup & AWS Provisioning | ✅ **Complete** | ECR, DynamoDB tables, IAM execution roles |
| **2** | Core REST API Endpoints | ✅ **Complete** | `/auth`, `/sessions`, `/ask`, `/history`, `/question`, `/FAQ` |
| **3** | AI Integration (AWS Bedrock) | ✅ **Complete** | Bedrock `converse()` API integration with academic prompts |
| **4** | CI/CD Pipeline (GitHub Actions) | ✅ **Complete** | Automated build, test, ECR container push & Terraform apply |
| **5** | IaC Deployment & CloudWatch Logs | ✅ **Complete** | Terraform scripts (`infra/terraform/`), CloudWatch execution logging |

---

## 4. API Endpoints Reference

| Method | Endpoint | Auth Required | Description |
|:---:|:--- |:---:|:--- |
| `GET` | `/health` | No | System health check |
| `POST` | `/auth/register` | No | Student registration, returns JWT token |
| `POST` | `/auth/login` | No | Student authentication, returns JWT token |
| `POST` | `/sessions` | Yes | Create a new academic chat session |
| `GET` | `/sessions` | Yes | List user's active chat sessions |
| `POST` | `/ask` | Yes | Ask an academic question & get AI response |
| `GET` | `/history/{session_id}` | Yes | Fetch conversation history for a session |
| `GET` | `/question` | Yes | List user's past submitted questions |
| `GET` | `/question/{id}` | Yes | Get detailed question by ID |
| `DELETE` | `/question/{id}` | Yes | Delete a question and its answer |
| `GET` | `/FAQ` | No | Retrieve frequently asked questions |

*Note: All protected endpoints require header `Authorization: Bearer <token>`.*

---

## 5. Local Setup & Testing

### 5.1 Backend Setup

```bash
cd backend

# Create & activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install serverless backend dependencies
pip install -r requirements.txt

# Run FastAPI server locally
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 5.2 Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5.3 Automated Unit Tests

```bash
cd backend
.venv/bin/python -m pytest
```

---

## 6. Infrastructure as Code (Terraform)

All Terraform configurations reside in `infra/terraform/`:

```bash
cd infra/terraform

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan infrastructure deployment
terraform plan

# Apply deployment to AWS
terraform apply -auto-approve
```

---

## 7. Documentation Index

- **Serverless Architecture & Docker Feasibility Report**: [infra/DOCKER_SERVERLESS_REPORT.md](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/infra/DOCKER_SERVERLESS_REPORT.md)
- **Local Testing & Deployment Guide**: [docs/LOCAL_TESTING_AND_TERRAFORM_GUIDE.md](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/docs/LOCAL_TESTING_AND_TERRAFORM_GUIDE.md)
- **Project Requirements Document**: [docs/L2_Project 3 (1).pdf](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/docs/L2_Project%203%20%281%29.pdf)
