import { useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideoSlash } from '@fortawesome/free-solid-svg-icons';
import { useCamera } from '../../hooks/useCamera';
import { CameraControls } from './CameraControls';

interface CameraViewProps {
  onPhotoTaken: (blob: Blob) => void;
  isInstantPost: boolean;
  onInstantPostChange: (val: boolean) => void;
}

/** &カメラビュー - 全画面カメラプレビュー */
export function CameraView({
  onPhotoTaken,
  isInstantPost,
  onInstantPostChange,
}: CameraViewProps) {
  const {
    videoRef,
    isReady,
    facingMode,
    error,
    startCamera,
    stopCamera,
    switchCamera,
    takePhoto,
  } = useCamera();

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleShutter = async () => {
    const blob = await takePhoto();
    if (blob) onPhotoTaken(blob);
  };

  if (error) {
    return (
      <Box sx={errorContainerStyle}>
        <FontAwesomeIcon icon={faVideoSlash} size="3x" style={{ opacity: 0.5 }} />
        <Typography color="error" sx={{ mt: 2, mb: 3, textAlign: 'center', px: 3 }}>{error}</Typography>
        <Button variant="outlined" onClick={startCamera}>再試行</Button>
      </Box>
    );
  }

  return (
    <Box sx={containerStyle}>
      <Box
        component="video"
        ref={videoRef}
        autoPlay
        playsInline
        muted
        sx={videoStyle}
      />
      {!isReady && (
        <Box sx={loadingOverlayStyle}>
          <CircularProgress />
          <Typography color="text.secondary" sx={{ mt: 2 }}>カメラを起動中...</Typography>
        </Box>
      )}
      <CameraControls
        isReady={isReady}
        facingMode={facingMode}
        onShutter={handleShutter}
        onSwitchCamera={switchCamera}
        isInstantPost={isInstantPost}
        onInstantPostChange={onInstantPostChange}
      />
    </Box>
  );
}

const containerStyle = {
  position: 'relative',
  width: '100%',
  height: '100%',
  backgroundColor: '#000',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

// 撮影と同じ 4:5 枠で表示してWYSIWYGにする
const videoStyle = {
  width: '100%',
  aspectRatio: '4 / 5',
  maxHeight: '100%',
  objectFit: 'cover',
  display: 'block',
} as const;

const loadingOverlayStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#000',
} as const;

const errorContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: 'text.secondary',
} as const;
