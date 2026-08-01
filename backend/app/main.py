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
        "https://alphaask.alphateam.live",
        "http://alphaask.alphateam.live",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://alphaask-frontend-static-dev.s3-website-us-east-1.amazonaws.com",
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Mount routers under root path
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(ask.router)
app.include_router(history.router)
app.include_router(questions.router)
app.include_router(questions.faq_router)

# Mount routers under /api prefix for API Gateway / proxy routing
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(ask.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(questions.router, prefix="/api")
app.include_router(questions.faq_router, prefix="/api")

try:
    from mangum import Mangum
    handler = Mangum(app)
except ImportError:
    handler = None
