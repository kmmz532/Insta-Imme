import { useState, useEffect } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { CameraView } from '../../components/camera/CameraView';
import { PhotoPreview } from '../../components/camera/PhotoPreview';
import { PostEditor } from '../../components/post/PostEditor';
import { useLocation } from '../../hooks/useLocation';
import * as instagramService from '../../services/instagramService';
import * as presetService from '../../services/presetService';
import { enqueuePost, subscribePostQueue } from '../../lib/postQueue';
import type { WatermarkSettings } from '../../types/preset';

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

  const notify = (message: string, severity: 'success' | 'info' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // 投稿キューの進行状況をスナックバーに反映（バックグラウンド投稿の通知）
  useEffect(() => {
    return subscribePostQueue((e) => {
      const severity = e.status === 'success' ? 'success' : e.status === 'error' ? 'error' : 'info';
      notify(e.message, severity);
    });
  }, []);

  const handlePhotoTaken = async (blob: Blob) => {
    const isGpsEnabled = localStorage.getItem('gps_enabled') === 'true';
    let loc: LocationData | null = null;

    if (isGpsEnabled) {
      notify('位置情報を取得中...', 'info');
      loc = await fetchLocation();
    }

    if (isInstantPost) {
      // 即投稿モード: プレビューを挟まずキューに投入（バックグラウンドで投稿）
      try {
        const [accounts, presets] = await Promise.all([
          instagramService.fetchAccounts(),
          presetService.fetchPresets(),
        ]);
        if (accounts.length === 0) {
          throw new Error('連携されているInstagramアカウントがありません。設定から連携してください。');
        }

        const targetAccount = accounts.find((a) => a.preset_id) || accounts[0];
        if (!targetAccount) return;

        const watermark: WatermarkSettings | null = targetAccount.preset_id
          ? presets.find((p) => p.id === targetAccount.preset_id)?.watermark ?? null
          : null;

        enqueuePost({
          id: crypto.randomUUID(),
          blob,
          accountId: targetAccount.id,
          accountName: targetAccount.account_name,
          caption: '',
          latitude: loc?.latitude,
          longitude: loc?.longitude,
          locationName: loc?.locationName,
          watermark,
        });
      } catch (err) {
        notify(err instanceof Error ? err.message : '即投稿に失敗しました', 'error');
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

      {/* スナックバー（GPS取得・投稿キューの進行通知） */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
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
