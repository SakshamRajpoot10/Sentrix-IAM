# 🧠 SENTRIX — Agent Profile Definitions
# Defines 8 typical normal behavior profiles for AI agents

AGENT_PROFILES = {
    "customer_support": {
        "name": "Customer Support Agent",
        "description": "Handles general client queries, reads user context, calls external search API.",
        "allowed_actions": ["kb:search", "user:get_profile", "chat:send_message", "feedback:submit"],
        "allowed_resources": ["kb:help_center:*", "user:profiles:*", "chat:sessions:*"],
        "avg_events_per_five_min": 15,
        "avg_latency_ms": 120,
        "active_hours": range(0, 24), # 24/7 coverage
        "max_sensitivity": "INTERNAL"
    },
    "sales_assistant": {
        "name": "Sales Assistant Agent",
        "description": "Fetches product catalogs, checks stock levels, logs lead details.",
        "allowed_actions": ["product:list", "stock:check", "crm:create_lead", "email:send_quote"],
        "allowed_resources": ["products:catalog:*", "inventory:stock:*", "crm:leads:*"],
        "avg_events_per_five_min": 8,
        "avg_latency_ms": 180,
        "active_hours": range(8, 20), # Business hours
        "max_sensitivity": "INTERNAL"
    },
    "data_miner": {
        "name": "Analytical Data Miner",
        "description": "Reads historical reports, aggregates metrics, performs low-frequency calculations.",
        "allowed_actions": ["db:execute_query", "metrics:export", "reports:generate"],
        "allowed_resources": ["postgres:metrics:*", "reports:historical:*"],
        "avg_events_per_five_min": 4,
        "avg_latency_ms": 1500, # Heavy computations
        "active_hours": list(range(22, 24)) + list(range(0, 6)), # Off-peak hours (cross-midnight)
        "max_sensitivity": "CONFIDENTIAL"
    },
    "hr_compliance": {
        "name": "HR Compliance Reviewer",
        "description": "Reviews candidate resumes, logs compliance approvals.",
        "allowed_actions": ["hr:read_resume", "hr:approve_compliance", "feedback:submit"],
        "allowed_resources": ["hr:candidates:*", "compliance:logs:*"],
        "avg_events_per_five_min": 6,
        "avg_latency_ms": 250,
        "active_hours": range(9, 18),
        "max_sensitivity": "RESTRICTED" # PII data
    },
    "finance_reconciler": {
        "name": "Finance Reconciliation Bot",
        "description": "Processes invoices, checks transaction logs, updates payment states.",
        "allowed_actions": ["invoice:read", "payment:check_status", "invoice:reconcile"],
        "allowed_resources": ["billing:invoices:*", "payments:logs:*"],
        "avg_events_per_five_min": 10,
        "avg_latency_ms": 300,
        "active_hours": range(6, 18),
        "max_sensitivity": "RESTRICTED"
    },
    "it_ops_monitor": {
        "name": "IT Operations Monitor",
        "description": "Checks system health logs, reports node statuses.",
        "allowed_actions": ["sys:check_health", "sys:read_logs", "sys:report_status"],
        "allowed_resources": ["infrastructure:nodes:*", "logs:syslog:*"],
        "avg_events_per_five_min": 30, # High frequency heartbeat
        "avg_latency_ms": 50,
        "active_hours": range(0, 24),
        "max_sensitivity": "INTERNAL"
    },
    "marketing_scheduler": {
        "name": "Social Marketing Scheduler",
        "description": "Drafts posts, schedules campaigns, reads post engagement analytics.",
        "allowed_actions": ["campaign:create", "post:schedule", "analytics:read_engagement"],
        "allowed_resources": ["social:campaigns:*", "social:posts:*", "analytics:marketing:*"],
        "avg_events_per_five_min": 5,
        "avg_latency_ms": 400,
        "active_hours": range(8, 22),
        "max_sensitivity": "PUBLIC"
    },
    "devops_deployer": {
        "name": "DevOps Deployment Automator",
        "description": "Runs build scripts, triggers deployments, updates configs.",
        "allowed_actions": ["build:trigger", "deploy:trigger", "config:update"],
        "allowed_resources": ["builds:pipelines:*", "deployments:configs:*"],
        "avg_events_per_five_min": 3,
        "avg_latency_ms": 800,
        "active_hours": range(0, 24),
        "max_sensitivity": "CONFIDENTIAL"
    }
}
