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
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import * as instagramService from '../../services/instagramService';
import type { InstagramAccount } from '../../types/instagram';

/** Instagram連携アカウント管理 */
export function AccountList() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => { loadAccounts(); }, []);

  const handleConnect = async () => {
    try {
      const { url } = await instagramService.getAuthUrl();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : '連携URLの取得に失敗しました');
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
                  edge="end"
                  onClick={() => handleRemove(account.id)}
                  size="small"
                  sx={{ color: 'error.main' }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      <Button
        id="instagram-connect"
        variant="outlined"
        startIcon={<FontAwesomeIcon icon={faPlus} />}
        onClick={handleConnect}
        fullWidth
      >
        Instagramアカウントを追加
      </Button>
    </Box>
  );
}

const listItemStyle = {
  borderRadius: 2,
  mb: 1,
  backgroundColor: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
} as const;
