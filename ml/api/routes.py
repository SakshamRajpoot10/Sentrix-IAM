# 🧠 SENTRIX — ML FastAPI Router
# Implements predict, train, and baseline routes with direct database integration

import logging
import numpy as np
import pandas as pd
import torch
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Security
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session
from sqlalchemy import text

from ml.api.schemas import PredictRequest, PredictResponse, TrainResponse, BaselineResponse
from ml.api.dependencies import get_db, get_model_registry, get_risk_scorer
from ml.features.extractor import FeatureExtractor
from ml.features.preprocessor import FEATURE_COLUMNS
from ml.features.sequence_builder import SequenceBuilder
from ml.scoring.baseline_builder import BaselineBuilder
from ml.training.train_pipeline import run_training_pipeline

logger = logging.getLogger("sentrix.ml.routes")
router = APIRouter()

# API key security setup
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)
ML_API_KEY = "sentrix-ml-internal-key" # Dev placeholder matched in Java

def verify_api_key(api_key: str = Security(API_KEY_HEADER)):
    """Verifies service-to-service internal API key."""
    if api_key != ML_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid ML API key")
    return api_key

@router.post("/predict", response_model=PredictResponse, dependencies=[Depends(verify_api_key)])
def predict_agent_anomaly(request: PredictRequest, db: Session = Depends(get_db), 
                          registry = Depends(get_model_registry), scorer = Depends(get_risk_scorer)):
    """
    Evaluates real-time risk score of an AI agent.
    1. Fetches recent events from DB.
    2. Runs feature extractor & preprocessor.
    3. Infers via Isolation Forest & LSTM models.
    4. Persists the risk score in the agents database table.
    """
    if not registry.is_healthy():
        # Fallback to normal status if models are not loaded yet
        return PredictResponse(
            risk_score=0.0,
            is_anomaly=False,
            severity="NORMAL",
            details={"error": "Models not loaded. Running in bypass mode."}
        )

    agent_id = request.agent_id
    
    # Query recent events for agent
    query = text("""
        SELECT action, resource, outcome, latency_ms, metadata, created_at 
        FROM behavioral_events 
        WHERE agent_id = :agent_id 
        ORDER BY created_at DESC 
        LIMIT 100
    """)
    
    try:
        result = db.execute(query, {"agent_id": agent_id}).fetchall()
    except Exception as e:
        logger.error(f"Failed to query behavioral events: {e}")
        raise HTTPException(status_code=500, detail="Database query error")
        
    if not result:
        # Default response for new agent with no history
        return PredictResponse(
            risk_score=0.0,
            is_anomaly=False,
            severity="NORMAL",
            details={"message": "No behavioral events found."}
        )
        
    # Convert list of tuples to DataFrame
    events = []
    for row in result:
        # row: (action, resource, outcome, latency_ms, metadata, created_at)
        events.append({
            "agent_id": agent_id,
            "action": row[0],
            "resource": row[1],
            "outcome": row[2],
            "latency_ms": row[3],
            "metadata": row[4] if isinstance(row[4], dict) else {},
            "created_at": row[5].isoformat() if isinstance(row[5], datetime) else str(row[5]),
            "is_anomaly": False
        })
        
    df = pd.DataFrame(events)
    
    # Extract features
    extractor = FeatureExtractor()
    features_df = extractor.extract_features(df)
    
    if features_df.empty:
        return PredictResponse(
            risk_score=0.0,
            is_anomaly=False,
            severity="NORMAL",
            details={"message": "Insufficient window duration to extract features."}
        )
        
    # Scale features
    scaled_df = registry.scaler.transform(features_df[FEATURE_COLUMNS])
    
    # Build temporal sequence (sliding windows of length 20)
    seq_builder = SequenceBuilder(sequence_length=20, n_features=25)
    sequence = seq_builder.build_single_sequence(scaled_df)
    
    # Inference — Isolation Forest (last timestep of sequence)
    last_step = sequence[:, -1, :]
    if_score = float(registry.isolation_forest.compute_anomaly_score(last_step)[0])
    
    # Inference — LSTM Autoencoder
    lstm_mse = float(np.mean((registry.lstm_autoencoder(torch.tensor(sequence, dtype=torch.float32)) - torch.tensor(sequence, dtype=torch.float32)).detach().numpy() ** 2))
    
    # Calculate combined risk
    risk_score, is_anomaly, severity = scorer.compute_risk(if_score, lstm_mse)
    trust_level = int((1.0 - risk_score) * 100.0)
    
    # Update agent stats in database directly
    update_query = text("""
        UPDATE agents 
        SET risk_score = :risk_score, trust_level = :trust_level, last_active_at = NOW() 
        WHERE id = :agent_id
    """)
    try:
        db.execute(update_query, {
            "risk_score": risk_score,
            "trust_level": trust_level,
            "agent_id": agent_id
        })
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update agent {agent_id} stats: {e}")
        
    return PredictResponse(
        risk_score=risk_score,
        is_anomaly=is_anomaly,
        severity=severity,
        details={
            "isolation_forest_anomaly_score": if_score,
            "lstm_reconstruction_mse": lstm_mse,
            "events_evaluated": len(df)
        }
    )

@router.post("/baseline/{agent_id}", response_model=BaselineResponse, dependencies=[Depends(verify_api_key)])
def compute_agent_baseline(agent_id: str, db: Session = Depends(get_db)):
    """
    Computes/updates behavioral baseline for an agent and stores it in database.
    """
    query = text("""
        SELECT action, resource, outcome, latency_ms, metadata, created_at 
        FROM behavioral_events 
        WHERE agent_id = :agent_id 
        ORDER BY created_at DESC 
        LIMIT 1000
    """)
    
    try:
        result = db.execute(query, {"agent_id": agent_id}).fetchall()
    except Exception as e:
        logger.error(f"Failed to query behavioral events: {e}")
        raise HTTPException(status_code=500, detail="Database query error")
        
    if not result:
        raise HTTPException(status_code=400, detail="No events found for this agent to build baseline.")
        
    # Build dataframe
    events = []
    for row in result:
        events.append({
            "action": row[0],
            "resource": row[1],
            "outcome": row[2],
            "latency_ms": row[3],
            "metadata": row[4] if isinstance(row[4], dict) else {},
            "created_at": row[5]
        })
    df = pd.DataFrame(events)
    
    builder = BaselineBuilder()
    baseline = builder.compute_agent_baseline(df)
    
    if not baseline:
        return BaselineResponse(
            status="insufficient_data",
            agent_id=agent_id,
            baseline={}
        )
        
    # Save back to database
    update_query = text("""
        UPDATE agents 
        SET behavioral_baseline = :baseline 
        WHERE id = :agent_id
    """)
    try:
        db.execute(update_query, {
            "baseline": pd.io.json.dumps(baseline),
            "agent_id": agent_id
        })
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save baseline for agent {agent_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to save baseline.")
        
    return BaselineResponse(
        status="success",
        agent_id=agent_id,
        baseline=baseline
    )

def train_background_task(registry):
    """Retrains models and reloads them in memory."""
    success = run_training_pipeline(saved_dir="ml/models/saved", num_events=15000)
    if success:
        registry.load_all_models()
        logger.info("Retraining successful, models reloaded.")
    else:
        logger.error("Background retraining failed.")

@router.post("/train", response_model=TrainResponse, dependencies=[Depends(verify_api_key)])
def trigger_retraining(background_tasks: BackgroundTasks, registry = Depends(get_model_registry)):
    """
    Triggers model retraining in the background.
    """
    background_tasks.add_task(train_background_task, registry)
    return TrainResponse(
        status="running",
        message="Model training initiated in the background."
    )
