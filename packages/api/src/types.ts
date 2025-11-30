export interface Env {
  DB: D1Database;
  RECEIPTS: R2Bucket;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  TURNSTILE_SECRET_KEY: string;
  SMTP_API_KEY: string;
  N8N_WEBHOOK_URL: string;
  EXCHANGE_RATE_API_KEY?: string;
}