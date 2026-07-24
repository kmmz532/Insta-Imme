import { signJwt } from '../middleware/auth';
import { AuthError, ValidationError } from '../lib/errors';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

interface AuthResult {
  token: string;
  user: { id: string; email: string };
}

/** 新規ユーザー登録 */
export async function registerUser(
  db: D1Database,
  jwtSecret: string,
  email: string,
  password: string
): Promise<AuthResult> {
  if (!email || !password) throw new ValidationError('メールとパスワードは必須です');
  if (password.length < 8) throw new ValidationError('パスワードは8文字以上必要です');

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) throw new ValidationError('このメールアドレスは既に登録されています');

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await db
    .prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')
    .bind(id, email, passwordHash)
    .run();

  const token = await signJwt(id, jwtSecret);
  return { token, user: { id, email } };
}

/** ログイン認証 */
export async function loginUser(
  db: D1Database,
  jwtSecret: string,
  email: string,
  password: string
): Promise<AuthResult> {
  if (!email || !password) throw new ValidationError('メールとパスワードは必須です');

  const row = await db
    .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .bind(email)
    .first<UserRow>();

  if (!row) throw new AuthError('メールアドレスまたはパスワードが正しくありません');

  const isValid = await verifyPassword(password, row.password_hash);
  if (!isValid) throw new AuthError('メールアドレスまたはパスワードが正しくありません');

  const token = await signJwt(row.id, jwtSecret);
  return { token, user: { id: row.id, email: row.email } };
}

/** トークンリフレッシュ */
export async function refreshToken(
  db: D1Database,
  jwtSecret: string,
  userId: string
): Promise<AuthResult> {
  const row = await db
    .prepare('SELECT id, email FROM users WHERE id = ?')
    .bind(userId)
    .first<Pick<UserRow, 'id' | 'email'>>();

  if (!row) throw new AuthError('ユーザーが見つかりません');

  const token = await signJwt(row.id, jwtSecret);
  return { token, user: { id: row.id, email: row.email } };
}

/** ユーザー情報取得 */
export async function getUser(
  db: D1Database,
  userId: string
): Promise<{ id: string; email: string }> {
  const row = await db
    .prepare('SELECT id, email FROM users WHERE id = ?')
    .bind(userId)
    .first<Pick<UserRow, 'id' | 'email'>>();

  if (!row) throw new AuthError('ユーザーが見つかりません');
  return { id: row.id, email: row.email };
}

/** PBKDF2によるパスワードハッシュ */
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );

  const saltHex = bufferToHex(salt);
  const hashHex = bufferToHex(new Uint8Array(hash));
  return `${saltHex}:${hashHex}`;
}

/** パスワード検証 */
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;

  const salt = hexToBuffer(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );

  return bufferToHex(new Uint8Array(hash)) === hashHex;
}

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
