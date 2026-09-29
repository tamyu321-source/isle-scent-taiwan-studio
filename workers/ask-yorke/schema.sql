CREATE TABLE IF NOT EXISTS ask_yorke_usage (
  scope TEXT NOT NULL,
  period_key TEXT NOT NULL,
  count INTEGER NOT NULL CHECK (count >= 0),
  PRIMARY KEY (scope, period_key)
);
