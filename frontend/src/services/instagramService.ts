import { apiClient } from './apiClient';
import type { InstagramAccount } from '../types/instagram';

/** Instagram OAuth認証URLを取得 */
export async function getAuthUrl(): Promise<{ url: string }> {
  return apiClient<{ url: string }>('/api/instagram/auth-url');
}

/** OAuth コールバック処理 */
export async function handleCallback(
  code: string
): Promise<{ id: string; accountName: string }> {
  return apiClient<{ id: string; accountName: string }>('/api/instagram/callback', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

/** 連携アカウント一覧を取得 */
export async function fetchAccounts(): Promise<InstagramAccount[]> {
  return apiClient<InstagramAccount[]>('/api/instagram/accounts');
}

/** 連携を解除 */
export async function removeAccount(accountId: string): Promise<void> {
  await apiClient<void>(`/api/instagram/accounts/${accountId}`, {
    method: 'DELETE',
  });
}
