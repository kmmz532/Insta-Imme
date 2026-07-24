import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import {
  buildAuthUrl,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getInstagramUser,
} from '../services/instagramApi';
import { NotFoundError, ForbiddenError } from '../lib/errors';

type IgEnv = { Bindings: Env; Variables: { userId: string } };

const instagram = new Hono<IgEnv>();

/** 全ルートに認証を適用 */
instagram.use('*', authMiddleware);

/** GET /api/instagram/auth-url - Instagram OAuth認証URLを取得 */
instagram.get('/auth-url', async (c) => {
  const userId = c.get('userId');
  const redirectUri = `${c.env.FRONTEND_URL}/instagram/callback`;

  /** CSRF対策のstateパラメータにユーザーIDを埋め込む */
  const state = btoa(JSON.stringify({ userId, ts: Date.now() }));
  const url = buildAuthUrl(c.env.INSTAGRAM_APP_ID, redirectUri, state);

  return c.json({ success: true, data: { url } });
});

/** POST /api/instagram/callback - OAuth コールバック処理 */
instagram.post('/callback', async (c) => {
  const userId = c.get('userId');
  const { code } = await c.req.json<{ code: string }>();
  const redirectUri = `${c.env.FRONTEND_URL}/instagram/callback`;

  const tokenRes = await exchangeCodeForToken(
    code,
    c.env.INSTAGRAM_APP_ID,
    c.env.INSTAGRAM_APP_SECRET,
    redirectUri
  );

  const longLived = await exchangeForLongLivedToken(
    tokenRes.access_token,
    c.env.INSTAGRAM_APP_SECRET
  );

  const igUser = await getInstagramUser(longLived.access_token);

  const id = crypto.randomUUID();
  await c.env.DB
    .prepare(
      'INSERT INTO instagram_accounts (id, user_id, account_name, instagram_user_id, access_token_encrypted) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, userId, igUser.username, igUser.id, longLived.access_token)
    .run();

  return c.json({
    success: true,
    data: { id, accountName: igUser.username },
  }, 201);
});

/** GET /api/instagram/accounts - 連携アカウント一覧 */
instagram.get('/accounts', async (c) => {
  const userId = c.get('userId');
  const result = await c.env.DB
    .prepare('SELECT id, account_name, created_at FROM instagram_accounts WHERE user_id = ?')
    .bind(userId)
    .all<{ id: string; account_name: string; created_at: string }>();

  return c.json({ success: true, data: result.results });
});

/** DELETE /api/instagram/accounts/:id - 連携解除 */
instagram.delete('/accounts/:id', async (c) => {
  const userId = c.get('userId');
  const accountId = c.req.param('id');

  const account = await c.env.DB
    .prepare('SELECT user_id FROM instagram_accounts WHERE id = ?')
    .bind(accountId)
    .first<{ user_id: string }>();

  if (!account) throw new NotFoundError('Instagramアカウントが見つかりません');
  if (account.user_id !== userId) throw new ForbiddenError();

  await c.env.DB
    .prepare('DELETE FROM instagram_accounts WHERE id = ?')
    .bind(accountId)
    .run();

  return c.json({ success: true });
});

export { instagram };
