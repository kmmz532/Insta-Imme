import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import type { InstagramAccount } from '../../types/instagram';

interface CaptionEditorProps {
  caption: string;
  onCaptionChange: (caption: string) => void;
  accounts: InstagramAccount[];
  selectedAccountId: string;
  onAccountChange: (accountId: string) => void;
}

/** キャプション編集 - テキストエリアとアカウント選択 */
export function CaptionEditor({
  caption,
  onCaptionChange,
  accounts,
  selectedAccountId,
  onAccountChange,
}: CaptionEditorProps) {
  return (
    <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="account-select-label">投稿先アカウント</InputLabel>
        <Select
          id="account-select"
          labelId="account-select-label"
          value={selectedAccountId}
          onChange={(e) => onAccountChange(e.target.value)}
          label="投稿先アカウント"
        >
          {accounts.length === 0 && (
            <MenuItem value="" disabled>
              Instagramアカウントを連携してください
            </MenuItem>
          )}
          {accounts.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              @{a.account_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        id="caption-input"
        label="キャプション"
        multiline
        rows={4}
        value={caption}
        onChange={(e) => onCaptionChange(e.target.value)}
        fullWidth
        placeholder="写真のキャプションを入力..."
        helperText="テンプレート変数: ${date}, ${time}, ${app} が利用可能"
      />

      <Typography variant="caption" color="text.secondary">
        ハッシュタグもキャプションに含めてください（例: #INSTA_IMME）
      </Typography>
    </Box>
  );
}
