import type { ApiResponse, ApiErrorResponse } from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * JWT付きのfetchラッパー
 * ローカルストレージからトークンを自動付与する
 */
export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
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
