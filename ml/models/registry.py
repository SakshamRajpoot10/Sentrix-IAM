# 🧠 SENTRIX — Model Registry
# Manages versioning and loading of models on service start

import os
import joblib
import torch
import json
import logging
from ml.models.lstm_autoencoder import LSTMAutoencoder
from ml.models.isolation_forest import IsolationForestModel

logger = logging.getLogger("sentrix.ml.registry")

class ModelRegistry:
    def __init__(self, saved_dir: str = "ml/models/saved"):
        self.saved_dir = saved_dir
        self.scaler = None
        self.isolation_forest = None
        self.lstm_autoencoder = None
        self.metadata = {}

    def load_all_models(self) -> bool:
        """
        Loads preprocessor scaler, Isolation Forest, and LSTM Autoencoder from saved directory.
        """
        logger.info(f"Loading ML models from '{self.saved_dir}'...")
        if not os.path.exists(self.saved_dir):
            logger.warning(f"Saved model directory '{self.saved_dir}' does not exist.")
            return False
            
        try:
            scaler_path = os.path.join(self.saved_dir, "scaler.joblib")
            if_path = os.path.join(self.saved_dir, "isolation_forest.joblib")
            lstm_path = os.path.join(self.saved_dir, "lstm_autoencoder.pt")
            meta_path = os.path.join(self.saved_dir, "metadata.json")
            
            # Load scaler
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
                logger.info("Scaler loaded successfully.")
            else:
                logger.warning("Scaler scaler.joblib not found.")
                return False
                
            # Load Isolation Forest
            if os.path.exists(if_path):
                self.isolation_forest = IsolationForestModel()
                self.isolation_forest.load(if_path)
                logger.info("Isolation Forest loaded successfully.")
            else:
                logger.warning("Isolation Forest isolation_forest.joblib not found.")
                return False
                
            # Load LSTM Autoencoder
            if os.path.exists(lstm_path):
                device = torch.device("cpu")
                checkpoint = torch.load(lstm_path, map_location=device, weights_only=False)
                
                # Retrieve parameters or defaults
                n_features = checkpoint.get("n_features", 25)
                hidden_size = checkpoint.get("hidden_size", 128)
                latent_size = checkpoint.get("latent_size", 64)
                
                self.lstm_autoencoder = LSTMAutoencoder(
                    n_features=n_features,
                    hidden_size=hidden_size,
                    latent_size=latent_size
                )
                self.lstm_autoencoder.load_state_dict(checkpoint["model_state_dict"])
                self.lstm_autoencoder.eval()
                logger.info("LSTM Autoencoder loaded successfully.")
            else:
                logger.warning("LSTM Autoencoder lstm_autoencoder.pt not found.")
                return False
                
            # Load Metadata
            if os.path.exists(meta_path):
                with open(meta_path, 'r') as f:
                    self.metadata = json.load(f)
                logger.info("Model metadata loaded.")
                
            return True
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            return False

    def is_healthy(self) -> bool:
        """
        Returns True if all models are loaded.
        """
        return (
            self.scaler is not None and
            self.isolation_forest is not None and
            self.lstm_autoencoder is not None
        )
