import { useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faGear, faHistory } from '@fortawesome/free-solid-svg-icons';

/** ボトムナビゲーション - カメラ / 履歴 / 設定 */
export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  let currentValue = 'camera';
  if (location.pathname.startsWith('/settings')) {
    currentValue = 'settings';
  } else if (location.pathname.startsWith('/history')) {
    currentValue = 'history';
  }

  return (
    <Paper
      sx={containerStyle}
      elevation={0}
    >
      <BottomNavigation
        value={currentValue}
        onChange={(_, value: string) => {
          if (value === 'camera') navigate('/');
          if (value === 'history') navigate('/history');
          if (value === 'settings') navigate('/settings');
        }}
        sx={navStyle}
      >
        <BottomNavigationAction
          id="nav-camera"
          label="カメラ"
          value="camera"
          icon={<FontAwesomeIcon icon={faCamera} />}
        />
        <BottomNavigationAction
          id="nav-history"
          label="履歴"
          value="history"
          icon={<FontAwesomeIcon icon={faHistory} />}
        />
        <BottomNavigationAction
          id="nav-settings"
          label="設定"
          value="settings"
          icon={<FontAwesomeIcon icon={faGear} />}
        />
      </BottomNavigation>
    </Paper>
  );
}

const containerStyle = {
  borderTop: '1px solid rgba(255,255,255,0.06)',
  backgroundColor: 'rgba(10, 10, 15, 0.95)',
  backdropFilter: 'blur(20px)',
  pb: 'env(safe-area-inset-bottom, 0px)',
} as const;

const navStyle = {
  backgroundColor: 'transparent',
  '& .MuiBottomNavigationAction-root': {
    color: 'rgba(255,255,255,0.4)',
    '&.Mui-selected': {
      color: '#E040FB',
    },
  },
} as const;
