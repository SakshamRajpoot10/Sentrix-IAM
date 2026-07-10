# 🧠 SENTRIX — Full SDK Integration Test Script
# Verifies end-to-end flow: admin register/login, agent CRUD, policy assignment, 
# SDK authorize decisions (ALLOW/DENY), database anomalies insertion, ML prediction, 
# and automatic agent suspension on high risk (>= 0.80).

import os
import sys
import uuid
import time
import requests
import psycopg2
from datetime import datetime, timedelta

# Ensure we can import from sentrix module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from sentrix import SentrixClient

BACKEND_URL = "http://localhost:8080"
ML_SERVICE_URL = "http://localhost:8000"
ML_API_KEY = "sentrix-ml-internal-key"

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "sentrix",
    "user": "postgres",
    "password": ""
}

def register_or_login_admin():
    print("🔑 Registering or logging in Admin user...")
    register_url = f"{BACKEND_URL}/api/v1/auth/register"
    payload = {
        "firstName": "Integration",
        "lastName": "Test",
        "email": "test-integration@sentrix.com",
        "password": "Password123!",
        "organizationName": "IntegrationOrg"
    }
    
    try:
        res = requests.post(register_url, json=payload, timeout=10)
        if res.status_code in [200, 201]:
            print("✅ Admin registered successfully.")
            return res.json()["accessToken"]
    except Exception as e:
        print(f"Registration request failed: {e}")

    # Fallback to login
    print("👤 Admin already exists or registration failed, attempting login...")
    login_url = f"{BACKEND_URL}/api/v1/auth/login"
    payload = {
        "email": "test-integration@sentrix.com",
        "password": "Password123!"
    }
    
    res = requests.post(login_url, json=payload, timeout=10)
    if res.status_code == 200:
        print("✅ Admin logged in successfully.")
        return res.json()["accessToken"]
    else:
        raise RuntimeError(f"Admin authentication failed: {res.text}")

def create_agent(token):
    print("🤖 Creating a new Test Agent...")
    url = f"{BACKEND_URL}/api/v1/agents"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "IntegrationAgent",
        "description": "Agent for running integration tests",
        "type": "AUTONOMOUS",
        "maxActionsPerMinute": 100,
        "allowedIpRanges": ["127.0.0.1"],
        "metadata": {}
    }
    
    res = requests.post(url, headers=headers, json=payload, timeout=10)
    if res.status_code in [200, 201]:
        data = res.json()
        agent_id = data["id"]
        api_key = data["apiKey"]
        print(f"✅ Agent created successfully. ID: {agent_id}")
        return agent_id, api_key
    else:
        raise RuntimeError(f"Failed to create agent: {res.text}")

def create_deny_policy(token):
    print("📜 Creating a DENY Policy for database:prod:* WRITE...")
    url = f"{BACKEND_URL}/api/v1/policies"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "Block Database Write Policy",
        "description": "Denies write actions to database:prod:*",
        "effect": "DENY",
        "enforcement": "ENFORCING",
        "priority": 100,
        "rules": [
            {
                "actions": ["WRITE", "DELETE"],
                "resources": ["database:prod:*"]
            }
        ],
        "conditions": {}
    }
    
    res = requests.post(url, headers=headers, json=payload, timeout=10)
    if res.status_code in [200, 201]:
        policy_id = res.json()["id"]
        print(f"✅ DENY Policy created successfully. ID: {policy_id}")
        return policy_id
    else:
        raise RuntimeError(f"Failed to create DENY policy: {res.text}")

def create_allow_policy(token):
    print("📜 Creating an ALLOW Policy for database:prod:* READ...")
    url = f"{BACKEND_URL}/api/v1/policies"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "Allow Database Read Policy",
        "description": "Allows read actions to database:prod:*",
        "effect": "ALLOW",
        "enforcement": "ENFORCING",
        "priority": 200,
        "rules": [
            {
                "actions": ["READ"],
                "resources": ["database:prod:*"]
            }
        ],
        "conditions": {}
    }
    
    res = requests.post(url, headers=headers, json=payload, timeout=10)
    if res.status_code in [200, 201]:
        policy_id = res.json()["id"]
        print(f"✅ ALLOW Policy created successfully. ID: {policy_id}")
        return policy_id
    else:
        raise RuntimeError(f"Failed to create ALLOW policy: {res.text}")

def assign_policy_to_agent(token, policy_id, agent_id):
    print(f"🔗 Assigning Policy {policy_id} to Agent {agent_id}...")
    url = f"{BACKEND_URL}/api/v1/policies/{policy_id}/agents/{agent_id}"
    headers = {"Authorization": f"Bearer {token}"}
    
    res = requests.post(url, headers=headers, json={}, timeout=10)
    if res.status_code == 200:
        print("✅ Policy assigned successfully.")
    else:
        raise RuntimeError(f"Failed to assign policy to agent: {res.text}")

def insert_anomalous_events(agent_id):
    print("💾 Inserting anomalous events directly into the database...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    now = datetime.now()
    # We insert 25 anomalous events spaced 10 seconds apart to form a sequence of length 25
    events_to_insert = []
    for i in range(25):
        event_id = str(uuid.uuid4())
        created_at = now - timedelta(seconds=(25 - i) * 10)
        # Using sys:execute_command with malicious command metadata and huge latency
        action = "sys:execute_command"
        resource = "system:local:bin_sh"
        outcome = "ALLOWED"
        latency_ms = 15000  # 15 seconds
        metadata_json = '{"cmd": "rm -rf /", "reason": "escalate", "ip": "85.203.47.12"}'
        
        events_to_insert.append((
            event_id,
            agent_id,
            "AUTHORIZATION",
            action,
            resource,
            outcome,
            latency_ms,
            metadata_json,
            created_at
        ))
        
    try:
        cur.executemany("""
            INSERT INTO behavioral_events (id, agent_id, event_type, action, resource, outcome, latency_ms, metadata, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, events_to_insert)
        conn.commit()
        print(f"✅ Inserted {len(events_to_insert)} anomalous events successfully.")
    except Exception as e:
        conn.rollback()
        raise RuntimeError(f"Failed to insert events: {e}")
    finally:
        cur.close()
        conn.close()

def trigger_ml_prediction(agent_id):
    print(f"🧠 Triggering ML prediction for Agent {agent_id}...")
    url = f"{ML_SERVICE_URL}/predict"
    headers = {"X-API-Key": ML_API_KEY}
    payload = {"agent_id": agent_id}
    
    res = requests.post(url, headers=headers, json=payload, timeout=10)
    if res.status_code == 200:
        data = res.json()
        risk_score = data["risk_score"]
        print(f"✅ ML Prediction completed. Risk Score: {risk_score} (Anomaly: {data['is_anomaly']}, Severity: {data['severity']})")
        return risk_score
    else:
        raise RuntimeError(f"ML prediction request failed: {res.text}")

def get_agent_status_db(agent_id):
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT status, risk_score FROM agents WHERE id = %s", (agent_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row

def run_test():
    print("=" * 60)
    print("🚦 STARTING SENTRIX E2E INTEGRATION TEST")
    print("=" * 60)
    
    try:
        # Step 1: Login or Register Admin
        token = register_or_login_admin()
        
        # Step 2: Create Agent
        agent_id, api_key = create_agent(token)
        
        # Step 3: Create Policies
        deny_policy_id = create_deny_policy(token)
        allow_policy_id = create_allow_policy(token)
        
        # Step 4: Assign Policies
        assign_policy_to_agent(token, deny_policy_id, agent_id)
        assign_policy_to_agent(token, allow_policy_id, agent_id)
        
        # Step 5: Test Python SDK Client
        print("\n🐍 Initializing Python SDK Client...")
        client = SentrixClient(base_url=BACKEND_URL, api_key=api_key)
        
        print("Authenticating SDK Client...")
        auth_success = client.authenticate()
        if not auth_success:
            raise RuntimeError("SDK Authentication failed.")
        print("✅ SDK Authenticated successfully.")
        
        # Step 6: Test Authorization Decisions
        print("\n🛡️ Testing policy engine rules...")
        # WRITE is blocked
        decision_write = client.authorize(action="WRITE", resource="database:prod:users")
        print(f"Request: WRITE to database:prod:users")
        print(f"Decision: Allowed={decision_write.allowed}, Data={decision_write.response_data}")
        if decision_write.allowed:
            raise RuntimeError("Policy failure: WRITE was ALLOWED but should be DENIED!")
        print("✅ Policy check passed (WRITE is blocked).")
        
        # READ is allowed
        decision_read = client.authorize(action="READ", resource="database:prod:users")
        print(f"Request: READ to database:prod:users")
        print(f"Decision: Allowed={decision_read.allowed}, Data={decision_read.response_data}")
        if not decision_read.allowed:
            raise RuntimeError("Policy failure: READ was DENIED but should be ALLOWED!")
        print("✅ Policy check passed (READ is allowed).")
        
        # Step 7: Simulate Anomaly and Score
        print("\n⚠️ Simulating anomaly scenario...")
        insert_anomalous_events(agent_id)
        risk_score = trigger_ml_prediction(agent_id)
        
        if risk_score < 0.80:
            raise RuntimeError(f"Anomaly simulation failed: risk score {risk_score} is below threshold 0.80.")
            
        print("\n🚀 Verification of Auto-Revoke / Suspension...")
        print("Sending another SDK authorize call which should trigger backend auto-revoke...")
        try:
            # This call should return DENIED and also trigger the suspension logic on the backend
            decision_after_risk = client.authorize(action="READ", resource="database:prod:users")
            print(f"Request (after high risk): READ to database:prod:users")
            print(f"Decision: Allowed={decision_after_risk.allowed}, Data={decision_after_risk.response_data}")
        except Exception as e:
            print(f"SDK call threw expected exception/error: {e}")
            
        # Verify status in database
        time.sleep(1) # Give db a tiny moment
        status, db_risk = get_agent_status_db(agent_id)
        print(f"\n📊 Current Database Status for Agent {agent_id}:")
        print(f"  Risk Score: {db_risk}")
        print(f"  Status: {status}")
        
        if status != "SUSPENDED":
            raise RuntimeError(f"E2E Test Failed: Agent status is '{status}', expected 'SUSPENDED'!")
            
        print("\n✅ E2E Test Verification: Agent successfully auto-suspended and sessions revoked.")
        
        # Verify subsequent call is blocked
        print("Verifying that subsequent calls are rejected...")
        decision_final = client.authorize(action="READ", resource="database:prod:users")
        if decision_final.allowed:
            raise RuntimeError("Security breach: suspended agent was allowed to make requests!")
        print("✅ Subsequent call blocked as expected.")
        
        print("\n" + "=" * 60)
        print("🎉 INTEGRATION TEST PASSED SUCCESSFULLY!")
        print("=" * 60)
        
    except Exception as e:
        print("\n" + "x" * 60)
        print(f"❌ INTEGRATION TEST FAILED!")
        print(f"Error details: {e}")
        print("x" * 60)
        sys.exit(1)

if __name__ == "__main__":
    run_test()
