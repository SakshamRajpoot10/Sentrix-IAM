-- ═══════════════════════════════════════════════════════════════
-- SENTRIX — V3: Seed Data
-- Default organization, system settings, and plan configurations
-- ═══════════════════════════════════════════════════════════════

-- ─── System Settings ────────────────────────────────────────
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('app.version', '1.0.0', 'Current application version'),
('app.maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('ml.auto_retrain_enabled', 'true', 'Enable automatic model retraining'),
('ml.retrain_interval_hours', '24', 'Hours between automatic retraining'),
('ml.anomaly_threshold', '0.7', 'Risk score threshold for anomaly classification'),
('ml.auto_revoke_threshold', '0.8', 'Risk score threshold for automatic agent revocation'),
('billing.trial_days', '14', 'Number of trial days for new organizations'),
('audit.hash_chain_genesis', 'SENTRIX_GENESIS_HASH_v1', 'Genesis hash for audit log chain'),
('security.max_failed_logins', '5', 'Maximum failed login attempts before lockout'),
('security.lockout_duration_minutes', '30', 'Account lockout duration in minutes');

-- ─── Plan Configurations (stored as system settings) ────────
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('plan.FREE.agent_limit', '5', 'Free plan: max active agents'),
('plan.FREE.policy_limit', '10', 'Free plan: max policies'),
('plan.FREE.api_call_limit', '10000', 'Free plan: max API calls/month'),
('plan.FREE.audit_retention_days', '7', 'Free plan: audit log retention'),
('plan.FREE.price_paise', '0', 'Free plan: monthly price in paise'),
('plan.PRO.agent_limit', '50', 'Pro plan: max active agents'),
('plan.PRO.policy_limit', '100', 'Pro plan: max policies'),
('plan.PRO.api_call_limit', '500000', 'Pro plan: max API calls/month'),
('plan.PRO.audit_retention_days', '90', 'Pro plan: audit log retention'),
('plan.PRO.price_paise', '499900', 'Pro plan: monthly price in paise (₹4,999)'),
('plan.ENTERPRISE.agent_limit', '999999', 'Enterprise plan: unlimited agents'),
('plan.ENTERPRISE.policy_limit', '999999', 'Enterprise plan: unlimited policies'),
('plan.ENTERPRISE.api_call_limit', '999999999', 'Enterprise plan: unlimited API calls'),
('plan.ENTERPRISE.audit_retention_days', '365', 'Enterprise plan: audit log retention'),
('plan.ENTERPRISE.price_paise', '2499900', 'Enterprise plan: monthly price in paise (₹24,999)');
