# 🧠 SENTRIX — Model Evaluator
# Evaluates precision, recall, and F1 metrics for the Isolation Forest + LSTM Autoencoder models

import os
import torch
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support

from ml.features.preprocessor import Preprocessor, FEATURE_COLUMNS
from ml.features.sequence_builder import SequenceBuilder
from ml.models.isolation_forest import IsolationForestModel
from ml.models.lstm_autoencoder import LSTMAutoencoder, compute_reconstruction_errors
from ml.scoring.risk_scorer import RiskScorer

def evaluate_models(saved_dir="ml/models/saved", data_df=None):
    """
    Evaluates model predictions against ground truth labels in data_df.
    """
    scaler_path = os.path.join(saved_dir, "scaler.joblib")
    if_path = os.path.join(saved_dir, "isolation_forest.joblib")
    lstm_path = os.path.join(saved_dir, "lstm_autoencoder.pt")
    
    if not (os.path.exists(scaler_path) and os.path.exists(if_path) and os.path.exists(lstm_path)):
        print("❌ Cannot run evaluation: missing trained model files.")
        return False
        
    print("🔬 Loading models for evaluation...")
    
    # Load Scaler
    preprocessor = Preprocessor()
    preprocessor.load(scaler_path)
    
    # Load Isolation Forest
    if_model = IsolationForestModel()
    if_model.load(if_path)
    
    # Load LSTM Autoencoder
    checkpoint = torch.load(lstm_path, map_location=torch.device("cpu"), weights_only=False)
    lstm_model = LSTMAutoencoder(
        n_features=checkpoint.get("n_features", 25),
        hidden_size=checkpoint.get("hidden_size", 128),
        latent_size=checkpoint.get("latent_size", 64)
    )
    lstm_model.load_state_dict(checkpoint["model_state_dict"])
    lstm_threshold = checkpoint.get("lstm_threshold", 0.05)
    
    # Load Risk Scorer
    risk_scorer = RiskScorer(lstm_threshold=lstm_threshold)
    
    # Preprocess Data
    scaled_df = preprocessor.transform(data_df)
    
    # Build sequences
    seq_builder = SequenceBuilder(sequence_length=20, n_features=25)
    sequences, ground_truth_labels, agent_ids = seq_builder.build_sequences(scaled_df, FEATURE_COLUMNS)
    
    if len(sequences) == 0:
        print("❌ No sequences available for evaluation.")
        return False
        
    # Get last item of each sequence to feed into Isolation Forest
    last_steps = sequences[:, -1, :]
    
    # Run Isolation Forest inference
    if_anomaly_scores = if_model.compute_anomaly_score(last_steps)
    
    # Run LSTM Autoencoder inference
    lstm_mses = compute_reconstruction_errors(lstm_model, sequences, device="cpu")
    
    # Compute Ensemble Risk Scores
    predictions = []
    predicted_labels = []
    
    for i in range(len(sequences)):
        risk, is_anomaly, severity = risk_scorer.compute_risk(if_anomaly_scores[i], lstm_mses[i])
        predictions.append(risk)
        predicted_labels.append(1 if is_anomaly else 0)
        
    # Calculate Metrics
    precision, recall, f1, _ = precision_recall_fscore_support(ground_truth_labels, predicted_labels, average='binary', zero_division=0)
    
    print("\n📊 Sentrix Pipeline Evaluation Metrics:")
    print("=" * 45)
    print(f"Accuracy:  {np.mean(ground_truth_labels == np.array(predicted_labels)):.4f}")
    print(f"Precision: {precision:.4f} (Target > 0.92)")
    print(f"Recall:    {recall:.4f} (Target > 0.87)")
    print(f"F1-Score:  {f1:.4f} (Target > 0.89)")
    print("=" * 45)
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(ground_truth_labels, predicted_labels))
    print("\nClassification Report:")
    print(classification_report(ground_truth_labels, predicted_labels, target_names=["Normal", "Anomaly"]))
    
    return {
        "precision": precision,
        "recall": recall,
        "f1": f1
    }
