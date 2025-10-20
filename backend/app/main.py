from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, scraper, chatbot, profile, subscription, analytics, clerk_webhook

app = FastAPI(
    title="Web Scraper API",
    description="API for web scraping and RAG-based chatbot generation",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for chatbot widget to work from any domain
    allow_credentials=False,  # Must be False when allow_origins is "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(scraper.router, prefix="/api/scraper", tags=["Scraper"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(profile.router, prefix="/api", tags=["Profile"])
app.include_router(subscription.router, prefix="/api/subscription", tags=["Subscription"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(clerk_webhook.router, prefix="/api/clerk", tags=["Clerk Webhooks"])

@app.get("/")
async def root():
    return {"message": "Web Scraper API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

