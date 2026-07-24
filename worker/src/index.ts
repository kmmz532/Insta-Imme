import { Hono } from 'hono';
import type { Env } from './types/env';
import { auth } from './routes/auth';
import { instagram } from './routes/instagram';
import { post } from './routes/post';
import { getImage } from './services/imageService';
import { AppError } from './lib/errors';
import { cors } from 'hono/cors';

type AppEnv = { Bindings: Env; Variables: { userId: string } };

const app = new Hono<AppEnv>();

/** CORS設定 */
app.use('/api/*', async (c, next) => {
  const corsHandler = cors({
    origin: [c.env.FRONTEND_URL, 'http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  });
  return corsHandler(c, next);
});

/** APIルーティング */
app.route('/api/auth', auth);
app.route('/api/instagram', instagram);
app.route('/api/posts', post);

/**
 * 画像配信エンドポイント
 * Instagram Content Publishing APIが画像URLを要求するため、
 * R2画像を公開配信する
 */
app.get('/api/images/:imageId', async (c) => {
  const imageId = c.req.param('imageId');

  const objects = await c.env.BUCKET.list({ prefix: 'uploads/' });
  let targetKey: string | null = null;

  for (const obj of objects.objects) {
    if (obj.key.endsWith(`/${imageId}`)) {
      targetKey = obj.key;
      break;
    }
  }

  if (!targetKey) return c.notFound();

  const object = await c.env.BUCKET.get(targetKey);
  if (!object) return c.notFound();

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/** グローバルエラーハンドリング */
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      { success: false, error: { code: err.code, message: err.message } },
      err.statusCode as 400 | 401 | 403 | 404 | 502
    );
  }

  console.error('Unhandled error:', err);
  return c.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
    500
  );
});

export default app;
