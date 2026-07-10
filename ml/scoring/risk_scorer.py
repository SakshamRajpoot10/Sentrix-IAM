# 🧠 SENTRIX — Risk Scorer Ensemble
# Combines Isolation Forest anomaly score and LSTM Autoencoder reconstruction error

import numpy as np
import logging

logger = logging.getLogger("sentrix.ml.scoring")

class RiskScorer:
    def __init__(self, lstm_threshold: float = 0.05):
        # Threshold of normal validation MSE, used to normalize reconstruction error via Sigmoid mapping
        self.lstm_threshold = lstm_threshold

    def set_lstm_threshold(self, threshold: float):
        self.lstm_threshold = threshold

    def compute_risk(self, if_score: float, lstm_mse: float) -> tuple:
        """
        Computes ensemble risk score and returns (risk_score, is_anomaly, severity).
        Ensemble formula:
          lstm_score = 1.0 - exp(-lstm_mse / lstm_threshold)
          risk_score = 0.4 * if_score + 0.6 * lstm_score
        """
        # Map LSTM MSE to [0, 1] range
        if self.lstm_threshold > 0:
            lstm_score = 1.0 - np.exp(-lstm_mse / self.lstm_threshold)
        else:
            lstm_score = 0.0
            
        # Weighted ensemble
        risk_score = float(0.4 * if_score + 0.6 * lstm_score)
        
        # Determine anomaly status and severity
        is_anomaly = risk_score >= 0.80
        
        if risk_score >= 0.80:
            severity = "CRITICAL"
        elif risk_score >= 0.30:
            severity = "SUSPICIOUS"
        else:
            severity = "NORMAL"
            
        return risk_score, is_anomaly, severity
