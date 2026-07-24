import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CaptionEditor } from './CaptionEditor';
import { PostConfirm } from './PostConfirm';
import * as postService from '../../services/postService';
import * as instagramService from '../../services/instagramService';
import type { InstagramAccount } from '../../types/instagram';

import type { LocationData } from '../../app/pages/CameraPage';

interface PostEditorProps {
  photoBlob: Blob;
  locationData: LocationData | null;
  onBack: () => void;
}

/** 投稿編集画面 - 写真プレビュー + キャプション編集 + 投稿実行 */
export function PostEditor({ photoBlob, locationData, onBack }: PostEditorProps) {
  const navigate = useNavigate();
  const [caption, setCaption] = useState('');
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const photoUrl = useMemo(() => URL.createObjectURL(photoBlob), [photoBlob]);

  useEffect(() => {
    instagramService.fetchAccounts().then((list) => {
      setAccounts(list);
      if (list.length > 0 && list[0]) setSelectedAccountId(list[0].id);
    });
  }, []);

  const handlePublish = async () => {
    if (!selectedAccountId) {
      setError('Instagramアカウントを連携してください');
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const { imageId } = await postService.uploadImage(photoBlob);
      await postService.publishPost(
        imageId,
        selectedAccountId,
        caption,
        locationData?.latitude,
        locationData?.longitude,
        locationData?.locationName
      );
      setSuccess(true);
      setShowConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '投稿に失敗しました');
      setShowConfirm(false);
    } finally {
      setIsPublishing(false);
    }
  };

  if (success) {
    return (
      <Box sx={successContainerStyle} className="fade-in">
        <Typography variant="h5" sx={{ mb: 2 }}>🎉 投稿完了！</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Instagramへの投稿が完了しました
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          カメラに戻る
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={containerStyle}>
      <Box sx={headerStyle}>
        <Button onClick={onBack} sx={{ color: 'text.secondary' }}>← 戻る</Button>
        <Typography variant="h6">投稿編集</Typography>
        <Box sx={{ width: 60 }} />
      </Box>

      <Box sx={contentStyle}>
        <Box component="img" src={photoUrl} alt="投稿写真" sx={previewStyle} />

        {error && <Alert severity="error" sx={{ mx: 2 }}>{error}</Alert>}

        <CaptionEditor
          caption={caption}
          onCaptionChange={setCaption}
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onAccountChange={setSelectedAccountId}
        />

        <Box sx={actionStyle}>
          <Button
            id="post-publish"
            variant="contained"
            size="large"
            fullWidth
            onClick={() => setShowConfirm(true)}
            disabled={isPublishing || !selectedAccountId}
          >
            {isPublishing ? <CircularProgress size={24} color="inherit" /> : 'Instagramに投稿'}
          </Button>
        </Box>
      </Box>

      {showConfirm && (
        <PostConfirm
          onConfirm={handlePublish}
          onCancel={() => setShowConfirm(false)}
          isPublishing={isPublishing}
        />
      )}
    </Box>
  );
}

const containerStyle = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'background.default',
} as const;

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: 1,
  py: 1.5,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
} as const;

const contentStyle = {
  flex: 1,
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
} as const;

const previewStyle = {
  width: '100%',
  maxHeight: 300,
  objectFit: 'contain',
  backgroundColor: '#000',
} as const;

const actionStyle = { px: 2, py: 2, pb: 'calc(16px + env(safe-area-inset-bottom, 0px))' } as const;

const successContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  textAlign: 'center',
} as const;
