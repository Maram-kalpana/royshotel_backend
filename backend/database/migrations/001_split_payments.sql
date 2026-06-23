-- Split payments + extended documents (idempotent via initDb)

CREATE TABLE IF NOT EXISTS monthly_payment_splits (
  id VARCHAR(36) PRIMARY KEY,
  monthly_payment_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_mode ENUM('Cash', 'UPI', 'Card', 'Bank Transfer') NOT NULL DEFAULT 'Cash',
  transaction_id VARCHAR(100) NULL,
  payment_date DATE NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (monthly_payment_id) REFERENCES monthly_payments(id) ON DELETE CASCADE,
  INDEX idx_splits_payment (monthly_payment_id)
);
