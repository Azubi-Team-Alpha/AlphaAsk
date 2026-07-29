# AlphaAsk Serverless Backend API

FastAPI-powered serverless backend application for **AlphaAsk**, packaged as a Docker container image for AWS Lambda and Amazon API Gateway.

---

## Architecture & Tech Stack

- **Framework**: FastAPI (Python 3.11+)
- **Serverless Adapter**: Mangum (`Mangum(app)`)
- **AI Model**: AWS Bedrock (Claude 3.5 Sonnet)
- **Database**: Amazon DynamoDB (Users, Sessions, Messages, Questions, FAQ)
- **Authentication**: JWT & `bcrypt`
- **Testing**: `pytest`, `httpx`

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
.venv/bin/python -m pytest
```

## Docker Container Build

```bash
docker build -t alphaask-backend .
docker run -p 8000:8000 --env-file .env alphaask-backend
```
