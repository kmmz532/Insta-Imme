import { apiClient } from './apiClient';
import type { PostResult, PostState } from '../types/post';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/** サーバーが起きているか /health で確認する（コールドスタート検出用） */
export async function pingServer(timeoutMs = 8000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** サーバーが応答するまで /health をポーリングする（最大 maxMs）。起動したら true */
export async function waitForServer(maxMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (await pingServer(8000)) return true;
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

/** 画像をWorkers経由でR2にアップロード */
export async function uploadImage(imageBlob: Blob, timeoutMs?: number): Promise<{ imageId: string }> {
  const formData = new FormData();
  formData.append('image', imageBlob, 'photo.jpg');

  return apiClient<{ imageId: string }>('/api/posts/upload', {
    method: 'POST',
    body: formData,
  }, timeoutMs);
}

interface PublishOptions {
  latitude?: number;
  longitude?: number;
  locationName?: string;
  skipWatermark?: boolean;
  timeoutMs?: number;
}

/** Instagram投稿を実行 */
export async function publishPost(
  imageId: string,
  instagramAccountId: string,
  caption: string,
  options: PublishOptions = {}
): Promise<PostResult> {
  return apiClient<PostResult>('/api/posts/publish', {
    method: 'POST',
    body: JSON.stringify({
      imageId,
      instagramAccountId,
      caption,
      latitude: options.latitude,
      longitude: options.longitude,
      locationName: options.locationName,
      skipWatermark: options.skipWatermark ?? false,
    }),
  }, options.timeoutMs);
}

/** 投稿履歴を取得 */
export async function fetchHistory(): Promise<PostState[]> {
  return apiClient<PostState[]>('/api/posts/history');
}
