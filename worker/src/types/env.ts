/** Workers環境バインディングの型定義 */
export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  KV: KVNamespace;
  JWT_SECRET: string;
  INSTAGRAM_APP_ID: string;
  INSTAGRAM_APP_SECRET: string;
  FRONTEND_URL: string;
}
