import { apiClient } from './apiClient';
import type { Preset, PresetCreate, PresetUpdate } from '../types/preset';

/** プリセット一覧を取得 */
export async function fetchPresets(): Promise<Preset[]> {
  return apiClient<Preset[]>('/api/presets');
}

/** プリセット詳細を取得 */
export async function fetchPreset(presetId: string): Promise<Preset> {
  return apiClient<Preset>(`/api/presets/${presetId}`);
}

/** プリセットを新規作成 */
export async function createPreset(data: PresetCreate): Promise<Preset> {
  return apiClient<Preset>('/api/presets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** プリセットを更新 */
export async function updatePreset(presetId: string, data: PresetUpdate): Promise<Preset> {
  return apiClient<Preset>(`/api/presets/${presetId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** プリセットを削除 */
export async function deletePreset(presetId: string): Promise<void> {
  await apiClient<void>(`/api/presets/${presetId}`, {
    method: 'DELETE',
  });
}
