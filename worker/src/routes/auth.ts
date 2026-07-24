import { Hono } from 'hono';
import type { Env } from '../types/env';
import { registerUser, loginUser, refreshToken, getUser } from '../services/authService';
import { authMiddleware } from '../middleware/auth';
import { AppError } from '../lib/errors';

type AuthEnv = { Bindings: Env; Variables: { userId: string } };

const auth = new Hono<AuthEnv>();

/** POST /api/auth/register - 新規ユーザー登録 */
auth.post('/register', async (c) => {
  const body = await c.req.json<{ email: string; password: string }>();
  const result = await registerUser(c.env.DB, c.env.JWT_SECRET, body.email, body.password);
  return c.json({ success: true, data: result }, 201);
});

/** POST /api/auth/login - ログイン */
auth.post('/login', async (c) => {
  const body = await c.req.json<{ email: string; password: string }>();
  const result = await loginUser(c.env.DB, c.env.JWT_SECRET, body.email, body.password);
  return c.json({ success: true, data: result });
});

/** POST /api/auth/refresh - トークンリフレッシュ */
auth.post('/refresh', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const result = await refreshToken(c.env.DB, c.env.JWT_SECRET, userId);
  return c.json({ success: true, data: result });
});

/** GET /api/auth/me - 現在のユーザー情報取得 */
auth.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user = await getUser(c.env.DB, userId);
  return c.json({ success: true, data: user });
});

export { auth };
