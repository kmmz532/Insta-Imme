import * as postService from '../services/postService';
import { applyWatermarkToBlob, expandTemplate } from './watermark';
import type { WatermarkSettings } from '../types/preset';

// サーバー(Render等)のコールドスタートを見込んだアップロード待ち上限
const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;

export interface PostJob {
  id: string;
  blob: Blob;
  accountId: string;
  accountName: string;
  caption: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  // 透かしをクライアント側で焼き込む場合の設定。nullなら透かし無し
  watermark?: WatermarkSettings | null;
}

export type JobStatus = 'queued' | 'uploading' | 'posting' | 'success' | 'error';

export interface JobEvent {
  job: PostJob;
  status: JobStatus;
  message: string;
}

type Listener = (e: JobEvent) => void;

const listeners = new Set<Listener>();
const queue: PostJob[] = [];
let processing = false;

/** 投稿キューのイベントを購読する。返り値で解除 */
export function subscribePostQueue(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(job: PostJob, status: JobStatus, message: string) {
  listeners.forEach((l) => l({ job, status, message }));
}

/** 投稿ジョブをキューに追加する（非ブロッキング。バックグラウンドで順次処理） */
export function enqueuePost(job: PostJob): void {
  queue.push(job);
  emit(job, 'queued', `投稿を予約しました (@${job.accountName})`);
  if (!processing) void processQueue();
}

async function processQueue(): Promise<void> {
  processing = true;
  while (queue.length > 0) {
    const job = queue.shift();
    if (!job) break;
    try {
      let blob = job.blob;
      let skipWatermark = false;

      // 透かしはクライアント側で焼き込み、サーバー側の二重適用を防ぐ
      if (job.watermark?.enabled && job.watermark.text) {
        const text = expandTemplate(job.watermark.text, {
          account: job.accountName,
          latitude: job.latitude,
          longitude: job.longitude,
          locationName: job.locationName,
        });
        blob = await applyWatermarkToBlob(blob, job.watermark, text);
        skipWatermark = true;
      }

      emit(job, 'uploading', `アップロード中... (@${job.accountName})`);
      const { imageId } = await postService.uploadImage(blob, UPLOAD_TIMEOUT_MS);

      emit(job, 'posting', `Instagramに投稿中... (@${job.accountName})`);
      await postService.publishPost(imageId, job.accountId, job.caption, {
        latitude: job.latitude,
        longitude: job.longitude,
        locationName: job.locationName,
        skipWatermark,
        timeoutMs: UPLOAD_TIMEOUT_MS,
      });

      emit(job, 'success', `投稿完了 (@${job.accountName})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '投稿に失敗しました';
      emit(job, 'error', `投稿失敗 (@${job.accountName}): ${message}`);
    }
  }
  processing = false;
}
