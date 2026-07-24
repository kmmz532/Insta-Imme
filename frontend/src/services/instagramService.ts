import { apiClient } from './apiClient';
import type { InstagramAccount } from '../types/instagram';

/** Instagramにログインして連携を追加・更新する */
export async function loginToInstagram(
  username: string,
  password: string,
  verificationCode?: string
): Promise<InstagramAccount> {
  return apiClient<InstagramAccount>('/api/instagram/login', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      verification_code: verificationCode || null,
    }),
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
