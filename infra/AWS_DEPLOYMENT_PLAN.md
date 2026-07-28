# AlphaAsk AWS Deployment Plan (Serverless - Requirements Compliant)

## Overview
Deploy AlphaAsk using AWS SERVERLESS architecture as specified in requirements: API Gateway + Lambda + DynamoDB + CloudFront, with GitHub Actions CI/CD, optimized for AWS Free Tier.

**⚠️ IMPORTANT:** This architecture follows the project requirements which specify serverless architecture (API Gateway + Lambda + DynamoDB), not container-based (ECS + RDS).

---

## Architecture Diagram (Requirements Compliant)

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                         │
│                    (Source Code & CI/CD)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Actions CI/CD                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Build     │  │   Test      │  │   Deploy    │              │
│  │   Lambda    │  │   Unit      │  │   to AWS    │              │
│  │   Packages  │  │   Tests     │  │   SAM/TF     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Infrastructure                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    CloudFront (CDN)                      │   │
│  │              (Free Tier: 1TB/month transfer)             │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Amazon API Gateway (REST API)                │   │
│  │              (Free: 1M API calls/month)                   │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  AWS Lambda Functions                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │   │
│  │  │   /ask      │  │  /question  │  │    /FAQ     │      │   │
│  │  │   Lambda    │  │   Lambda    │  │   Lambda    │      │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │   │
│  │  ┌─────────────┐  ┌─────────────┐                        │   │
│  │  │  /auth      │  │  /sessions  │                        │   │
│  │  │   Lambda    │  │   Lambda    │                        │   │
│  │  └─────────────┘  └─────────────┘                        │   │
│  │              (Free: 400K GB-sec/month)                    │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│              ┌──────────────┴──────────────┐                   │
│              │                             │                   │
│              ▼                             ▼                   │
│  ┌──────────────────────┐    ┌──────────────────────┐        │
│  │  Amazon DynamoDB     │    │  S3 (Frontend Static)│        │
│  │  Questions Table     │    │  React Build Assets   │        │
│  │  (Free: 25GB storage)│    │  (Free: 5GB storage)  │        │
│  └──────────────────────┘    └──────────┬───────────┘        │
│                                         │                      │
│                                         ▼                      │
│                              ┌──────────────────────┐         │
│                              │  AWS Bedrock (LLM)   │         │
│                              │  (Pay per use)       │         │
│                              └──────────────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              CloudWatch (Monitoring & Logging)            │   │
│  │              (Free: 5GB logs, 10 metrics)                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Trello/Jira Integration                       │   │
│  │              (Issue Tracking)                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## AWS Resources & Free Tier Limits (Requirements Compliant)

### Compute (Serverless)
- **AWS Lambda**: 400,000 GB-seconds/month + 1M requests/month (Free Tier)
  - Backend: FastAPI functions (refactored as Lambda handlers)
  - Configuration: 256 MB memory, 3-5 second timeout
  - Functions: /ask, /question, /FAQ, /auth, /sessions
  - Estimated cost after free tier: ~$0.20 per 1M requests

### Storage
- **S3**: 5 GB standard storage, 20,000 requests/month (Free Tier)
  - Frontend static assets (React build)
  - Estimated cost after free tier: ~$0.023/GB

### Database (Serverless)
- **Amazon DynamoDB**: 25 GB storage + 200 WCUs/RCUs (Free Tier)
  - Questions table (partition key: user_id, sort key: question_id)
  - Sessions table (partition key: session_id)
  - Messages table (partition key: session_id, sort key: message_id)
  - FAQ table (partition key: category, sort key: faq_id)
  - Estimated cost after free tier: ~$0.25 per million read/write units

### Networking
- **API Gateway**: 1M API calls/month + 1GB data processing (Free Tier)
  - REST API endpoints
  - Estimated cost after free tier: ~$3.50 per million API calls

- **CloudFront**: 1 TB data transfer/month (Free Tier)
  - CDN for frontend and API
  - Estimated cost after free tier: ~$0.085/GB

### Monitoring
- **CloudWatch**: 5 GB logs, 10 custom metrics (Free Tier)
  - Lambda logs and metrics
  - Estimated cost after free tier: ~$0.50/GB logs

### AI Services
- **AWS Bedrock**: Pay per use (no free tier)
  - Claude 3.5 Sonnet: ~$0.003/1K input tokens, ~$0.015/1K output tokens
  - Estimated cost: ~$10-50/month depending on usage

### Project Management
- **Trello/Jira API**: Free tier available
  - Integration for issue tracking
  - Log failed queries or user feedback as tickets

---

## Terraform Infrastructure Structure (Serverless)

```
infra/
├── terraform/
│   ├── main.tf                 # Main configuration
│   ├── variables.tf            # Input variables
│   ├── outputs.tf              # Output values
│   ├── provider.tf             # AWS provider configuration
│   ├── api_gateway/
│   │   ├── main.tf             # API Gateway REST API
│   │   ├── resources.tf        # API endpoints and methods
│   │   └── variables.tf
│   ├── lambda/
│   │   ├── main.tf             # Lambda functions
│   │   ├── ask_lambda.tf       # /ask endpoint handler
│   │   ├── question_lambda.tf  # /question endpoint handler
│   │   ├── faq_lambda.tf       # /FAQ endpoint handler
│   │   ├── auth_lambda.tf      # /auth endpoint handler
│   │   ├── sessions_lambda.tf  # /sessions endpoint handler
│   │   └── variables.tf
│   ├── dynamodb/
│   │   ├── main.tf             # DynamoDB tables
│   │   ├── questions_table.tf  # Questions table
│   │   ├── sessions_table.tf   # Sessions table
│   │   ├── messages_table.tf   # Messages table
│   │   ├── faq_table.tf        # FAQ table
│   │   └── variables.tf
│   ├── s3/
│   │   ├── main.tf             # S3 buckets for frontend
│   │   └── variables.tf
│   ├── cloudfront/
│   │   ├── main.tf             # CDN distribution
│   │   └── variables.tf
│   ├── cloudwatch/
│   │   ├── main.tf             # Log groups, alarms
│   │   └── variables.tf
│   ├── iam/
│   │   ├── main.tf             # IAM roles for Lambda
│   │   └── variables.tf
│   └── security/
│       ├── main.tf             # Security policies
│       └── variables.tf
└── README.md
```

---

## GitHub Actions CI/CD Pipeline (Serverless)

### Workflow Stages

```yaml
# .github/workflows/deploy.yml

name: Deploy to AWS (Serverless)

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Set up Python
      - Install dependencies
      - Run backend unit tests
      - Set up Node
      - Install frontend dependencies
      - Run frontend tests

  build-lambda:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Set up Python
      - Install dependencies
      - Package Lambda functions
      - Upload to S3 (deployment package)
      - Update Lambda functions

  build-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Set up Node
      - Install dependencies
      - Build React app
      - Sync to S3
      - Invalidate CloudFront cache

  deploy-infrastructure:
    needs: [build-lambda, build-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Configure AWS credentials
      - Setup Terraform
      - Terraform init
      - Terraform plan
      - Terraform apply

  deploy-lambda:
    needs: deploy-infrastructure
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - Configure AWS credentials
      - Update Lambda function code
      - Wait for deployment
```

---

## Cost Optimization Strategies (Serverless)

### 1. Lambda Configuration
- Use 256 MB memory (optimal for most Lambda functions)
- Set appropriate timeouts (3-5 seconds for API endpoints)
- Enable Lambda provisioned concurrency only for production
- Estimated savings: 60-80% vs always-on containers

### 2. DynamoDB Optimization
- Use on-demand capacity mode (pay per request)
- Enable TTL for old messages (30 days retention)
- Use GSIs efficiently for query patterns
- Estimated savings: 40-50% vs provisioned capacity

### 3. API Gateway Caching
- Enable API Gateway caching for /FAQ endpoint (5 minutes)
- Cache static responses to reduce Lambda invocations
- Estimated savings: 30-40% on API costs

### 4. CloudFront Caching
- Cache API responses for 5 minutes
- Cache static assets for 1 year
- Reduce origin requests by 90%

### 5. S3 Lifecycle Policies
- Move old logs to Glacier after 30 days
- Estimated savings: 80% on storage costs

### 6. Monitoring & Alerts
- CloudWatch billing alerts at $10, $25, $50
- Lambda invocation count alerts
- DynamoDB read/write unit alerts

---

## Estimated Monthly Costs (After Free Tier - Serverless)

| Service | Usage | Cost |
|---------|-------|------|
| AWS Lambda | 500K invocations | $0.10 |
| DynamoDB | 10M read/write units | $2.50 |
| S3 Storage | 2 GB | $0.05 |
| CloudFront | 500 GB | $42.50 |
| API Gateway | 500K API calls | $1.75 |
| CloudWatch Logs | 2 GB | $1.00 |
| AWS Bedrock | 1M tokens | $15.00 |
| **Total** | | **$62.40** |

**With Optimization:** ~$30-40/month

---

## Implementation Phases (Serverless)

### Phase 1: Infrastructure Setup (Week 1)
- Set up Terraform configuration
- Create DynamoDB tables (Questions, Sessions, Messages, FAQ)
- Set up API Gateway REST API
- Configure IAM roles for Lambda

### Phase 2: Backend Lambda Functions (Week 2)
- Refactor FastAPI endpoints to Lambda handlers
- Package Lambda functions with dependencies
- Deploy Lambda functions
- Configure API Gateway integration

### Phase 3: Frontend Deployment (Week 2)
- Build React application
- Set up S3 bucket
- Configure CloudFront distribution
- Deploy static assets

### Phase 4: CI/CD Pipeline (Week 3)
- Create GitHub Actions workflow
- Set up AWS credentials in GitHub Secrets
- Configure automated testing
- Enable auto-deployment on main branch

### Phase 5: Trello/Jira Integration (Week 4)
- Set up Trello/Jira API integration
- Configure issue tracking for failed queries
- Implement feedback logging

### Phase 6: Monitoring & Optimization (Week 4)
- Set up CloudWatch dashboards
- Configure alarms and alerts
- Optimize Lambda memory and timeout
- Optimize DynamoDB capacity mode

---

## Security Considerations (Serverless)

### 1. Network Security
- API Gateway with authorization (JWT tokens)
- VPC endpoint for DynamoDB (private access)
- Security groups with least privilege

### 2. Application Security
- Secrets in AWS Secrets Manager (not environment variables)
- IAM roles with minimal permissions for Lambda
- Enable DynamoDB encryption at rest (AWS managed KMS)
- Enable API Gateway TLS/HTTPS

### 3. CI/CD Security
- GitHub Actions secrets for AWS credentials
- OIDC federation for GitHub Actions (no long-lived credentials)
- Require approval for production deployments

### 4. Compliance
- Enable AWS Config for compliance monitoring
- Enable CloudTrail for audit logging
- Enable DynamoDB Point-in-Time Recovery (PITR)

---

## Next Steps

1. **Create Terraform configuration files**
2. **Set up GitHub repository with CI/CD workflow**
3. **Configure AWS credentials and permissions**
4. **Deploy infrastructure to development environment**
5. **Test deployment pipeline**
6. **Deploy to production**
7. **Set up monitoring and cost optimization**

---

## References

- [AWS Free Tier](https://aws.amazon.com/free/)
- [ECS Fargate Pricing](https://aws.amazon.com/ecs/pricing/)
- [RDS Pricing](https://aws.amazon.com/rds/pricing/)
- [CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)
- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
