# 🧠 SENTRIX — LSTM Autoencoder PyTorch Architecture
# Detects temporal sequences of anomalies based on reconstruction errors

import torch
import torch.nn as nn
import numpy as np

class LSTMAutoencoder(nn.Module):
    def __init__(self, n_features: int = 25, hidden_size: int = 128, latent_size: int = 64):
        super(LSTMAutoencoder, self).__init__()
        self.n_features = n_features
        self.hidden_size = hidden_size
        self.latent_size = latent_size

        # Encoder: compresses input sequences
        self.encoder = nn.LSTM(
            input_size=n_features,
            hidden_size=hidden_size,
            num_layers=1,
            batch_first=True
        )
        self.encoder_linear = nn.Linear(hidden_size, latent_size)

        # Decoder: reconstructs compressed sequence back to original space
        self.decoder_linear = nn.Linear(latent_size, hidden_size)
        self.decoder = nn.LSTM(
            input_size=hidden_size,
            hidden_size=hidden_size,
            num_layers=1,
            batch_first=True
        )
        self.reconstruct_linear = nn.Linear(hidden_size, n_features)

    def forward(self, x):
        # Input shape x: (batch_size, sequence_length, n_features)
        seq_len = x.size(1)
        
        # Encode
        enc_out, (hn, cn) = self.encoder(x)
        # hn shape: (num_layers, batch_size, hidden_size)
        latent = torch.relu(self.encoder_linear(hn[-1])) # shape: (batch_size, latent_size)
        
        # Decode
        dec_in = torch.relu(self.decoder_linear(latent)) # shape: (batch_size, hidden_size)
        # Repeat decoder input for each time step
        dec_in = dec_in.unsqueeze(1).repeat(1, seq_len, 1) # shape: (batch_size, seq_len, hidden_size)
        
        dec_out, _ = self.decoder(dec_in)
        reconstruction = self.reconstruct_linear(dec_out) # shape: (batch_size, seq_len, n_features)
        
        return reconstruction

def train_lstm_autoencoder(model, train_loader, val_loader, epochs=50, lr=1e-3, device="cpu"):
    """
    Trains the LSTM Autoencoder using Reconstruction MSE Loss.
    """
    model.to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.MSELoss()
    
    best_val_loss = float('inf')
    patience = 5
    patience_counter = 0
    
    print(f"🏋️ Training LSTM Autoencoder on device: {device}...")
    for epoch in range(epochs):
        model.train()
        train_losses = []
        
        for (batch_x,) in train_loader:
            batch_x = batch_x.to(device).float()
            
            optimizer.zero_grad()
            reconstructed = model(batch_x)
            loss = criterion(reconstructed, batch_x)
            
            loss.backward()
            optimizer.step()
            
            train_losses.append(loss.item())
            
        # Validation
        model.eval()
        val_losses = []
        with torch.no_grad():
            for (batch_val_x,) in val_loader:
                batch_val_x = batch_val_x.to(device).float()
                reconstructed_val = model(batch_val_x)
                val_loss = criterion(reconstructed_val, batch_val_x)
                val_losses.append(val_loss.item())
                
        mean_train = np.mean(train_losses)
        mean_val = np.mean(val_losses)
        
        print(f"Epoch {epoch+1}/{epochs} | Train Loss: {mean_train:.6f} | Val Loss: {mean_val:.6f}")
        
        # Early stopping
        if mean_val < best_val_loss:
            best_val_loss = mean_val
            patience_counter = 0
            # Save checkpoint state in memory or standard path
            best_state = model.state_dict()
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print("Early stopping triggered.")
                break
                
    model.load_state_dict(best_state)
    return model

def compute_reconstruction_errors(model, sequences_np: np.ndarray, device="cpu") -> np.ndarray:
    """
    Computes reconstruction error (MSE) for each input sequence.
    """
    model.to(device)
    model.eval()
    
    sequences_tensor = torch.tensor(sequences_np, dtype=torch.float32).to(device)
    with torch.no_grad():
        reconstructed = model(sequences_tensor)
        # Calculate mean squared error across time steps and features for each sequence sample
        mse = torch.mean((reconstructed - sequences_tensor) ** 2, dim=(1, 2))
        
    return mse.cpu().numpy()
