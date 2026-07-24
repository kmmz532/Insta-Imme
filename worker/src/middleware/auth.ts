import type { Context, Next } from 'hono';
import type { Env } from '../types/env';
import { AuthError } from '../lib/errors';

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

type AppContext = Context<{ Bindings: Env; Variables: { userId: string } }>;

/** JWT認証ミドルウェア - Authorizationヘッダーからトークンを検証する */
export async function authMiddleware(c: AppContext, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new AuthError('トークンが必要です');

  const token = authHeader.slice(7);
  const payload = await verifyJwt(token, c.env.JWT_SECRET);

  c.set('userId', payload.sub);
  await next();
}

/** JWTトークンを検証してペイロードを返す */
async function verifyJwt(token: string, secret: string): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new AuthError('不正なトークン形式です');

  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

  const key = await importKey(secret);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);

  const isValid = await crypto.subtle.verify('HMAC', key, signature, data);
  if (!isValid) throw new AuthError('トークンの署名が無効です');

  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))) as JwtPayload;

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new AuthError('トークンの有効期限が切れています');
  }

  return payload;
}

/** JWTトークンを生成する */
export async function signJwt(userId: string, secret: string, expiresInSec = 86400): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = { sub: userId, iat: now, exp: now + expiresInSec };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));

  const key = await importKey(secret);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign('HMAC', key, data);

  return `${headerB64}.${payloadB64}.${base64UrlEncodeBuffer(signature)}`;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlEncodeBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): ArrayBuffer {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
