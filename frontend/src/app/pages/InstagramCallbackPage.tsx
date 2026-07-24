import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import * as instagramService from '../../services/instagramService';

/** Instagram OAuthコールバックページ */
export function InstagramCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('認証コードが見つかりません');
      return;
    }

    instagramService
      .handleCallback(code)
      .then(() => navigate('/settings/instagram', { replace: true }))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Instagram連携に失敗しました');
      });
  }, [searchParams, navigate]);

  return (
    <Box sx={containerStyle}>
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Instagram連携処理中...</Typography>
        </>
      )}
    </Box>
  );
}

const containerStyle = {
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
} as const;
