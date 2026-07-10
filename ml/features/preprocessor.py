# 🧠 SENTRIX — Preprocessor
# Standardizes and encodes features for model consumption

import joblib
import pandas as pd
from sklearn.preprocessing import StandardScaler

FEATURE_COLUMNS = [
    "event_count", "distinct_actions", "distinct_resources", "avg_latency", 
    "max_latency", "std_latency", "error_count", "error_rate", "hour_of_day", 
    "is_off_hours", "rate_action_read", "rate_action_write", "rate_action_admin", 
    "unique_ips", "ip_entropy", "latency_p95", "latency_p99", "action_entropy", 
    "resource_entropy", "max_sensitivity_level", "metadata_key_count", 
    "mean_latency_growth", "burst_factor", "consecutive_errors", "payload_anomaly_match"
]

class Preprocessor:
    def __init__(self):
        self.scaler = StandardScaler()

    def fit(self, features_df: pd.DataFrame) -> None:
        """
        Fits the StandardScaler on training dataset features.
        """
        if features_df.empty:
            return
        self.scaler.fit(features_df[FEATURE_COLUMNS])

    def transform(self, features_df: pd.DataFrame) -> pd.DataFrame:
        """
        Transforms the features_df in-place using the fitted scaler.
        """
        if features_df.empty:
            return features_df
            
        scaled_data = self.scaler.transform(features_df[FEATURE_COLUMNS])
        transformed_df = features_df.copy()
        transformed_df[FEATURE_COLUMNS] = scaled_data
        return transformed_df

    def transform_array(self, features_array: pd.DataFrame) -> pd.DataFrame:
        """
        Transforms raw numpy features directly.
        """
        return self.scaler.transform(features_array)

    def save(self, file_path: str) -> None:
        """
        Saves the fitted preprocessor scaler.
        """
        joblib.dump(self.scaler, file_path)

    def load(self, file_path: str) -> None:
        """
        Loads the preprocessor scaler.
        """
        self.scaler = joblib.load(file_path)
