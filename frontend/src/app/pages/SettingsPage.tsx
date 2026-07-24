import { Box, Typography, Button, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faRightFromBracket, faSliders } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';

/** 設定ページ */
export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>設定</Typography>

      <Box sx={sectionStyle}>
        <Typography variant="body2" color="text.secondary">アカウント</Typography>
        <Typography>{user?.email}</Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      <Button
        id="settings-instagram"
        variant="outlined"
        startIcon={<FontAwesomeIcon icon={faInstagram} />}
        onClick={() => navigate('/settings/instagram')}
        fullWidth
        sx={{ justifyContent: 'flex-start', py: 1.5 }}
      >
        Instagram連携管理
      </Button>

      <Button
        id="settings-presets"
        variant="outlined"
        startIcon={<FontAwesomeIcon icon={faSliders} />}
        onClick={() => navigate('/settings/presets')}
        fullWidth
        sx={{ justifyContent: 'flex-start', py: 1.5 }}
      >
        プリセット管理
      </Button>

      <Box sx={{ flex: 1 }} />

      <Button
        id="settings-logout"
        variant="text"
        startIcon={<FontAwesomeIcon icon={faRightFromBracket} />}
        onClick={logout}
        sx={{ color: 'error.main', justifyContent: 'flex-start' }}
      >
        ログアウト
      </Button>
    </Box>
  );
}

const sectionStyle = {
  p: 2,
  borderRadius: 2,
  backgroundColor: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
} as const;
