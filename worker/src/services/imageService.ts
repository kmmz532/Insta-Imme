/** R2画像管理サービス */

/** 画像をR2にアップロードする */
export async function uploadImage(
  bucket: R2Bucket,
  userId: string,
  imageData: ArrayBuffer,
  contentType: string
): Promise<string> {
  const imageId = crypto.randomUUID();
  const key = buildKey(userId, imageId);

  await bucket.put(key, imageData, {
    httpMetadata: { contentType },
    customMetadata: { userId, uploadedAt: new Date().toISOString() },
  });

  return imageId;
}

/** R2から画像を取得する */
export async function getImage(
  bucket: R2Bucket,
  userId: string,
  imageId: string
): Promise<{ data: ReadableStream; contentType: string } | null> {
  const key = buildKey(userId, imageId);
  const object = await bucket.get(key);
  if (!object) return null;

  return {
    data: object.body,
    contentType: object.httpMetadata?.contentType ?? 'image/jpeg',
  };
}

/** 投稿成功後にR2から画像を削除する */
export async function deleteImage(
  bucket: R2Bucket,
  userId: string,
  imageId: string
): Promise<void> {
  const key = buildKey(userId, imageId);
  await bucket.delete(key);
}

/**
 * R2画像の公開URLを生成する
 * Instagram Content Publishing APIは公開URLを要求するため、
 * Workers経由の署名付きURLを返す
 */
export function buildImageUrl(baseUrl: string, imageId: string): string {
  return `${baseUrl}/api/images/${imageId}`;
}

function buildKey(userId: string, imageId: string): string {
  return `uploads/${userId}/${imageId}`;
}
