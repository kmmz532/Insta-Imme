import { useState } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { CameraView } from '../../components/camera/CameraView';
import { PhotoPreview } from '../../components/camera/PhotoPreview';
import { PostEditor } from '../../components/post/PostEditor';
import * as postService from '../../services/postService';
import * as instagramService from '../../services/instagramService';

type CameraPageState = 'camera' | 'preview' | 'edit';

/** カメラページ - 撮影 → プレビュー → 投稿編集 / 即投稿トグル制御 */
export function CameraPage() {
  const [state, setState] = useState<CameraPageState>('camera');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

  // 即投稿関連のステート
  const [isInstantPost, setIsInstantPost] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'error'>('info');

  const handlePhotoTaken = async (blob: Blob) => {
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

        // デフォルトとしてプリセットが割り当てられているアカウントを探す。なければ最初のアカウント
        const targetAccount = accounts.find((a) => a.preset_id) || accounts[0];
        if (!targetAccount) return;

        // アップロード実行
        const { imageId } = await postService.uploadImage(blob);
        
        // 投稿実行 (キャプションは空で渡すことで、バックエンド側で割り当てプリセットから自動生成させる)
        await postService.publishPost(imageId, targetAccount.id, '');

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
      setState('preview');
    }
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
        <PostEditor photoBlob={photoBlob} onBack={handleBackToCamera} />
      )}

      {/* 即投稿の進行・成否を知らせるトースト */}
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
