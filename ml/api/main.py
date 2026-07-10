# 🧠 SENTRIX ML Service — FastAPI Application
# Runtime behavioral anomaly detection for AI agents using Isolation Forest + LSTM Autoencoder

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("sentrix.ml")

# Startup lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models on startup, clean up on shutdown."""
    logger.info("🧠 Sentrix ML Service starting up...")
    
    # Lazy imports to ensure DB and models load properly on start
    from ml.api.dependencies import model_registry
    
    if model_registry.is_healthy():
        logger.info("🚀 All ML models loaded successfully and ready.")
    else:
        logger.info("📦 No saved models found. Train models first via POST /train")
        
    yield
    
    # Cleanup
    logger.info("🛑 Sentrix ML Service shutting down...")

# ─── Create FastAPI App ──────────────────────────────────────
app = FastAPI(
    title="Sentrix ML Service",
    description="Behavioral anomaly detection for AI agents using Isolation Forest + LSTM Autoencoder",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Health Check ────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """Service health check."""
    from ml.api.dependencies import model_registry
    return {
        "status": "healthy",
        "service": "sentrix-ml",
        "version": "1.0.0",
        "models": {
            "scaler": model_registry.scaler is not None,
            "isolation_forest": model_registry.isolation_forest is not None,
            "lstm_autoencoder": model_registry.lstm_autoencoder is not None
        }
    }

# ─── Include Router ──────────────────────────────────────────
from ml.api.routes import router as ml_router
app.include_router(ml_router, prefix="", tags=["Inference"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ml.api.main:app", host="0.0.0.0", port=8000, reload=True)
