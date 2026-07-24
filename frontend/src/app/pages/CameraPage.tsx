import { useState } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { CameraView } from '../../components/camera/CameraView';
import { PhotoPreview } from '../../components/camera/PhotoPreview';
import { PostEditor } from '../../components/post/PostEditor';
import { useLocation } from '../../hooks/useLocation';
import * as postService from '../../services/postService';
import * as instagramService from '../../services/instagramService';

type CameraPageState = 'camera' | 'preview' | 'edit';

export interface LocationData {
  latitude: number;
  longitude: number;
  locationName: string;
}

/** カメラページ - GPS、即投稿、通常投稿遷移 */
export function CameraPage() {
  const [state, setState] = useState<CameraPageState>('camera');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

  // GPS関連
  const { fetchLocation } = useLocation();
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  // 即投稿関連のステート
  const [isInstantPost, setIsInstantPost] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'error'>('info');

  const handlePhotoTaken = async (blob: Blob) => {
    const isGpsEnabled = localStorage.getItem('gps_enabled') === 'true';
    let loc: LocationData | null = null;
    
    if (isGpsEnabled) {
      setSnackbarSeverity('info');
      setSnackbarMessage('位置情報を取得中...');
      setSnackbarOpen(true);
      loc = await fetchLocation();
    }

    if (isInstantPost) {
      // 即投稿モード: プレビュー画面へ遷移せず、裏で投稿処理を実行
      setSnackbarSeverity('info');
      setSnackbarMessage('即投稿処理を開始しました...');
      setSnackbarOpen(true);

      try {
        const accounts = await instagramService.fetchAccounts();
        if (accounts.length === 0) {
          throw new Error('連携されているInstagramアカウントがありません。設定から連携してください。');
        }

        const targetAccount = accounts.find((a) => a.preset_id) || accounts[0];
        if (!targetAccount) return;

        // アップロード実行
        const { imageId } = await postService.uploadImage(blob);
        
        // 投稿実行 (GPS位置情報パラメータを引き渡す)
        await postService.publishPost(
          imageId,
          targetAccount.id,
          '',
          loc?.latitude,
          loc?.longitude,
          loc?.locationName
        );

        setSnackbarSeverity('success');
        setSnackbarMessage(`投稿完了 (@${targetAccount.account_name})`);
        setSnackbarOpen(true);
      } catch (err) {
        setSnackbarSeverity('error');
        setSnackbarMessage(err instanceof Error ? err.message : '即投稿に失敗しました');
        setSnackbarOpen(true);
      }
    } else {
      // 通常投稿モード
      setPhotoBlob(blob);
      setLocationData(loc);
      setState('preview');
    }
  };

  const handleRetake = () => {
    setPhotoBlob(null);
    setLocationData(null);
    setState('camera');
  };

  const handleUse = () => {
    setState('edit');
  };

  const handleBackToCamera = () => {
    setPhotoBlob(null);
    setLocationData(null);
    setState('camera');
  };

  return (
    <Box sx={{ height: '100%' }}>
      {state === 'camera' && (
        <CameraView
          onPhotoTaken={handlePhotoTaken}
          isInstantPost={isInstantPost}
          onInstantPostChange={setIsInstantPost}
        />
      )}
      {state === 'preview' && photoBlob && (
        <PhotoPreview
          photoBlob={photoBlob}
          onUse={handleUse}
          onRetake={handleRetake}
        />
      )}
      {state === 'edit' && photoBlob && (
        <PostEditor
          photoBlob={photoBlob}
          locationData={locationData}
          onBack={handleBackToCamera}
        />
      )}

      {/* スナックバー */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
