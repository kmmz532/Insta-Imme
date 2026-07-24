import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AccountList } from '../../components/instagram/AccountList';

/** Instagram連携ページ */
export function InstagramPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={headerStyle}>
        <Button onClick={() => navigate('/settings')} sx={{ color: 'text.secondary' }}>
          ← 設定
        </Button>
        <Typography variant="h6">Instagram連携</Typography>
        <Box sx={{ width: 60 }} />
      </Box>
      <AccountList />
    </Box>
  );
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: 1,
  py: 1.5,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
} as const;
