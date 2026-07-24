import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import * as instagramService from '../../services/instagramService';
import type { InstagramAccount, AutoPresetRule, AutoPresetSettings } from '../../types/instagram';
import type { Preset } from '../../types/preset';

interface AutoRuleSelectorProps {
  open: boolean;
  onClose: () => void;
  account: InstagramAccount;
  presets: Preset[];
  onSaveSuccess: () => void;
}

export function AutoRuleSelector({
  open,
  onClose,
  account,
  presets,
  onSaveSuccess,
}: AutoRuleSelectorProps) {
  const [enabled, setEnabled] = useState(false);
  const [rules, setRules] = useState<AutoPresetRule[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 新規ルール追加用の一時ステート
  const [newDay, setNewDay] = useState<AutoPresetRule['dayOfWeek']>('all');
  const [newTime, setNewTime] = useState<AutoPresetRule['timeRange']>('day');
  const [newPresetId, setNewPresetId] = useState('');

  // アカウントデータが渡されたら初期状態をセット
  useEffect(() => {
    if (account.auto_rules) {
      setEnabled(account.auto_rules.enabled);
      setRules(account.auto_rules.rules || []);
    } else {
      setEnabled(false);
      setRules([]);
    }
    
    if (presets.length > 0 && presets[0]) {
      setNewPresetId(presets[0].id);
    }
  }, [account, presets]);

  const handleAddRule = () => {
    if (!newPresetId) return;

    // 重複チェック
    const isDuplicate = rules.some(
      (r) => r.dayOfWeek === newDay && r.timeRange === newTime
    );
    if (isDuplicate) {
      alert('同じ曜日と時間帯のルールが既に存在します');
      return;
    }

    const newRule: AutoPresetRule = {
      dayOfWeek: newDay,
      timeRange: newTime,
      presetId: newPresetId,
    };

    setRules((prev) => [...prev, newRule]);
  };

  const handleDeleteRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settings: AutoPresetSettings = {
        enabled,
        rules,
      };
      await instagramService.updateAutoRules(account.id, settings);
      onSaveSuccess();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ルールの保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const getPresetName = (presetId: string) => {
    const p = presets.find((x) => x.id === presetId);
    return p ? p.name : '不明なプリセット';
  };

  const getDayText = (day: AutoPresetRule['dayOfWeek']) => {
    if (day === 'weekday') return '平日 (月〜金)';
    if (day === 'weekend') return '休日 (土日)';
    return '毎日';
  };

  const getTimeText = (time: AutoPresetRule['timeRange']) => {
    if (time === 'morning') return '朝 (05:00 - 10:59)';
    if (time === 'day') return '昼 (11:00 - 17:59)';
    if (time === 'night') return '夜 (18:00 - 23:59)';
    return '深夜 (24:00 - 04:59)';
  };

  return (
    <Dialog open={open} onClose={() => !isSaving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>
        <FontAwesomeIcon icon={faCalendarDays} style={{ marginRight: 8 }} />
        自動プリセットルール - @{account.account_name}
      </DialogTitle>
      
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <FormControlLabel
          control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
          label="時間帯・曜日の自動選択ルールを有効にする"
        />

        {enabled && (
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>ルールを追加</Typography>
            
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>曜日</InputLabel>
                <Select value={newDay} label="曜日" onChange={(e) => setNewDay(e.target.value as AutoPresetRule['dayOfWeek'])}>
                  <MenuItem value="all">毎日</MenuItem>
                  <MenuItem value="weekday">平日</MenuItem>
                  <MenuItem value="weekend">休日</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>時間帯</InputLabel>
                <Select value={newTime} label="時間帯" onChange={(e) => setNewTime(e.target.value as AutoPresetRule['timeRange'])}>
                  <MenuItem value="morning">朝</MenuItem>
                  <MenuItem value="day">昼</MenuItem>
                  <MenuItem value="night">夜</MenuItem>
                  <MenuItem value="late_night">深夜</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
                <InputLabel>適用プリセット</InputLabel>
                <Select value={newPresetId} label="適用プリセット" onChange={(e) => setNewPresetId(e.target.value)}>
                  {presets.length === 0 && (
                    <MenuItem value="" disabled>プリセットがありません</MenuItem>
                  )}
                  {presets.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<FontAwesomeIcon icon={faPlus} />}
                onClick={handleAddRule}
                disabled={presets.length === 0}
              >
                追加
              </Button>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>現在のルール</Typography>
            
            {rules.length === 0 ? (
              <Typography color="text.secondary" variant="body2" sx={{ textAlign: 'center', py: 2 }}>
                設定されているルールはありません
              </Typography>
            ) : (
              <List dense>
                {rules.map((rule, idx) => (
                  <ListItem key={idx} sx={{ backgroundColor: 'rgba(255,255,255,0.02)', mb: 1, borderRadius: 1 }}>
                    <ListItemText
                      primary={`${getDayText(rule.dayOfWeek)} | ${getTimeText(rule.timeRange)}`}
                      secondary={`適用: ${getPresetName(rule.presetId)}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" color="error" size="small" onClick={() => handleDeleteRule(idx)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained" disabled={isSaving}>
          {isSaving ? '保存中...' : 'ルールを保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
