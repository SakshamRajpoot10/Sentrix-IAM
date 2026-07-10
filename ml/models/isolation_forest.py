# 🧠 SENTRIX — Isolation Forest Model Wrapper
# Trains Isolation Forest on normal event features to score agent requests

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from ml.features.preprocessor import FEATURE_COLUMNS

class IsolationForestModel:
    def __init__(self, n_estimators: int = 200, contamination: float = 0.05, random_state: int = 42):
        self.model = IsolationForest(
            n_estimators=n_estimators,
            contamination=contamination,
            random_state=random_state,
            n_jobs=-1
        )

    def fit(self, X_train: np.ndarray) -> None:
        """
        Trains Isolation Forest on Normal agent behavior samples only.
        """
        self.model.fit(X_train)

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predicts binary classification: -1 for anomaly, 1 for normal.
        """
        return self.model.predict(X)

    def compute_anomaly_score(self, X: np.ndarray) -> np.ndarray:
        """
        Computes anomaly score in range [0, 1].
        scikit-learn outputs scores where lower values are more anomalous.
        We convert it so that higher values (approaching 1) represent anomalies.
        """
        # score_samples returns raw scores in range [-0.5, 0.5] approximately.
        # IsolationForest decision_function returns negative values for anomalies, positive for normal.
        # We normalize score to [0, 1] range:
        raw_scores = self.model.score_samples(X) # range [-1, 0] where -1 is anomaly, 0 is normal
        
        # Map: raw_scores of -1 -> 1.0 (anomaly), raw_scores of 0 -> 0.0 (normal)
        # score_samples values are usually between -0.8 and -0.2.
        # We can map: anomaly_score = 1.0 - (raw_scores - min_val) / (max_val - min_val)
        # Or a standard offset mapping:
        anomaly_scores = -raw_scores
        # Cap/clip to [0.0, 1.0] range
        anomaly_scores = np.clip(anomaly_scores, 0.0, 1.0)
        return anomaly_scores

    def save(self, file_path: str) -> None:
        joblib.dump(self.model, file_path)

    def load(self, file_path: str) -> None:
        self.model = joblib.load(file_path)
