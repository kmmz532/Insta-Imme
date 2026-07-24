import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { uploadImage, getImage, deleteImage, buildImageUrl } from '../services/imageService';
import { createMediaContainer, publishMedia } from '../services/instagramApi';
import { NotFoundError, ForbiddenError, ValidationError } from '../lib/errors';

type PostEnv = { Bindings: Env; Variables: { userId: string } };

const post = new Hono<PostEnv>();

post.use('*', authMiddleware);

/** POST /api/posts/upload - 画像アップロード（R2へ保存） */
post.post('/upload', async (c) => {
  const userId = c.get('userId');
  const formData = await c.req.formData();
  const file = formData.get('image');

  if (!(file instanceof File)) throw new ValidationError('画像ファイルが必要です');

  const arrayBuffer = await file.arrayBuffer();
  const imageId = await uploadImage(c.env.BUCKET, userId, arrayBuffer, file.type);

  return c.json({ success: true, data: { imageId } }, 201);
});

/** POST /api/posts/publish - Instagram投稿実行 */
post.post('/publish', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{
    imageId: string;
    instagramAccountId: string;
    caption: string;
  }>();

  const account = await c.env.DB
    .prepare('SELECT id, user_id, instagram_user_id, access_token_encrypted FROM instagram_accounts WHERE id = ?')
    .bind(body.instagramAccountId)
    .first<{
      id: string;
      user_id: string;
      instagram_user_id: string;
      access_token_encrypted: string;
    }>();

  if (!account) throw new NotFoundError('Instagramアカウントが見つかりません');
  if (account.user_id !== userId) throw new ForbiddenError();

  const postId = crypto.randomUUID();
  await c.env.DB
    .prepare(
      'INSERT INTO post_history (id, user_id, instagram_account_id, caption, status) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(postId, userId, account.id, body.caption, 'uploading')
    .run();

  const workerUrl = new URL(c.req.url).origin;
  const imageUrl = buildImageUrl(workerUrl, body.imageId);

  try {
    await c.env.DB
      .prepare('UPDATE post_history SET status = ? WHERE id = ?')
      .bind('publishing', postId)
      .run();

    const containerId = await createMediaContainer(
      account.instagram_user_id,
      imageUrl,
      body.caption,
      account.access_token_encrypted
    );

    const igPostId = await publishMedia(
      account.instagram_user_id,
      containerId,
      account.access_token_encrypted
    );

    await c.env.DB
      .prepare('UPDATE post_history SET status = ?, instagram_post_id = ?, posted_at = datetime(\'now\') WHERE id = ?')
      .bind('success', igPostId, postId)
      .run();

    await deleteImage(c.env.BUCKET, userId, body.imageId);

    return c.json({
      success: true,
      data: { postId, instagramPostId: igPostId },
    });
  } catch (error) {
    await c.env.DB
      .prepare('UPDATE post_history SET status = ? WHERE id = ?')
      .bind('failed', postId)
      .run();
    throw error;
  }
});

/** GET /api/posts/status/:id - 投稿状態確認 */
post.get('/status/:id', async (c) => {
  const userId = c.get('userId');
  const postId = c.req.param('id');

  const result = await c.env.DB
    .prepare('SELECT id, status, instagram_post_id, posted_at FROM post_history WHERE id = ? AND user_id = ?')
    .bind(postId, userId)
    .first<{
      id: string;
      status: string;
      instagram_post_id: string | null;
      posted_at: string | null;
    }>();

  if (!result) throw new NotFoundError('投稿が見つかりません');
  return c.json({ success: true, data: result });
});

export { post };
