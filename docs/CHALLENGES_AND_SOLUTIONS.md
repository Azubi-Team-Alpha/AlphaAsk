# AlphaAsk — Technical Challenges & Solutions Log

This document serves as a comprehensive, living record of all technical challenges encountered during the development, deployment, and infrastructure orchestration of **AlphaAsk**, along with their root causes, diagnostic processes, and implemented solutions.

---

## 1. Terraform Infrastructure State Disconnect & Duplicate Resource Conflicts

### Problem Statement
Running `terraform apply` (either locally or inside GitHub Actions) failed with `ResourceInUseException`, `EntityAlreadyExists`, `BucketAlreadyExists`, or `ConflictException` for DynamoDB tables (`alphaask-Users`, `alphaask-Sessions`, etc.), IAM roles (`alphaask-lambda-exec-role`), S3 static bucket (`alphaask-frontend-static-dev`), and API Gateway routes (`ANY /{proxy+}`).

### Root Cause
GitHub Actions runners (`ubuntu-latest`) operate on fresh, ephemeral virtual machines. Because Terraform was configured using a local backend without an S3 remote state lock (`terraform.tfstate`), each CI run initialized an **empty state file**. Without state tracking, Terraform assumed zero resources existed on AWS and attempted `Create*` calls on pre-existing live infrastructure.

### Solution & Resolution
1. **Pre-Apply Automated Resource Existence Check**:
   Updated Stage 4 of `.github/workflows/deploy.yml` and `.github/workflows/destroy.yml` to check AWS CLI for resource existence (`if aws ... >/dev/null 2>&1`) prior to running `terraform import -lock=false`.
2. **Safe Import Routine**:
   If resources exist on AWS, `terraform import` maps them into state so `terraform apply` updates them in-place. If resources do not exist yet, the import step is skipped gracefully, allowing `terraform apply` to create them cleanly without breaking the build script.

---

## 2. API Gateway & FastAPI Route Mismatches (`405 Method Not Allowed` / `404 Not Found`)

### Problem Statement
Frontend requests to endpoints like `/api/auth/register`, `/api/conversations`, and `/api/questions` returned `405 Method Not Allowed` or `404 Not Found`.

### Root Cause
1. FastAPI routers in `backend/app/main.py` were initially mounted only at root (`/auth/register`, `/question`), creating a mismatch with frontend `/api/*` endpoints.
2. The router for questions ([backend/app/api/questions.py](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/backend/app/api/questions.py)) used singular `prefix="/question"` instead of plural `/questions`.
3. The conversation history router lacked a dedicated `GET /conversations` endpoint.
4. Vite dev proxy in `frontend/vite.config.ts` had a path rewrite `rewrite: (path) => path.replace(/^\/api/, '')` that caused inconsistent URL path stripping between local development and production.

### Solution & Resolution
1. Mounted all API routers under both `/api` prefix AND root paths in `backend/app/main.py`.
2. Updated `questions.py` router prefix to `prefix="/questions"`.
3. Added `@router.get("/conversations")` in `backend/app/api/history.py`.
4. Removed the path `rewrite` rule in `frontend/vite.config.ts` so `/api/...` requests pass directly to backend services.

---

## 3. S3 Static Website Host API Invocations (`405 Method Not Allowed`)

### Problem Statement
When accessing the live frontend deployed on S3 static website hosting (`http://alphaask-frontend-static-dev.s3-website-us-east-1.amazonaws.com`), clicking Register or Login resulted in `POST ... 405 Method Not Allowed`.

### Root Cause
S3 Static Website Hosting is a static file server that cannot execute server-side code or process HTTP `POST` requests. In `.github/workflows/deploy.yml`, `npm run build` was executed without specifying `VITE_API_BASE_URL`. Consequently, `fetch("/api/auth/register")` resolved relative to the S3 bucket domain, sending `POST` requests directly to S3.

### Solution & Resolution
1. Updated [frontend/src/lib/api.ts](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/frontend/src/lib/api.ts) to define `const API_BASE = import.meta.env.VITE_API_BASE_URL || ""` with automated trailing-slash stripping (`rawBase.replace(/\/+$/, "")`).
2. Updated Stage 4 of [.github/workflows/deploy.yml](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/.github/workflows/deploy.yml) to extract `api_gateway_url` from Terraform outputs and inject it into the production build step:
   ```bash
   API_URL=$(terraform output -raw api_gateway_url)
   VITE_API_BASE_URL="$API_URL" npm run build
   ```

---

## 4. Web Crypto API Restrictions on HTTP Domains (`TypeError: crypto.randomUUID is not a function`)

### Problem Statement
Clicking "New Question" or sending messages on the live S3 web frontend threw uncaught JavaScript errors: `TypeError: crypto.randomUUID is not a function`.

### Root Cause
Modern browsers restrict `crypto.randomUUID()` to **Secure Contexts** (`https://` or `http://localhost`). When accessing the S3 web endpoint over non-HTTPS (`http://alphaask-frontend-static-dev...`), browsers disable `crypto.randomUUID()`.

### Solution & Resolution
Created a safe, cross-browser `generateUUID()` fallback in [frontend/src/lib/utils.ts](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/frontend/src/lib/utils.ts):
```ts
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```
Replaced all instances of `crypto.randomUUID()` across `api.ts`, `useChat.ts`, and `App.tsx` with `generateUUID()`.

---

## 5. AWS Bedrock Model Deprecation & Role Formatting (`ResourceNotFoundException` / `ValidationException`)

### Problem Statement
Sending questions on `/api/ask` returned `502 Bad Gateway` with error messages:
- `ResourceNotFoundException (This model version has reached the end of its life)`
- `ValidationException`

### Root Cause
1. The configured model ID `anthropic.claude-3-5-sonnet-20240620-v1:0` reached end-of-life (EOL) status on AWS Bedrock in `us-east-1`.
2. AWS Bedrock `us-east-1` requires cross-region inference profiles (`us.anthropic.claude-3-5-sonnet-20241022-v2:0`).
3. Bedrock Converse API enforces strict validation: message roles must strictly **alternate** between `"user"` and `"assistant"`, and message text cannot be empty.

### Solution & Resolution
1. **Message Role Sanitization**: Updated `get_llm_response()` in [backend/app/services/llm_services.py](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/backend/app/services/llm_services.py) to sanitize message histories, merge consecutive user prompts, and enforce non-empty alternating strings.
2. **Active Model Updates**: Updated default `bedrock_model_id` in `config.py` and `variables.tf` to `us.anthropic.claude-3-5-sonnet-20241022-v2:0`.
3. **Failover Execution Chain**: Implemented an automated execution loop across active AWS Bedrock models:
   ```python
   model_candidates = [
       "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
       "us.anthropic.claude-3-haiku-20240307-v1:0",
       "amazon.titan-text-express-v1",
       "amazon.nova-micro-v1:0",
       settings.bedrock_model_id,
   ]
   ```
   If any candidate encounters a client exception, the execution loop automatically attempts the next candidate model until a response is successfully returned.

---

## 6. IDE Python Interpreter & Unresolved Package Warnings

### Problem Statement
The IDE language server highlighted backend Python files with red/yellow squiggles: `Cannot find module mangum` and `Cannot find module pytest`.

### Root Cause
The IDE language server defaulted to the global system Python interpreter (`/usr/bin/python3.14`) instead of the project virtual environment (`backend/.venv`).

### Solution & Resolution
Created workspace settings file [.vscode/settings.json](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/.vscode/settings.json):
```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/.venv/bin/python",
  "python.analysis.extraPaths": [
    "${workspaceFolder}/backend"
  ]
}
```

---

## 7. CI/CD Pipeline Architecture & Multi-Stage Division

### Problem Statement
The deployment pipeline was previously structured into 2 broad jobs, making it difficult to pinpoint step-level build or infrastructure failures.

### Solution & Resolution
Restructured [.github/workflows/deploy.yml](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/.github/workflows/deploy.yml) into **4 clear, sequential stages**:
1. `1. Test & Validate` (Pytest, Frontend build, Terraform validate)
2. `2. Provision ECR Repository` (AWS ECR repository existence)
3. `3. Build & Push Docker Image` (Single-arch container build & ECR push)
4. `4. Deploy Infrastructure & Frontend Assets` (Terraform apply, Lambda code refresh, S3 sync with injected API Gateway URL)

---

## 8. AWS Bedrock Model Access Approvals & System Parameter Incompatibility (`Validation error (Operation not allowed)`)

### Problem Statement
Sending questions to Bedrock produced a runtime validation error:
`Validation error (Operation not allowed). Please rephrase your question.`

### Root Cause
1. In AWS Bedrock, Amazon Titan and Nova models do not accept the `system` parameter in the `converse` API payload. Passing `system=[{"text": SYSTEM_PROMPT}]` to non-Anthropic models triggers `Validation error (Operation not allowed)`.
2. Anthropic models (Claude 3.5 Sonnet / Claude 3 Haiku) require explicit **Model Access approval** in the AWS Bedrock Console for AWS Account `438776351319` in region `us-east-1`.

### Solution & Resolution
1. Updated [backend/app/services/llm_services.py](file:///home/haadi/Desktop/AWS%20Cloud/Azubi-AWS-AI/Team%20Alpha/alphaask/backend/app/services/llm_services.py) to pass `system` parameters conditionally only for Anthropic models (`if "anthropic" in model_id.lower()`).
2. Implemented clear diagnostic error reporting indicating when Model Access approval is pending in AWS Bedrock Console.

---

> *Note: This document is continuously updated whenever new technical challenges or infrastructure edge-cases are addressed.*
