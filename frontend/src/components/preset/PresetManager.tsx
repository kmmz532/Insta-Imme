import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  FormControl,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faPen, faSliders, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { AutoRuleSelector } from '../instagram/AutoRuleSelector';
import { PresetDialog } from './PresetDialog';
import * as presetService from '../../services/presetService';
import * as instagramService from '../../services/instagramService';
import type { Preset } from '../../types/preset';
import type { InstagramAccount } from '../../types/instagram';

/** プリセット管理画面 - プリセットCRUD、デフォルト割当、自動ルール定義 */
export function PresetManager() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // プリセットダイアログ用
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);

  // 自動ルールダイアログ用
  const [openAutoDialog, setOpenAutoDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<InstagramAccount | null>(null);

  const handleOpenAutoRules = (account: InstagramAccount) => {
    setSelectedAccount(account);
    setOpenAutoDialog(true);
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [presetList, accountList] = await Promise.all([
        presetService.fetchPresets(),
        instagramService.fetchAccounts(),
      ]);
      setPresets(presetList);
      setAccounts(accountList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingPreset(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (preset: Preset) => {
    setEditingPreset(preset);
    setOpenDialog(true);
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
      const targetPresetId = presetId === 'none' ? null : presetId;
      await instagramService.associatePreset(accountId, targetPresetId);
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenAutoRules(account)}
                    title="曜日・時間帯自動切替ルール"
                    sx={{ color: account.auto_rules?.enabled ? 'primary.main' : 'text.secondary' }}
                  >
                    <FontAwesomeIcon icon={faCalendarDays} />
                  </IconButton>
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
                </Box>
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
      <PresetDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        preset={editingPreset}
        onSaveSuccess={loadData}
      />

      {/* 自動ルールダイアログ */}
      {selectedAccount && (
        <AutoRuleSelector
          open={openAutoDialog}
          onClose={() => setOpenAutoDialog(false)}
          account={selectedAccount}
          presets={presets}
          onSaveSuccess={loadData}
        />
      )}
    </Box>
  );
}
