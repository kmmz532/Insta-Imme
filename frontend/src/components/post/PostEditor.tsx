import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { CaptionEditor } from './CaptionEditor';
import { PostConfirm } from './PostConfirm';
import * as instagramService from '../../services/instagramService';
import * as presetService from '../../services/presetService';
import { enqueuePost } from '../../lib/postQueue';
import { expandTemplate } from '../../lib/watermark';
import type { InstagramAccount } from '../../types/instagram';
import type { Preset, WatermarkSettings } from '../../types/preset';

import type { LocationData } from '../../app/pages/CameraPage';

interface PostEditorProps {
  photoBlob: Blob;
  locationData: LocationData | null;
  onBack: () => void;
}

/** 投稿編集画面 - 写真プレビュー(透かし込み) + キャプション編集 + 投稿予約 */
export function PostEditor({ photoBlob, locationData, onBack }: PostEditorProps) {
  const [caption, setCaption] = useState('');
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoUrl = useMemo(() => URL.createObjectURL(photoBlob), [photoBlob]);

  useEffect(() => {
    Promise.all([instagramService.fetchAccounts(), presetService.fetchPresets()])
      .then(([accList, presetList]) => {
        setAccounts(accList);
        setPresets(presetList);
        if (accList.length > 0 && accList[0]) setSelectedAccountId(accList[0].id);
      })
      .catch(() => setError('アカウント情報の取得に失敗しました'));
  }, []);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || null;

  // 選択アカウントに割り当てられたプリセットの透かし設定を求める
  const watermark: WatermarkSettings | null = useMemo(() => {
    if (!selectedAccount?.preset_id) return null;
    const preset = presets.find((p) => p.id === selectedAccount.preset_id);
    return preset?.watermark ?? null;
  }, [selectedAccount, presets]);

  // 透かしプレビュー用のテキスト（変数を実値展開）
  const watermarkText = useMemo(() => {
    if (!watermark?.enabled || !watermark.text) return '';
    return expandTemplate(watermark.text, {
      account: selectedAccount?.account_name,
      latitude: locationData?.latitude,
      longitude: locationData?.longitude,
      locationName: locationData?.locationName,
    });
  }, [watermark, selectedAccount, locationData]);

  const handleConfirm = () => {
    if (!selectedAccount) {
      setError('Instagramアカウントを連携してください');
      setShowConfirm(false);
      return;
    }

    // 投稿をキューに追加し、すぐカメラに戻る（アップロードはバックグラウンドで進行）
    enqueuePost({
      id: crypto.randomUUID(),
      blob: photoBlob,
      accountId: selectedAccount.id,
      accountName: selectedAccount.account_name,
      caption,
      latitude: locationData?.latitude,
      longitude: locationData?.longitude,
      locationName: locationData?.locationName,
      watermark,
    });

    setShowConfirm(false);
    onBack();
  };

  return (
    <Box sx={containerStyle}>
      <Box sx={headerStyle}>
        <Button onClick={onBack} sx={{ color: 'text.secondary' }}>← 戻る</Button>
        <Typography variant="h6">投稿編集</Typography>
        <Box sx={{ width: 60 }} />
      </Box>

      <Box sx={contentStyle}>
        {/* 透かし込みプレビュー（実際の焼き込みは投稿処理時） */}
        <Box sx={previewWrapperStyle}>
          <Box sx={previewInnerStyle}>
            <Box component="img" src={photoUrl} alt="投稿写真" sx={previewImageStyle} />
            {watermark?.enabled && watermarkText && (
              <Box sx={{ ...watermarkOverlayStyle, ...positionSx(watermark.position), fontSize: `calc(${watermark.font_size || 1} / 1080 * 100cqw)` }}>
                {watermarkText}
              </Box>
            )}
          </Box>
        </Box>

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
            disabled={!selectedAccountId}
          >
            Instagramに投稿
          </Button>
        </Box>
      </Box>

      {showConfirm && (
        <PostConfirm
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
          isPublishing={false}
        />
      )}
    </Box>
  );
}

/** 透かしオーバーレイの配置（cqw基準でプレビュー画像幅に追従） */
function positionSx(position: WatermarkSettings['position']) {
  const m = '2.7cqw';
  if (position === 'top_left') return { top: m, left: m };
  if (position === 'top_right') return { top: m, right: m };
  if (position === 'bottom_left') return { bottom: m, left: m };
  if (position === 'bottom_right') return { bottom: m, right: m };
  return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
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

const previewWrapperStyle = {
  display: 'flex',
  justifyContent: 'center',
  backgroundColor: '#000',
  py: 1,
} as const;

const previewInnerStyle = {
  position: 'relative',
  display: 'inline-block',
  containerType: 'inline-size',
  maxWidth: '100%',
} as const;

const previewImageStyle = {
  display: 'block',
  height: '38vh',
  maxWidth: '100%',
  objectFit: 'contain',
} as const;

const watermarkOverlayStyle = {
  position: 'absolute',
  color: '#fff',
  fontWeight: 600,
  lineHeight: 1.1,
  whiteSpace: 'pre',
  maxWidth: '94cqw',
  pointerEvents: 'none',
  textShadow: '1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000',
} as const;

const actionStyle = { px: 2, py: 2, pb: 'calc(16px + env(safe-area-inset-bottom, 0px))' } as const;
