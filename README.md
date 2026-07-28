# AlphaAsk

AI-powered student support API that lets students ask academic questions and receive instant AI-generated responses, with full conversation history and session management.

## Architecture

```
Client → FastAPI (EC2/Docker) → AWS Bedrock (Claude 3.5 Sonnet)
                              → PostgreSQL (users, sessions, messages)
                              → Redis (rate limiting)
```

CI/CD is handled via GitHub Actions.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | No | Health check |
| `POST` | `/auth/login` | No | Login, returns JWT |
| `POST` | `/sessions` | Yes | Create a chat session |
| `POST` | `/ask` | Yes | Ask an academic question |
| `GET` | `/history/{session_id}` | Yes | Get conversation history |

All protected endpoints require `Authorization: Bearer <token>`.

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL
- Redis
- AWS account with Bedrock access (Claude 3.5 Sonnet)

### Setup

```bash
cd backend
cp .env.example .env   # fill in your values
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET_KEY` | Secret for signing JWTs |
| `JWT_EXPIRE_MINUTES` | Token expiry (default: 60) |
| `AWS_REGION` | AWS region for Bedrock |
| `BEDROCK_MODEL_ID` | Bedrock model ID |
| `RATE_LIMIT_PER_MINUTE` | Max requests per user per minute |

### Docker

```bash
cd backend
docker build -t alphaask .
docker run -p 8000:8000 --env-file .env alphaask
```

Interactive docs available at `http://localhost:8000/docs`.

## Project Phases

| Phase | Focus |
|-------|-------|
| 1 | Project setup, GitHub repo, AWS provisioning |
| 2 | Core REST API endpoints |
| 3 | AI integration (AWS Bedrock) |
| 4 | CI/CD pipeline (GitHub Actions) |
| 5 | Logging, monitoring (CloudWatch), deployment |

## Tech Stack

- **API**: FastAPI + Uvicorn
- **AI**: AWS Bedrock — Claude 3.5 Sonnet
- **Database**: PostgreSQL via SQLAlchemy + Alembic
- **Cache / Rate Limiting**: Redis
- **Auth**: JWT (python-jose)
- **CI/CD**: GitHub Actions
- **Container**: Docker
