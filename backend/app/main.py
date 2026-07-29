from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import ask, history, sessions, auth, health, questions

app = FastAPI(
    title="AI Student Support API",
    description="AI-powered academic support with conversation memory",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://alphaask-frontend-static-dev.s3-website-us-east-1.amazonaws.com",
    ],
    allow_origin_regex=r"https?:\\..*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import APIRouter

api_v1_router = APIRouter(prefix="/api")
api_v1_router.include_router(health.router)
api_v1_router.include_router(auth.router)
api_v1_router.include_router(sessions.router)
api_v1_router.include_router(ask.router)
api_v1_router.include_router(history.router)
api_v1_router.include_router(questions.router)
api_v1_router.include_router(questions.faq_router)

app.include_router(api_v1_router)
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(ask.router)
app.include_router(history.router)
app.include_router(questions.router)
app.include_router(questions.faq_router)

try:
    from mangum import Mangum
    handler = Mangum(app)
except ImportError:
    handler = None
