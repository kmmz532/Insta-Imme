import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  Alert,
  CircularProgress,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight, faCircleCheck, faCircleXmark, faSpinner, faClock } from '@fortawesome/free-solid-svg-icons';
import * as postService from '../../services/postService';
import * as instagramService from '../../services/instagramService';
import type { PostState } from '../../types/post';
import type { InstagramAccount } from '../../types/instagram';

export function PostHistoryList() {
  const [history, setHistory] = useState<PostState[]>([]);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [histList, accList] = await Promise.all([
        postService.fetchHistory(),
        instagramService.fetchAccounts(),
      ]);
      setHistory(histList);
      setAccounts(accList);
    } catch (err) {
      setError(err instanceof Error ? err.message : '履歴の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getAccountName = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    return acc ? `@${acc.account_name}` : '不明なアカウント';
  };

  const handleRetry = async (item: PostState) => {
    if (!item.image_id) {
      setError('画像データが失われているため再投稿できません');
      return;
    }
    
    setRetryingId(item.id);
    setError(null);
    
    try {
      await postService.publishPost(item.image_id, item.instagram_account_id, item.caption);
      // 再読み込み
      const histList = await postService.fetchHistory();
      setHistory(histList);
    } catch (err) {
      setError(err instanceof Error ? err.message : '再投稿に失敗しました');
    } finally {
      setRetryingId(null);
    }
  };

  const renderStatus = (status: PostState['status']) => {
    switch (status) {
      case 'success':
        return <Chip size="small" icon={<FontAwesomeIcon icon={faCircleCheck} />} label="成功" color="success" />;
      case 'failed':
        return <Chip size="small" icon={<FontAwesomeIcon icon={faCircleXmark} />} label="失敗" color="error" />;
      case 'publishing':
        return <Chip size="small" icon={<FontAwesomeIcon icon={faSpinner} spin />} label="投稿中" color="warning" />;
      case 'uploading':
        return <Chip size="small" icon={<FontAwesomeIcon icon={faSpinner} spin />} label="アップロード中" color="info" />;
      default:
        return <Chip size="small" icon={<FontAwesomeIcon icon={faClock} />} label="待機中" color="default" />;
    }
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto', height: '100%' }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        投稿履歴
      </Typography>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : history.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          これまでの投稿履歴はありません
        </Typography>
      ) : (
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {history.map((item) => (
            <Card key={item.id} sx={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" color="primary">
                    {getAccountName(item.instagram_account_id)}
                  </Typography>
                  {renderStatus(item.status)}
                </Box>
                
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1.5, color: 'text.primary' }}>
                  {item.caption || '(キャプションなし)'}
                </Typography>
                
                <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {item.posted_at 
                      ? new Date(item.posted_at).toLocaleString('ja-JP') 
                      : '未投稿'
                    }
                  </Typography>
                  
                  {item.status === 'failed' && item.image_id && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      startIcon={<FontAwesomeIcon icon={faRotateRight} />}
                      onClick={() => handleRetry(item)}
                      disabled={retryingId === item.id}
                    >
                      {retryingId === item.id ? <CircularProgress size={16} color="inherit" /> : '再投稿'}
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </List>
      )}
    </Box>
  );
}
