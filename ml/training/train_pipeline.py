# 🧠 SENTRIX — ML Training Pipeline
# Generates synthetic data, trains Isolation Forest + LSTM Autoencoder, and saves model checkpoints

import os
import json
import torch
from datetime import datetime
import numpy as np
import pandas as pd
from torch.utils.data import DataLoader, TensorDataset

from ml.data.generator import generate_synthetic_data
from ml.features.extractor import FeatureExtractor
from ml.features.preprocessor import Preprocessor, FEATURE_COLUMNS
from ml.features.sequence_builder import SequenceBuilder
from ml.models.isolation_forest import IsolationForestModel
from ml.models.lstm_autoencoder import LSTMAutoencoder, train_lstm_autoencoder, compute_reconstruction_errors

def run_training_pipeline(saved_dir="ml/models/saved", num_events=20000):
    """
    Executes the end-to-end model training process.
    """
    os.makedirs(saved_dir, exist_ok=True)
    print("🎬 Starting Sentrix ML Pipeline training...")

    # 1. Generate Synthetic Data
    # In production, this would query historical DB logs instead of synthetic data
    df = generate_synthetic_data(num_events=num_events, anomaly_ratio=0.05)
    
    # 2. Extract Features
    extractor = FeatureExtractor()
    features_df = extractor.extract_features(df)
    if features_df.empty:
        print("❌ Feature extraction yielded no features. Aborting.")
        return False
        
    print(f"📊 Extracted {len(features_df)} feature window windows.")

    # 3. Preprocess and Scale Features
    # Split into normal and anomalous for training (we train on normal only)
    normal_features = features_df[~features_df['is_anomaly']]
    anomalous_features = features_df[features_df['is_anomaly']]
    
    print(f"Normal windows: {len(normal_features)} | Anomalous windows: {len(anomalous_features)}")
    
    # Fit scaler on normal training data only (avoiding leakage)
    # We split normal data into train/val/test
    normal_indices = np.random.permutation(len(normal_features))
    train_split = int(0.8 * len(normal_features))
    val_split = int(0.9 * len(normal_features))
    
    normal_train = normal_features.iloc[normal_indices[:train_split]]
    normal_val = normal_features.iloc[normal_indices[train_split:val_split]]
    normal_test = normal_features.iloc[normal_indices[val_split:]]
    
    preprocessor = Preprocessor()
    preprocessor.fit(normal_train)
    
    # Transform all splits
    scaled_normal_train = preprocessor.transform(normal_train)
    scaled_normal_val = preprocessor.transform(normal_val)
    scaled_normal_test = preprocessor.transform(normal_test)
    scaled_anomalous = preprocessor.transform(anomalous_features)
    
    # Save scaler
    preprocessor.save(os.path.join(saved_dir, "scaler.joblib"))
    print("💾 Scaler saved.")

    # 4. Train Isolation Forest
    print("🌲 Training Isolation Forest...")
    if_model = IsolationForestModel(n_estimators=200, contamination=0.05)
    if_model.fit(scaled_normal_train[FEATURE_COLUMNS].values)
    if_model.save(os.path.join(saved_dir, "isolation_forest.joblib"))
    print("💾 Isolation Forest model saved.")

    # 5. Prepare Temporal Sequences for LSTM
    seq_builder = SequenceBuilder(sequence_length=20, n_features=25)
    
    # We build sequences for normal train, val, test and anomalous
    seq_train_x, _, _ = seq_builder.build_sequences(scaled_normal_train, FEATURE_COLUMNS)
    seq_val_x, _, _ = seq_builder.build_sequences(scaled_normal_val, FEATURE_COLUMNS)
    seq_test_x, _, _ = seq_builder.build_sequences(scaled_normal_test, FEATURE_COLUMNS)
    seq_anomaly_x, _, _ = seq_builder.build_sequences(scaled_anomalous, FEATURE_COLUMNS)
    
    print(f"Sequence dimensions: Train={seq_train_x.shape} | Val={seq_val_x.shape} | Test={seq_test_x.shape}")

    # Prepare PyTorch Dataloaders
    train_dataset = TensorDataset(torch.tensor(seq_train_x, dtype=torch.float32))
    val_dataset = TensorDataset(torch.tensor(seq_val_x, dtype=torch.float32))
    
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=64, shuffle=False)

    # 6. Train PyTorch LSTM Autoencoder
    lstm_model = LSTMAutoencoder(n_features=25, hidden_size=128, latent_size=64)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    trained_lstm = train_lstm_autoencoder(
        lstm_model, 
        train_loader, 
        val_loader, 
        epochs=30, 
        lr=1e-3, 
        device=device
    )
    
    # 7. Evaluate and Set Reconstruction Threshold (95th percentile of normal validation errors)
    val_mses = compute_reconstruction_errors(trained_lstm, seq_val_x, device=device)
    lstm_threshold = float(np.percentile(val_mses, 95))
    print(f"📊 Calculated LSTM Reconstruction Threshold (95th percentile): {lstm_threshold:.6f}")
    
    # 8. Save LSTM Autoencoder Checkpoint
    torch.save({
        "model_state_dict": trained_lstm.state_dict(),
        "n_features": 25,
        "hidden_size": 128,
        "latent_size": 64,
        "lstm_threshold": lstm_threshold
    }, os.path.join(saved_dir, "lstm_autoencoder.pt"))
    print("💾 LSTM Autoencoder checkpoint saved.")

    # 9. Save Metadata
    metadata = {
        "features": FEATURE_COLUMNS,
        "n_features": 25,
        "sequence_length": 20,
        "lstm_threshold": lstm_threshold,
        "trained_at": datetime.now().isoformat(),
        "training_samples": len(df),
        "train_loss_final": float(np.mean(val_mses))
    }
    with open(os.path.join(saved_dir, "metadata.json"), 'w') as f:
        json.dump(metadata, f, indent=2)
    print("💾 Model metadata saved.")
    
    print("🎉 Pipeline training complete! All checkpoints saved.")
    return True

if __name__ == "__main__":
    # Create smaller sample count for development speed
    run_training_pipeline(num_events=5000)
