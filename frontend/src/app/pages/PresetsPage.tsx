import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PresetManager } from '../../components/preset/PresetManager';

export function PresetsPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={headerStyle}>
        <Button onClick={() => navigate('/settings')} sx={{ color: 'text.secondary' }}>
          ← 設定
        </Button>
        <Typography variant="h6">プリセット管理</Typography>
        <Box sx={{ width: 60 }} />
      </Box>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <PresetManager />
      </Box>
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
