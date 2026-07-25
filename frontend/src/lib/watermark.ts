import type { WatermarkSettings } from '../types/preset';

export interface TemplateVars {
  account?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

/** テンプレート変数を実値に展開する（サーバー側 expand_template と同等の仕様） */
export function expandTemplate(text: string, vars: TemplateVars): string {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}/${p(now.getMonth() + 1)}/${p(now.getDate())}`;
  const time = `${p(now.getHours())}:${p(now.getMinutes())}`;

  const map: Record<string, string> = {
    '${date}': date,
    '${time}': time,
    '${datetime}': `${date} ${time}`,
    '${app}': 'Insta-Imme',
    '${account}': vars.account ?? '',
    '${loc}': vars.locationName ?? '',
    '${lat}': vars.latitude != null ? vars.latitude.toFixed(6) : '',
    '${lng}': vars.longitude != null ? vars.longitude.toFixed(6) : '',
  };

  let out = text;
  for (const [k, v] of Object.entries(map)) out = out.split(k).join(v);
  return out;
}

/** 透かしテキストの描画座標を求める（サーバー側 apply_watermark と同じ margin=30/1080基準） */
function computePosition(
  position: WatermarkSettings['position'],
  imgW: number,
  imgH: number,
  textW: number,
  textH: number
): { x: number; y: number } {
  const margin = Math.round((30 / 1080) * imgW);
  if (position === 'top_left') return { x: margin, y: margin };
  if (position === 'top_right') return { x: imgW - textW - margin, y: margin };
  if (position === 'bottom_left') return { x: margin, y: imgH - textH - margin };
  if (position === 'bottom_right') return { x: imgW - textW - margin, y: imgH - textH - margin };
  return { x: (imgW - textW) / 2, y: (imgH - textH) / 2 };
}

/** 画像Blobに透かしを焼き込み、新しいJPEG Blobを返す（クライアント側処理） */
export async function applyWatermarkToBlob(
  blob: Blob,
  settings: WatermarkSettings,
  text: string
): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return blob;

    ctx.drawImage(img, 0, 0);

    // font_sizeは1080px幅基準の指定なので、実画像幅に合わせてスケールする
    const scaledFont = Math.max(8, Math.round((settings.font_size / 1080) * canvas.width));
    ctx.font = `600 ${scaledFont}px Inter, sans-serif`;
    ctx.textBaseline = 'top';

    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const textH = scaledFont * 1.2;
    const { x, y } = computePosition(settings.position, canvas.width, canvas.height, textW, textH);

    // 黒フチ（サーバー側と同様のアウトライン）
    ctx.lineWidth = Math.max(2, Math.round(scaledFont / 12));
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText(text, x, y);

    return await canvasToBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('画像の生成に失敗しました'))),
      'image/jpeg',
      0.92
    );
  });
}
