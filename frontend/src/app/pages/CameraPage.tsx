import { useState } from 'react';
import { Box } from '@mui/material';
import { CameraView } from '../../components/camera/CameraView';
import { PhotoPreview } from '../../components/camera/PhotoPreview';
import { PostEditor } from '../../components/post/PostEditor';

type CameraPageState = 'camera' | 'preview' | 'edit';

/** カメラページ - 撮影 → プレビュー → 投稿編集 */
export function CameraPage() {
  const [state, setState] = useState<CameraPageState>('camera');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

  const handlePhotoTaken = (blob: Blob) => {
    setPhotoBlob(blob);
    setState('preview');
  };

  const handleRetake = () => {
    setPhotoBlob(null);
    setState('camera');
  };

  const handleUse = () => {
    setState('edit');
  };

  const handleBackToCamera = () => {
    setPhotoBlob(null);
    setState('camera');
  };

  return (
    <Box sx={{ height: '100%' }}>
      {state === 'camera' && <CameraView onPhotoTaken={handlePhotoTaken} />}
      {state === 'preview' && photoBlob && (
        <PhotoPreview
          photoBlob={photoBlob}
          onUse={handleUse}
          onRetake={handleRetake}
        />
      )}
      {state === 'edit' && photoBlob && (
        <PostEditor photoBlob={photoBlob} onBack={handleBackToCamera} />
      )}
    </Box>
  );
}
