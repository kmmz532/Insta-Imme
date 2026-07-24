import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
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
  Alert,
  CircularProgress,
  IconButton,
  Divider,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faPen, faSliders } from '@fortawesome/free-solid-svg-icons';
import * as presetService from '../../services/presetService';
import * as instagramService from '../../services/instagramService';
import type { Preset, WatermarkSettings } from '../../types/preset';
import type { InstagramAccount } from '../../types/instagram';

export function PresetManager() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ダイアログ用のステート
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  
  // フォームステート
  const [name, setName] = useState('');
  const [captionTemplate, setCaptionTemplate] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [wmEnabled, setWmEnabled] = useState(false);
  const [wmText, setWmText] = useState('');
  const [wmPosition, setWmPosition] = useState<WatermarkSettings['position']>('bottom_right');
  const [wmFontSize, setWmFontSize] = useState(36);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pList, aList] = await Promise.all([
        presetService.fetchPresets(),
        instagramService.fetchAccounts(),
      ]);
      setPresets(pList);
      setAccounts(aList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenCreate = () => {
    setEditingPreset(null);
    setName('');
    setCaptionTemplate('');
    setHashtags('');
    setWmEnabled(false);
    setWmText('');
    setWmPosition('bottom_right');
    setWmFontSize(36);
    setOpenDialog(true);
  };

  const handleOpenEdit = (preset: Preset) => {
    setEditingPreset(preset);
    setName(preset.name);
    setCaptionTemplate(preset.caption_template);
    setHashtags(preset.hashtags);
    setWmEnabled(preset.watermark.enabled);
    setWmText(preset.watermark.text);
    setWmPosition(preset.watermark.position);
    setWmFontSize(preset.watermark.font_size);
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const watermark: WatermarkSettings = {
      enabled: wmEnabled,
      text: wmText,
      position: wmPosition,
      font_size: wmFontSize,
    };

    try {
      if (editingPreset) {
        await presetService.updatePreset(editingPreset.id, {
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
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    }
  };

  const handleDelete = async (presetId: string) => {
    if (!confirm('このプリセットを削除しますか？')) return;
    try {
      await presetService.deletePreset(presetId);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  const handleAccountPresetChange = async (accountId: string, presetId: string | null) => {
    try {
      // プレースホルダーの 'none' は null として扱う
      const targetPresetId = presetId === 'none' ? null : presetId;
      await instagramService.associatePreset(accountId, targetPresetId);
      
      // アカウント一覧を更新
      const updatedAccounts = await instagramService.fetchAccounts();
      setAccounts(updatedAccounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プリセットの割り当てに失敗しました');
    }
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3, overflow: 'auto', height: '100%' }}>
      <Typography variant="h6">
        <FontAwesomeIcon icon={faSliders} style={{ marginRight: 8 }} />
        プリセット管理
      </Typography>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* Instagramアカウントの紐づけセクション */}
      {accounts.length > 0 && (
        <Card sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            アカウントごとのデフォルトプリセット
          </Typography>
          <Grid container spacing={2}>
            {accounts.map((account) => (
              <Grid item xs={12} sm={6} key={account.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2">@{account.account_name}</Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={account.preset_id || 'none'}
                    onChange={(e) => handleAccountPresetChange(account.id, e.target.value)}
                  >
                    <MenuItem value="none">割り当てなし</MenuItem>
                    {presets.map((p) => (
                      <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ))}
          </Grid>
        </Card>
      )}

      <Divider />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>登録済みプリセット</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<FontAwesomeIcon icon={faPlus} />}
          onClick={handleOpenCreate}
        >
          プリセットを追加
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : presets.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          登録されているプリセットはありません
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {presets.map((preset) => (
            <Grid item xs={12} sm={6} key={preset.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary">{preset.name}</Typography>
                    <Box>
                      <IconButton size="small" onClick={() => handleOpenEdit(preset)}>
                        <FontAwesomeIcon icon={faPen} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(preset.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </IconButton>
                    </Box>
                  </Box>

                  {preset.caption_template && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">キャプションテンプレート</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', backgroundColor: 'rgba(255,255,255,0.02)', p: 1, borderRadius: 1 }}>
                        {preset.caption_template}
                      </Typography>
                    </Box>
                  )}

                  {preset.hashtags && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">ハッシュタグ</Typography>
                      <Typography variant="body2" color="secondary">{preset.hashtags}</Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">透かし加工:</Typography>
                    <Typography variant="body2">
                      {preset.watermark.enabled ? `ON (${preset.watermark.position}, size: ${preset.watermark.font_size})` : 'OFF'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 作成・編集ダイアログ */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editingPreset ? 'プリセットの編集' : 'プリセットの作成'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="プリセット名"
              required
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="キャプションテンプレート"
              multiline
              rows={4}
              fullWidth
              value={captionTemplate}
              onChange={(e) => setCaptionTemplate(e.target.value)}
              placeholder="投稿の本文テンプレート（変数が使用可能）"
              helperText="変数: ${date}, ${time}, ${datetime}, ${app}, ${account}"
            />
            <TextField
              label="ハッシュタグ"
              fullWidth
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#写真 #日常 (スペース区切り)"
            />

            <Typography variant="subtitle2" sx={{ mt: 1 }}>透かし設定</Typography>
            <FormControlLabel
              control={<Switch checked={wmEnabled} onChange={(e) => setWmEnabled(e.target.checked)} />}
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
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>位置</InputLabel>
                    <Select
                      value={wmPosition}
                      label="位置"
                      onChange={(e) => setWmPosition(e.target.value as WatermarkSettings['position'])}
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
                    value={wmFontSize}
                    onChange={(e) => setWmFontSize(Number(e.target.value))}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>キャンセル</Button>
            <Button type="submit" variant="contained">保存</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
