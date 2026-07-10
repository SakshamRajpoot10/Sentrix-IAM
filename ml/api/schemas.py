# 🧠 SENTRIX — Pydantic Schemas for ML FastAPI endpoints

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class PredictRequest(BaseModel):
    agent_id: str = Field(..., description="UUID of the agent to score")

class PredictResponse(BaseModel):
    risk_score: float = Field(..., description="Aggregated risk score in range [0, 1]")
    is_anomaly: bool = Field(..., description="True if risk_score >= 0.80")
    severity: str = Field(..., description="Severity level: NORMAL, SUSPICIOUS, or CRITICAL")
    details: Dict[str, Any] = Field(..., description="Breakdown of underlying model predictions")

class TrainResponse(BaseModel):
    status: str
    message: str

class BaselineResponse(BaseModel):
    status: str
    agent_id: str
    baseline: Dict[str, Any]
