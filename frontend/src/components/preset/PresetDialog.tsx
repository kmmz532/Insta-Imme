import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
} from '@mui/material';
import * as presetService from '../../services/presetService';
import type { Preset, WatermarkSettings } from '../../types/preset';

interface PresetDialogProps {
  open: boolean;
  onClose: () => void;
  preset: Preset | null;
  onSaveSuccess: () => void;
}

/** プリセット作成・編集用ダイアログ */
export function PresetDialog({ open, onClose, preset, onSaveSuccess }: PresetDialogProps) {
  const [name, setName] = useState('');
  const [captionTemplate, setCaptionTemplate] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [wmEnabled, setWmEnabled] = useState(false);
  const [wmText, setWmText] = useState('');
  const [wmPosition, setWmPosition] = useState<WatermarkSettings['position']>('bottom_right');
  const [wmFontSize, setWmFontSize] = useState(36);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preset) {
      setName(preset.name);
      setCaptionTemplate(preset.caption_template);
      setHashtags(preset.hashtags || '');
      setWmEnabled(preset.watermark.enabled);
      setWmText(preset.watermark.text || '');
      setWmPosition(preset.watermark.position);
      setWmFontSize(preset.watermark.font_size);
    } else {
      setName('');
      setCaptionTemplate('');
      setHashtags('');
      setWmEnabled(false);
      setWmText('');
      setWmPosition('bottom_right');
      setWmFontSize(36);
    }
    setError(null);
  }, [preset, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const watermark: WatermarkSettings = {
      enabled: wmEnabled,
      text: wmText,
      position: wmPosition,
      font_size: wmFontSize,
    };

    try {
      if (preset) {
        await presetService.updatePreset(preset.id, {
          name,
          caption_template: captionTemplate,
          hashtags,
          watermark,
        });
      } else {
        await presetService.createPreset({
          name,
          caption_template: captionTemplate,
          hashtags,
          watermark,
        });
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !isSaving && onClose()} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>{preset ? 'プリセットの編集' : 'プリセットの作成'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Typography color="error" variant="body2">{error}</Typography>}
          
          <TextField
            label="プリセット名"
            required
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
          />
          <TextField
            label="キャプションテンプレート"
            multiline
            rows={4}
            fullWidth
            value={captionTemplate}
            onChange={(e) => setCaptionTemplate(e.target.value)}
            placeholder="投稿の本文テンプレート（変数が使用可能）"
            helperText="変数: ${date}, ${time}, ${datetime}, ${app}, ${account}, ${loc}, ${lat}, ${lng}"
            disabled={isSaving}
          />
          <TextField
            label="ハッシュタグ"
            fullWidth
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#写真 #日常 (スペース区切り)"
            disabled={isSaving}
          />

          <Typography variant="subtitle2" sx={{ mt: 1 }}>透かし設定</Typography>
          <FormControlLabel
            control={<Switch checked={wmEnabled} onChange={(e) => setWmEnabled(e.target.checked)} disabled={isSaving} />}
            label="透かし加工を有効にする"
          />

          {wmEnabled && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="透かしテキスト"
                  fullWidth
                  required
                  value={wmText}
                  onChange={(e) => setWmText(e.target.value)}
                  placeholder="例: © ${account} / ${date}"
                  disabled={isSaving}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>位置</InputLabel>
                  <Select
                    value={wmPosition}
                    label="位置"
                    onChange={(e) => setWmPosition(e.target.value as WatermarkSettings['position'])}
                    disabled={isSaving}
                  >
                    <MenuItem value="top_left">左上</MenuItem>
                    <MenuItem value="top_right">右上</MenuItem>
                    <MenuItem value="bottom_left">左下</MenuItem>
                    <MenuItem value="bottom_right">右下</MenuItem>
                    <MenuItem value="center">中央</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="フォントサイズ (px)"
                  type="number"
                  fullWidth
                  required
                  size="small"
                  value={wmFontSize}
                  onChange={(e) => setWmFontSize(Number(e.target.value))}
                  disabled={isSaving}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSaving}>キャンセル</Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
