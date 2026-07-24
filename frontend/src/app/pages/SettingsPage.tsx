import { useState, useEffect } from 'react';
import { Box, Typography, Button, Divider, FormControlLabel, Switch } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faRightFromBracket, faSliders } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';

/** 設定ページ - GPS設定トグル、プリセット、連携管理 */
export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [gpsEnabled, setGpsEnabled] = useState(false);

  useEffect(() => {
    const enabled = localStorage.getItem('gps_enabled') === 'true';
    setGpsEnabled(enabled);
  }, []);

  const handleGpsToggle = (val: boolean) => {
    setGpsEnabled(val);
    localStorage.setItem('gps_enabled', String(val));
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>設定</Typography>

      <Box sx={sectionStyle}>
        <Typography variant="body2" color="text.secondary">アカウント</Typography>
        <Typography sx={{ fontWeight: 500 }}>{user?.email}</Typography>
      </Box>

      {/* 位置情報設定セクション */}
      <Box sx={sectionStyle}>
        <FormControlLabel
          control={
            <Switch
              id="settings-gps-toggle"
              checked={gpsEnabled}
              onChange={(e) => handleGpsToggle(e.target.checked)}
            />
          }
          label="位置情報 (GPS) の利用"
        />
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          ONの場合、撮影時に位置情報を自動取得し、キャプションや透かしに適用します。
        </Typography>
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
