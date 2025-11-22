export interface Env {
  DB: D1Database;
  RECEIPTS: R2Bucket;
  JWT_SECRET: string;
  ENVIRONMENT: string;
}
