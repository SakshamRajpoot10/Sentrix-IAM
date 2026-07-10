# 🧠 SENTRIX — Feature Extractor
# Extracts 25 numeric features from rolling 5-minute event logs

import numpy as np
import pandas as pd
from collections import Counter

SENSITIVITY_MAP = {
    "PUBLIC": 0,
    "INTERNAL": 1,
    "CONFIDENTIAL": 2,
    "RESTRICTED": 3,
    "CRITICAL": 4
}

class FeatureExtractor:
    def __init__(self):
        pass

    def extract_features(self, events_df: pd.DataFrame, window_minutes: int = 5) -> pd.DataFrame:
        """
        Extracts 25 feature dimensions from event logs.
        Aggregates logs in rolling windows.
        """
        if events_df.empty:
            return pd.DataFrame()
            
        # Ensure datetimes are parsed
        events_df['created_at_dt'] = pd.to_datetime(events_df['created_at'])
        events_df = events_df.sort_values('created_at_dt')
        
        # We will group events by rolling windows of window_minutes
        # For training, we group by agent_id and resample
        features_list = []
        
        for agent_id, group in events_df.groupby('agent_id'):
            # Resample into 5-minute windows
            group = group.set_index('created_at_dt')
            resampled = group.resample(f'{window_minutes}min')
            
            for window_start, win_data in resampled:
                if win_data.empty:
                    continue
                    
                features = self._extract_single_window(win_data, window_start, agent_id)
                features_list.append(features)
                
        if not features_list:
            return pd.DataFrame()
            
        return pd.DataFrame(features_list)

    def _extract_single_window(self, win_data: pd.DataFrame, window_start, agent_id: str) -> dict:
        total_events = len(win_data)
        
        # Outcomes
        outcomes = win_data['outcome'].astype(str).str.lower().tolist()
        error_count = sum(1 for o in outcomes if o not in ['success', 'allowed'])
        error_rate = error_count / total_events if total_events > 0 else 0.0
        
        # Latency metrics
        latencies = win_data['latency_ms'].fillna(0).tolist()
        avg_latency = np.mean(latencies) if latencies else 0.0
        max_latency = np.max(latencies) if latencies else 0.0
        std_latency = np.std(latencies) if latencies else 0.0
        latency_p95 = np.percentile(latencies, 95) if latencies else 0.0
        latency_p99 = np.percentile(latencies, 99) if latencies else 0.0
        
        # Unique dimensions
        actions = win_data['action'].astype(str).tolist()
        resources = win_data['resource'].astype(str).tolist()
        distinct_actions = len(set(actions))
        distinct_resources = len(set(resources))
        
        # Action types
        read_keywords = ['read', 'get', 'list', 'search', 'check', 'view']
        write_keywords = ['write', 'create', 'update', 'submit', 'post', 'save', 'reconcile']
        admin_keywords = ['delete', 'policy', 'deploy', 'build', 'config', 'execute', 'admin']
        
        rate_action_read = sum(1 for a in actions if any(k in a.lower() for k in read_keywords)) / total_events
        rate_action_write = sum(1 for a in actions if any(k in a.lower() for k in write_keywords)) / total_events
        rate_action_admin = sum(1 for a in actions if any(k in a.lower() for k in admin_keywords)) / total_events
        
        # Unique IPs
        ips = []
        for metadata in win_data['metadata']:
            if isinstance(metadata, dict) and 'ip' in metadata:
                ips.append(metadata['ip'])
            elif isinstance(metadata, dict) and 'ip_override' in metadata:
                ips.append(metadata['ip_override'])
        if not ips:
            ips = ['127.0.0.1']
        unique_ips = len(set(ips))
        
        # IP Entropy
        ip_counts = Counter(ips)
        ip_probs = [count / len(ips) for count in ip_counts.values()]
        ip_entropy = -sum(p * np.log2(p) for p in ip_probs)
        
        # Action & Resource Entropy
        act_counts = Counter(actions)
        act_probs = [count / len(actions) for count in act_counts.values()]
        action_entropy = -sum(p * np.log2(p) for p in act_probs)
        
        res_counts = Counter(resources)
        res_probs = [count / len(resources) for count in res_counts.values()]
        resource_entropy = -sum(p * np.log2(p) for p in res_probs)
        
        # Time of day
        hours = win_data.index.hour.tolist()
        mean_hour = np.mean(hours) if hours else 12.0
        is_off_hours = sum(1 for h in hours if h < 9 or h > 18) / total_events if total_events > 0 else 0.0
        
        # Max Sensitivity Level
        sensitivity_vals = []
        for res in resources:
            # simple check for sensitivity levels in resource identifier
            level = "INTERNAL"
            if "public" in res.lower():
                level = "PUBLIC"
            elif "confidential" in res.lower() or "metrics" in res.lower():
                level = "CONFIDENTIAL"
            elif "restricted" in res.lower() or "candidate" in res.lower() or "invoice" in res.lower():
                level = "RESTRICTED"
            elif "critical" in res.lower() or "vault" in res.lower() or "ec2" in res.lower() or "admin" in res.lower():
                level = "CRITICAL"
            sensitivity_vals.append(SENSITIVITY_MAP.get(level, 1))
        max_sensitivity = max(sensitivity_vals) if sensitivity_vals else 1
        
        # Metadata keys count
        metadata_keys = []
        for metadata in win_data['metadata']:
            if isinstance(metadata, dict):
                metadata_keys.extend(metadata.keys())
        metadata_key_count = len(set(metadata_keys))
        
        # Burst factor (max requests in a single 1-minute window within the 5-minute slot)
        min_resampled = win_data.resample('1min').count()
        burst_factor = int(min_resampled['action'].max()) if not min_resampled.empty else total_events
        
        # Consecutive errors
        consecutive_errors = 0
        current_consec = 0
        for o in outcomes:
            if o not in ['success', 'allowed']:
                current_consec += 1
                consecutive_errors = max(consecutive_errors, current_consec)
            else:
                current_consec = 0
                
        # Payload Anomaly Match (suspicious keywords in metadata)
        payload_anomaly_matches = 0
        suspicious_words = ['override', 'rm ', 'sudo', 'exec', 'injection', 'escalate', 'flood', 'proxy']
        for metadata in win_data['metadata']:
            if isinstance(metadata, dict):
                str_rep = str(metadata).lower()
                if any(w in str_rep for w in suspicious_words):
                    payload_anomaly_matches += 1
        payload_anomaly_rate = payload_anomaly_matches / total_events
        
        # Latency growth index (mean latency / 100ms baseline ratio)
        mean_latency_growth = avg_latency / 100.0
        
        # Anomaly label (for training evaluation)
        is_anomaly_window = win_data['is_anomaly'].any() if 'is_anomaly' in win_data.columns else False

        return {
            "window_start": window_start,
            "agent_id": agent_id,
            "event_count": total_events,
            "distinct_actions": distinct_actions,
            "distinct_resources": distinct_resources,
            "avg_latency": avg_latency,
            "max_latency": max_latency,
            "std_latency": std_latency,
            "error_count": error_count,
            "error_rate": error_rate,
            "hour_of_day": mean_hour,
            "is_off_hours": is_off_hours,
            "rate_action_read": rate_action_read,
            "rate_action_write": rate_action_write,
            "rate_action_admin": rate_action_admin,
            "unique_ips": unique_ips,
            "ip_entropy": ip_entropy,
            "latency_p95": latency_p95,
            "latency_p99": latency_p99,
            "action_entropy": action_entropy,
            "resource_entropy": resource_entropy,
            "max_sensitivity_level": max_sensitivity,
            "metadata_key_count": metadata_key_count,
            "mean_latency_growth": mean_latency_growth,
            "burst_factor": burst_factor,
            "consecutive_errors": consecutive_errors,
            "payload_anomaly_match": payload_anomaly_rate,
            "is_anomaly": is_anomaly_window
        }
