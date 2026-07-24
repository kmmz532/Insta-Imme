import { apiClient } from './apiClient';
import type { PostResult, PostState } from '../types/post';

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
  caption: string,
  latitude?: number,
  longitude?: number,
  locationName?: string
): Promise<PostResult> {
  return apiClient<PostResult>('/api/posts/publish', {
    method: 'POST',
    body: JSON.stringify({
      imageId,
      instagramAccountId,
      caption,
      latitude,
      longitude,
      locationName,
    }),
  });
}

/** 投稿履歴を取得 */
export async function fetchHistory(): Promise<PostState[]> {
  return apiClient<PostState[]>('/api/posts/history');
}
