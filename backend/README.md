# AlphaAsk Serverless Backend API

FastAPI-powered serverless backend application for **AlphaAsk**, packaged as a Docker container image for deployment to AWS Lambda and Amazon API Gateway.

---

## Architecture & Tech Stack

- **Framework**: FastAPI (Python 3.12)
- **Serverless Adapter**: Mangum (`Mangum(app)`)
- **Multi-LLM Orchestration**: AWS Bedrock (Claude 3.5 Sonnet), Groq Cloud (Llama 3.3 70B), Google Gemini (2.5/2.0/1.5 Flash)
- **Database**: Amazon DynamoDB (Users, Sessions, Messages, Questions with GSI, FAQ)
- **Cache / Rate Limiter**: ElastiCache Redis
- **Authentication**: JWT (`python-jose`) & `bcrypt` password hashing (`passlib`)
- **Testing**: `pytest`, `httpx`

---

## API Endpoints

- **Auth**: `POST /auth/register`, `POST /auth/login`
- **Sessions & History**: `POST /sessions`, `GET /conversations`, `GET /history/{session_id}`
- **AI Completion & Streaming**: `POST /ask`, `POST /ask/stream` (SSE)
- **User Questions & FAQ**: `GET /questions`, `GET /questions/{id}`, `DELETE /questions/{id}`, `GET /FAQ`
- **Health Check**: `GET /health`

---

## Local Development

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Running Tests

```bash
pytest
```

## Docker Container Build

```bash
docker build -t alphaask-backend .
docker run -p 8000:8000 --env-file .env alphaask-backend
```
