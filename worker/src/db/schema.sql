-- Insta-Imme D1 Schema

-- ユーザー
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Instagramアカウント
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  instagram_user_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  preset_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- プリセット
CREATE TABLE IF NOT EXISTS presets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  caption_template TEXT NOT NULL DEFAULT '',
  hashtags TEXT NOT NULL DEFAULT '',
  watermark_template TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 投稿履歴
CREATE TABLE IF NOT EXISTS post_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  instagram_account_id TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  preset_id TEXT,
  instagram_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  posted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (instagram_account_id) REFERENCES instagram_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_instagram_accounts_user_id ON instagram_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_presets_user_id ON presets(user_id);
CREATE INDEX IF NOT EXISTS idx_post_history_user_id ON post_history(user_id);
