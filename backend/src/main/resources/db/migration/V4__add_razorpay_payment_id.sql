-- ─── Add razorpay_payment_id to Subscriptions Table ───
ALTER TABLE subscriptions ADD COLUMN razorpay_payment_id VARCHAR(255);
