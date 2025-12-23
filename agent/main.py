from fastapi import FastAPI

app = FastAPI(title="Instant AI Copilot", description="AI Agent service for Instant trading system")


@app.get("/")
def root():
    return {"service": "instant-copilot", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
