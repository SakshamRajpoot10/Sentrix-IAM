# 🧠 SENTRIX — API Dependencies & Database Connector
# Instantiates SQLAlchemy engine and model registry for FastAPI dependencies

import os
from dotenv import load_dotenv

# Load environment variables from root directory .env
dotenv_path = os.path.join(os.path.dirname(__file__), "../../.env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    load_dotenv() # fallback to default

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from ml.models.registry import ModelRegistry
from ml.scoring.risk_scorer import RiskScorer

# Load environment variables
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "sentrix")
DB_USER = os.getenv("DB_USER", "sentrix")
DB_PASSWORD = os.getenv("DB_PASSWORD", "sentrix_dev")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# SQLAlchemy engine setup
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=5,
    pool_recycle=1800
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Model registry singleton
model_registry = ModelRegistry(saved_dir="ml/models/saved")
model_registry.load_all_models()

# Risk Scorer instance
lstm_threshold = model_registry.metadata.get("lstm_threshold", 0.05) if model_registry.metadata else 0.05
risk_scorer = RiskScorer(lstm_threshold=lstm_threshold)

def get_db():
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_model_registry() -> ModelRegistry:
    return model_registry

def get_risk_scorer() -> RiskScorer:
    # Always keep threshold in sync with registry
    if model_registry.metadata:
        risk_scorer.set_lstm_threshold(model_registry.metadata.get("lstm_threshold", 0.05))
    return risk_scorer
