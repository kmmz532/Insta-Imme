import { useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';

interface PhotoPreviewProps {
  photoBlob: Blob;
  onUse: () => void;
  onRetake: () => void;
}

/** 撮影プレビュー - 「使う」「撮り直し」の選択 */
export function PhotoPreview({ photoBlob, onUse, onRetake }: PhotoPreviewProps) {
  const photoUrl = useMemo(() => URL.createObjectURL(photoBlob), [photoBlob]);

  return (
    <Box sx={containerStyle}>
      <Box
        component="img"
        src={photoUrl}
        alt="撮影した写真"
        sx={imageStyle}
      />
      <Box sx={overlayStyle}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          この写真を使いますか？
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            id="photo-retake"
            variant="outlined"
            size="large"
            onClick={onRetake}
            sx={retakeButtonStyle}
          >
            撮り直し
          </Button>
          <Button
            id="photo-use"
            variant="contained"
            size="large"
            onClick={onUse}
          >
            この写真を使う
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

const containerStyle = {
  position: 'relative',
  width: '100%',
  height: '100%',
  backgroundColor: '#000',
} as const;

const imageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
} as const;

const overlayStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  py: 4,
  pb: 'calc(16px + env(safe-area-inset-bottom, 0px))',
  backgroundColor: 'rgba(0,0,0,0.7)',
} as const;

const retakeButtonStyle = {
  borderColor: 'rgba(255,255,255,0.5)',
  color: '#fff',
  '&:hover': {
    borderColor: '#fff',
  },
} as const;
