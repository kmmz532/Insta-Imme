import { apiClient } from './apiClient';
import type { AuthResponse } from '../types/user';

/** 新規ユーザー登録 */
export async function register(email: string, password: string): Promise<AuthResponse> {
  return apiClient<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/** ログイン */
export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiClient<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/** トークンリフレッシュ */
export async function refreshToken(): Promise<AuthResponse> {
  return apiClient<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
  });
}

/** 現在のユーザー情報取得 */
export async function fetchMe(): Promise<{ id: string; email: string }> {
  return apiClient<{ id: string; email: string }>('/api/auth/me');
}
