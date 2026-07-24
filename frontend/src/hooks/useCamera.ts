import { useRef, useState, useCallback, useEffect } from 'react';

type FacingMode = 'user' | 'environment';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  facingMode: FacingMode;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => Promise<void>;
  takePhoto: () => Promise<Blob | null>;
}

/** 設定で選択された優先カメラのdeviceIdを保存するlocalStorageキー */
export const CAMERA_DEVICE_KEY = 'camera_device_id';

/** カメラ制御フック */
export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  // 設定で特定カメラが選ばれていればそのdeviceIdを優先する(前面/背面トグルより優先)
  const [deviceId, setDeviceId] = useState<string | null>(
    () => localStorage.getItem(CAMERA_DEVICE_KEY) || null
  );
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    stopCamera();

    try {
      // 設定で特定カメラが選ばれていればdeviceIdを優先、無ければ前面/背面(facingMode)
      const videoConstraints: MediaTrackConstraints = deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
        : { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
      } catch (constraintErr) {
        // 指定カメラ/前面背面が無い端末(PC等)では制約を外して再試行する
        if (constraintErr instanceof DOMException && constraintErr.name === 'NotAllowedError') {
          throw constraintErr;
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'カメラへのアクセスが拒否されました'
          : 'カメラの起動に失敗しました';
      setError(message);
    }
  }, [facingMode, deviceId, stopCamera]);

  const switchCamera = useCallback(async () => {
    // トグルは前面/背面を切り替える。特定カメラ選択より優先させるためdeviceId指定を解除する
    setDeviceId(null);
    const next: FacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
  }, [facingMode]);

  /** facingMode/deviceId変更時にカメラを再起動 */
  useEffect(() => {
    if (streamRef.current) {
      startCamera();
    }
  }, [facingMode, deviceId]);

  const takePhoto = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video) return null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;

    // Instagram向けに 4:5 (幅:高さ) で中央クロップして撮影する
    const TARGET_RATIO = 4 / 5;
    const currentRatio = vw / vh;
    let sx = 0;
    let sy = 0;
    let sw = vw;
    let sh = vh;
    if (currentRatio > TARGET_RATIO) {
      // 横に広い → 幅を削る
      sw = Math.round(vh * TARGET_RATIO);
      sx = Math.round((vw - sw) / 2);
    } else if (currentRatio < TARGET_RATIO) {
      // 縦に長い → 高さを削る
      sh = Math.round(vw / TARGET_RATIO);
      sy = Math.round((vh - sh) / 2);
    }

    const canvas = canvasRef.current;
    canvas.width = sw;
    canvas.height = sh;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
    });
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return {
    videoRef,
    isReady,
    facingMode,
    error,
    startCamera,
    stopCamera,
    switchCamera,
    takePhoto,
  };
}
