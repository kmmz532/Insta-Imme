import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faTrash, faPlus, faDownload, faSpinner } from '@fortawesome/free-solid-svg-icons';
import * as instagramService from '../../services/instagramService';
import type { InstagramAccount } from '../../types/instagram';

/** Instagram連携アカウント管理 */
export function AccountList() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // ログインダイアログ用のステート
  const [openDialog, setOpenDialog] = useState(false);
  const [mode, setMode] = useState<'password' | 'sessionid'>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const list = await instagramService.fetchAccounts();
      setAccounts(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : '読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAll = async (accountId: string, username: string) => {
    setDownloadingId(accountId);
    setError(null);
    try {
      await instagramService.downloadAllPhotos(accountId, username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ダウンロードに失敗しました');
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => { loadAccounts(); }, []);

  const handleOpenDialog = () => {
    setMode('password');
    setUsername('');
    setPassword('');
    setVerificationCode('');
    setSessionId('');
    setShow2FA(false);
    setConnectError(null);
    setOpenDialog(true);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectError(null);

    try {
      if (mode === 'sessionid') {
        await instagramService.connectBySessionId(sessionId.trim());
      } else {
        await instagramService.loginToInstagram(
          username,
          password,
          show2FA ? verificationCode : undefined
        );
      }

      // 成功したら一覧を更新しダイアログを閉じる
      setOpenDialog(false);
      loadAccounts();
    } catch (err) {
      const message = err instanceof Error ? err.message : '連携に失敗しました';
      if (message === '2FA') {
        setShow2FA(true);
      } else {
        setConnectError(message);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRemove = async (accountId: string) => {
    try {
      await instagramService.removeAccount(accountId);
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '連携解除に失敗しました');
    }
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">
        <FontAwesomeIcon icon={faInstagram} style={{ marginRight: 8 }} />
        Instagram連携
      </Typography>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : accounts.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Instagramアカウントが連携されていません
          </Typography>
        </Card>
      ) : (
        <List>
          {accounts.map((account) => (
            <ListItem key={account.id} sx={listItemStyle}>
              <ListItemText
                primary={`@${account.account_name}`}
                secondary={`連携日: ${new Date(account.created_at).toLocaleDateString('ja-JP')}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  onClick={() => handleDownloadAll(account.id, account.account_name)}
                  disabled={downloadingId !== null}
                  size="small"
                  sx={{ color: 'primary.main', mr: 1 }}
                  title="画像をすべてダウンロード"
                >
                  {downloadingId === account.id ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faDownload} />
                  )}
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleRemove(account.id)}
                  size="small"
                  sx={{ color: 'error.main' }}
                  disabled={downloadingId !== null}
                  title="連携解除"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      <Button
        id="instagram-connect-btn"
        variant="outlined"
        startIcon={<FontAwesomeIcon icon={faPlus} />}
        onClick={handleOpenDialog}
        fullWidth
      >
        Instagramアカウントを追加
      </Button>

      {/* ログインダイアログ */}
      <Dialog open={openDialog} onClose={() => !isConnecting && setOpenDialog(false)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={handleConnect}>
          <DialogTitle>{mode === 'sessionid' ? 'sessionidで連携' : 'Instagramログイン'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {connectError && <Alert severity="error">{connectError}</Alert>}

            {mode === 'password' ? (
              <>
                <TextField
                  label="ユーザー名"
                  variant="outlined"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isConnecting || show2FA}
                  required
                />

                <TextField
                  label="パスワード"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isConnecting || show2FA}
                  required
                />

                {show2FA && (
                  <TextField
                    label="2FA確認コード"
                    variant="outlined"
                    fullWidth
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={isConnecting}
                    required
                    placeholder="6桁のコード"
                    helperText="認証アプリまたはSMSのコードを入力してください"
                  />
                )}

                <Button variant="text" size="small" onClick={() => { setMode('sessionid'); setConnectError(null); }} disabled={isConnecting}>
                  Facebookログイン等でログインできない場合はこちら
                </Button>
              </>
            ) : (
              <>
                <TextField
                  label="sessionid"
                  variant="outlined"
                  fullWidth
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  disabled={isConnecting}
                  required
                  multiline
                  minRows={2}
                  placeholder="ブラウザのCookie 'sessionid' の値"
                  helperText="PCブラウザでinstagram.comにログイン→開発者ツール→Application→Cookies→sessionid をコピー"
                />

                <Button variant="text" size="small" onClick={() => { setMode('password'); setConnectError(null); }} disabled={isConnecting}>
                  ユーザー名・パスワードで連携する
                </Button>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} disabled={isConnecting}>
              キャンセル
            </Button>
            <Button type="submit" variant="contained" disabled={isConnecting}>
              {isConnecting ? <CircularProgress size={20} color="inherit" /> : show2FA ? 'コードを送信' : '連携'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

const listItemStyle = {
  borderRadius: 2,
  mb: 1,
  backgroundColor: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
} as const;
