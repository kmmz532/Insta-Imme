export interface AutoPresetRule {
  dayOfWeek: 'weekday' | 'weekend' | 'all';
  timeRange: 'morning' | 'day' | 'night' | 'late_night';
  presetId: string;
}

export interface AutoPresetSettings {
  enabled: boolean;
  rules: AutoPresetRule[];
}

export interface InstagramAccount {
  id: string;
  account_name: string;
  preset_id?: string | null;
  auto_rules?: AutoPresetSettings | null;
  created_at: string;
}
