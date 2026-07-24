import { Box, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera,
  faCameraRotate,
  faBolt,
} from '@fortawesome/free-solid-svg-icons';

interface CameraControlsProps {
  isReady: boolean;
  facingMode: 'user' | 'environment';
  onShutter: () => void;
  onSwitchCamera: () => void;
}

/** カメラ操作UI - シャッター、カメラ切替、フラッシュ */
export function CameraControls({
  isReady,
  onShutter,
  onSwitchCamera,
}: CameraControlsProps) {
  return (
    <Box sx={controlsContainerStyle}>
      {/* フラッシュボタン（Phase 1では表示のみ） */}
      <IconButton
        id="camera-flash"
        sx={sideButtonStyle}
        disabled
      >
        <FontAwesomeIcon icon={faBolt} />
      </IconButton>

      {/* シャッターボタン */}
      <IconButton
        id="camera-shutter"
        onClick={onShutter}
        disabled={!isReady}
        sx={shutterButtonStyle}
      >
        <FontAwesomeIcon icon={faCamera} size="lg" />
      </IconButton>

      {/* カメラ切替ボタン */}
      <IconButton
        id="camera-switch"
        onClick={onSwitchCamera}
        disabled={!isReady}
        sx={sideButtonStyle}
      >
        <FontAwesomeIcon icon={faCameraRotate} />
      </IconButton>
    </Box>
  );
}

const controlsContainerStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  py: 4,
  pb: 'calc(16px + env(safe-area-inset-bottom, 0px))',
  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
} as const;

const shutterButtonStyle = {
  width: 72,
  height: 72,
  border: '3px solid rgba(255,255,255,0.9)',
  background: 'linear-gradient(135deg, #E040FB 0%, #FF6D00 100%)',
  color: '#fff',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.08)',
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
  '&.Mui-disabled': {
    opacity: 0.4,
    border: '3px solid rgba(255,255,255,0.3)',
  },
} as const;

const sideButtonStyle = {
  width: 48,
  height: 48,
  color: 'rgba(255,255,255,0.85)',
  backgroundColor: 'rgba(255,255,255,0.1)',
  backdropFilter: 'blur(10px)',
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  '&.Mui-disabled': {
    color: 'rgba(255,255,255,0.3)',
  },
} as const;
