# 🧠 SENTRIX — Time-series Sequence Builder
# Constructs 20-step sliding window sequences for LSTM Autoencoder model

import numpy as np
import pandas as pd

class SequenceBuilder:
    def __init__(self, sequence_length: int = 20, n_features: int = 25):
        self.sequence_length = sequence_length
        self.n_features = n_features

    def build_sequences(self, features_df: pd.DataFrame, feature_cols: list) -> tuple:
        """
        Builds temporal sliding window sequences of shape (samples, sequence_length, n_features).
        Returns (sequences, labels, agent_ids).
        """
        sequences = []
        labels = []
        agent_ids = []
        
        # Ensure we sort by window_start for chronological sequences
        features_df = features_df.sort_values(['agent_id', 'window_start'])
        
        for agent_id, group in features_df.groupby('agent_id'):
            # Convert feature columns to numpy array
            data = group[feature_cols].values
            anomaly_labels = group['is_anomaly'].values
            
            # If the group has fewer windows than sequence_length, pad it with zeros at the beginning
            if len(data) < self.sequence_length:
                padding_len = self.sequence_length - len(data)
                padded_data = np.vstack([np.zeros((padding_len, self.n_features)), data])
                sequences.append(padded_data)
                # If any window in the sequence is anomalous, mark the sequence as anomalous
                labels.append(1 if np.any(anomaly_labels) else 0)
                agent_ids.append(agent_id)
            else:
                # Build sliding windows
                for idx in range(len(data) - self.sequence_length + 1):
                    win = data[idx : idx + self.sequence_length]
                    lbl = 1 if np.any(anomaly_labels[idx : idx + self.sequence_length]) else 0
                    
                    sequences.append(win)
                    labels.append(lbl)
                    agent_ids.append(agent_id)
                    
        if not sequences:
            return np.empty((0, self.sequence_length, self.n_features)), np.empty((0,)), []
            
        return np.array(sequences), np.array(labels), agent_ids

    def build_single_sequence(self, recent_features: np.ndarray) -> np.ndarray:
        """
        Prepares a single sliding window sequence of shape (1, sequence_length, n_features)
        from a history of features.
        Pads with zeros if history is too short.
        """
        # recent_features shape: (history_len, n_features)
        history_len = len(recent_features)
        
        if history_len >= self.sequence_length:
            seq = recent_features[-self.sequence_length:]
        else:
            padding_len = self.sequence_length - history_len
            seq = np.vstack([np.zeros((padding_len, self.n_features)), recent_features])
            
        return np.expand_dims(seq, axis=0) # Add batch dimension -> (1, seq_len, n_features)
