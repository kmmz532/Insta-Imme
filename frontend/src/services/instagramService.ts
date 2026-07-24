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

/** アカウントにプリセットを割り当てる */
export async function associatePreset(
  accountId: string,
  presetId: string | null
): Promise<InstagramAccount> {
  return apiClient<InstagramAccount>(`/api/instagram/accounts/${accountId}/preset`, {
    method: 'PUT',
    body: JSON.stringify({ presetId }),
  });
}

/** アカウントの自動プリセット適用ルールを更新 */
export async function updateAutoRules(
  accountId: string,
  autoRules: InstagramAccount['auto_rules']
): Promise<InstagramAccount> {
  return apiClient<InstagramAccount>(`/api/instagram/accounts/${accountId}/auto-rules`, {
    method: 'PUT',
    body: JSON.stringify(autoRules),
  });
}

/** アカウントの過去画像をZIPで一括ダウンロード */
export async function downloadAllPhotos(accountId: string, username: string): Promise<void> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/instagram/accounts/${accountId}/download-all`, {
    headers,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || 'ダウンロードに失敗しました');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `instagram_photos_${username}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
