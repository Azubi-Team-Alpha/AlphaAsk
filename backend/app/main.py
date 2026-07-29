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
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
