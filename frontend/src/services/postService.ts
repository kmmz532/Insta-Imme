import { apiClient } from './apiClient';
import type { PostResult } from '../types/post';

/** 画像をWorkers経由でR2にアップロード */
export async function uploadImage(imageBlob: Blob): Promise<{ imageId: string }> {
  const formData = new FormData();
  formData.append('image', imageBlob, 'photo.jpg');

  return apiClient<{ imageId: string }>('/api/posts/upload', {
    method: 'POST',
    body: formData,
  });
}

/** Instagram投稿を実行 */
export async function publishPost(
  imageId: string,
  instagramAccountId: string,
  caption: string
): Promise<PostResult> {
  return apiClient<PostResult>('/api/posts/publish', {
    method: 'POST',
    body: JSON.stringify({ imageId, instagramAccountId, caption }),
  });
}
