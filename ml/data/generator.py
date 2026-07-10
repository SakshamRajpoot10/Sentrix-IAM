# 🧠 SENTRIX — Synthetic Event Generator
# Generates synthetic agent events to train the Isolation Forest and LSTM Autoencoder

import uuid
import random
from datetime import datetime, timedelta
import pandas as pd
from ml.data.profiles import AGENT_PROFILES
from ml.data.anomaly_scenarios import ANOMALY_SCENARIOS

def generate_synthetic_data(num_events=500000, anomaly_ratio=0.05):
    """
    Generates a DataFrame of synthetic behavioral events.
    95% normal data adhering to the 8 agent profiles.
    5% anomalous data from the 10 anomaly scenarios.
    """
    print(f"🏭 Starting synthetic data generation ({num_events} events, anomaly ratio: {anomaly_ratio})...")
    events = []
    
    # Calculate counts
    num_anomalies = int(num_events * anomaly_ratio)
    num_normal = num_events - num_anomalies
    
    # Create mock agent IDs for each profile
    agent_ids = {profile_key: str(uuid.uuid4()) for profile_key in AGENT_PROFILES.keys()}
    
    # Generate Normal events
    start_time = datetime.now() - timedelta(days=14)
    time_delta = timedelta(days=14) / num_normal
    
    current_time = start_time
    for i in range(num_normal):
        # Pick a random profile
        profile_key = random.choice(list(AGENT_PROFILES.keys()))
        profile = AGENT_PROFILES[profile_key]
        agent_id = agent_ids[profile_key]
        
        # Advance time slightly
        current_time += time_delta
        
        # Generate within active hours
        hour = current_time.hour
        if hour not in profile["active_hours"]:
            # Shift time to allowed hour range
            allowed_hour = random.choice(list(profile["active_hours"]))
            current_time = current_time.replace(hour=allowed_hour)
            
        action = random.choice(profile["allowed_actions"])
        resource = random.choice(profile["allowed_resources"]).replace("*", str(random.randint(100, 999)))
        
        # Latency with standard deviation
        latency = max(5, int(random.normalvariate(profile["avg_latency_ms"], profile["avg_latency_ms"] * 0.2)))
        
        events.append({
            "id": str(uuid.uuid4()),
            "agent_id": agent_id,
            "event_type": "api_call",
            "action": action,
            "resource": resource,
            "outcome": "success",
            "latency_ms": latency,
            "metadata": {"profile": profile_key, "ip": f"192.168.1.{random.randint(10, 250)}"},
            "created_at": current_time.isoformat(),
            "is_anomaly": False
        })

    # Generate Anomalous events
    # Injected randomly throughout the timeline
    anomaly_times = [start_time + random.random() * timedelta(days=14) for _ in range(num_anomalies)]
    
    for i in range(num_anomalies):
        # Pick a random profile to attach anomaly to
        profile_key = random.choice(list(AGENT_PROFILES.keys()))
        agent_id = agent_ids[profile_key]
        
        # Pick a random anomaly scenario
        scenario_key = random.choice(list(ANOMALY_SCENARIOS.keys()))
        scenario = ANOMALY_SCENARIOS[scenario_key]
        
        # Use generated timeline time
        created_time = anomaly_times[i]
        
        events.append({
            "id": str(uuid.uuid4()),
            "agent_id": agent_id,
            "event_type": "anomaly",
            "action": scenario["action"],
            "resource": scenario["resource"],
            "outcome": "denied" if random.random() > 0.3 else "success",
            "latency_ms": scenario["latency_ms"],
            "metadata": {**scenario.get("metadata", {}), "scenario": scenario_key},
            "created_at": created_time.isoformat(),
            "is_anomaly": True
        })
        
    df = pd.DataFrame(events)
    # Sort chronologically
    df['created_at_dt'] = pd.to_datetime(df['created_at'])
    df = df.sort_values('created_at_dt').drop('created_at_dt', axis=1)
    
    print("✅ Generation complete.")
    return df

if __name__ == "__main__":
    df = generate_synthetic_data(10000)
    print(df.head())
    print(df["is_anomaly"].value_counts())
