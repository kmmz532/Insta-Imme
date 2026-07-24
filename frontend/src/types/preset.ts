/** プリセットおよび透かし設定の型定義 */

export interface WatermarkSettings {
  enabled: boolean;
  text: string;
  position: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center';
  font_size: number;
}

export interface Preset {
  id: string;
  user_id: string;
  name: string;
  caption_template: string;
  hashtags: string;
  watermark: WatermarkSettings;
  created_at: string;
}

export interface PresetCreate {
  name: string;
  caption_template: string;
  hashtags: string;
  watermark: WatermarkSettings;
}

export interface PresetUpdate {
  name: string;
  caption_template: string;
  hashtags: string;
  watermark: WatermarkSettings;
}
