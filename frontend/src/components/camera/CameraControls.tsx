import { Box, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera,
  faCameraRotate,
  faBolt,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';

interface CameraControlsProps {
  isReady: boolean;
  facingMode: 'user' | 'environment';
  onShutter: () => void;
  onSwitchCamera: () => void;
  isInstantPost: boolean;
  onInstantPostChange: (val: boolean) => void;
  torchSupported: boolean;
  torchEnabled: boolean;
  onToggleTorch: () => void;
}

/** カメラ操作UI - シャッター、カメラ切替、フラッシュ、即投稿トグル */
export function CameraControls({
  isReady,
  onShutter,
  onSwitchCamera,
  isInstantPost,
  onInstantPostChange,
  torchSupported,
  torchEnabled,
  onToggleTorch,
}: CameraControlsProps) {
  return (
    <Box sx={controlsContainerStyle}>
      {/* 即投稿トグルボタン（紙飛行機マーク）。ONで撮影後すぐ投稿 */}
      <IconButton
        id="camera-instant"
        aria-label="即投稿モード"
        onClick={() => onInstantPostChange(!isInstantPost)}
        sx={{
          ...sideButtonStyle,
          backgroundColor: isInstantPost ? '#FF6D00' : 'rgba(255,255,255,0.1)',
          color: isInstantPost ? '#fff' : 'rgba(255,255,255,0.85)',
          boxShadow: isInstantPost ? '0 0 12px rgba(255,109,0,0.5)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: isInstantPost ? '#FF9E40' : 'rgba(255,255,255,0.2)',
          }
        }}
      >
        <FontAwesomeIcon icon={faPaperPlane} />
      </IconButton>

      {/* フラッシュ(トーチ)トグル。対応端末でのみ表示 */}
      {torchSupported && (
        <IconButton
          id="camera-torch"
          aria-label="フラッシュ"
          onClick={onToggleTorch}
          sx={{
            ...sideButtonStyle,
            backgroundColor: torchEnabled ? '#FFD54F' : 'rgba(255,255,255,0.1)',
            color: torchEnabled ? '#1a1a1a' : 'rgba(255,255,255,0.85)',
            boxShadow: torchEnabled ? '0 0 12px rgba(255,213,79,0.6)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: torchEnabled ? '#FFE082' : 'rgba(255,255,255,0.2)',
            }
          }}
        >
          <FontAwesomeIcon icon={faBolt} />
        </IconButton>
      )}

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
  backgroundColor: 'rgba(0,0,0,0.6)',
} as const;

const shutterButtonStyle = {
  width: 72,
  height: 72,
  border: '3px solid rgba(255,255,255,0.9)',
  backgroundColor: '#E040FB',
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
