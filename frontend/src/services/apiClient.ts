import type { ApiResponse, ApiErrorResponse } from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * JWT付きのfetchラッパー
 * ローカルストレージからトークンを自動付与する
 */
export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs?: number
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // サーバーのコールドスタート(Render等)に備えて任意のタイムアウトを設定できる
  const controller = timeoutMs ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller?.signal,
    });
  } catch (err) {
    if (controller?.signal.aborted) {
      throw new ApiClientError('サーバーの応答がありません（時間切れ）', 'TIMEOUT', 0);
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }

  const json = (await res.json()) as ApiResponse<T>;

  if (!json.success) {
    const errorJson = json as ApiErrorResponse;
    throw new ApiClientError(errorJson.error.message, errorJson.error.code, res.status);
  }

  return json.data;
}

/** API通信エラー */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}
