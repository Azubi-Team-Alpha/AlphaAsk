from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import ask, history, sessions, auth, health

app = FastAPI(
    title="AI Student Support API",
    description="AI-powered academic support with conversation memory",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(ask.router)
app.include_router(history.router)
