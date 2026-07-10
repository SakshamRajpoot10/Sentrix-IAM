# 🧠 SENTRIX — Baseline Builder
# Builds statistical behavioral baselines for individual agents based on past events

import numpy as np
import pandas as pd
import json
import logging

logger = logging.getLogger("sentrix.ml.baseline")

class BaselineBuilder:
    def __init__(self, min_events_required: int = 50):
        self.min_events_required = min_events_required

    def compute_agent_baseline(self, events_df: pd.DataFrame) -> dict:
        """
        Computes a statistical baseline from an agent's event history.
        Returns a dict mapping features to mean/std values.
        """
        if events_df.empty:
            return {}
            
        total_events = len(events_df)
        if total_events < self.min_events_required:
            logger.info(f"Insufficient events ({total_events}/{self.min_events_required}) to compute baseline.")
            return {}

        # 1. Action distributions
        action_counts = events_df['action'].value_counts()
        action_probs = (action_counts / total_events).to_dict()

        # 2. Resource distributions
        resource_counts = events_df['resource'].value_counts()
        resource_probs = (resource_counts / total_events).to_dict()

        # 3. Latency statistics
        latencies = events_df['latency_ms'].dropna().values
        avg_latency = float(np.mean(latencies)) if len(latencies) > 0 else 100.0
        std_latency = float(np.std(latencies)) if len(latencies) > 0 else 20.0
        p95_latency = float(np.percentile(latencies, 95)) if len(latencies) > 0 else 200.0

        # 4. Hourly distribution
        events_df['created_at_dt'] = pd.to_datetime(events_df['created_at'])
        hours = events_df['created_at_dt'].dt.hour.values
        hour_counts = pd.Series(hours).value_counts()
        hour_probs = (hour_counts / len(hours)).to_dict()

        # 5. IP Address whitelist
        ips = []
        for metadata in events_df['metadata']:
            if isinstance(metadata, dict):
                if 'ip' in metadata:
                    ips.append(metadata['ip'])
                elif 'ip_override' in metadata:
                    ips.append(metadata['ip_override'])
        unique_ips = list(set(ips)) if ips else ["127.0.0.1"]

        baseline = {
            "total_training_events": total_events,
            "avg_latency_ms": avg_latency,
            "std_latency_ms": std_latency,
            "p95_latency_ms": p95_latency,
            "action_frequencies": {str(k): float(v) for k, v in action_probs.items()},
            "resource_frequencies": {str(k): float(v) for k, v in resource_probs.items()},
            "active_hours": {str(k): float(v) for k, v in hour_probs.items()},
            "associated_ips": unique_ips
        }
        
        return baseline
