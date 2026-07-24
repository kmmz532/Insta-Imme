import type { Context, Next } from 'hono';
import type { Env } from '../types/env';

type AppContext = Context<{ Bindings: Env }>;

/** CORS設定ミドルウェア（カスタム実装、必要に応じて利用） */
export function corsMiddleware(allowedOrigins: string[]) {
  return async (c: AppContext, next: Next) => {
    const origin = c.req.header('Origin') ?? '';
    const isAllowed = allowedOrigins.some((o) => origin === o);

    if (c.req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(isAllowed ? origin : '', c.req.header('Access-Control-Request-Headers')),
      });
    }

    await next();

    if (isAllowed) {
      const headers = buildCorsHeaders(origin, null);
      for (const [key, value] of Object.entries(headers)) {
        c.header(key, value);
      }
    }
  };
}

function buildCorsHeaders(
  origin: string,
  requestHeaders: string | null | undefined
): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };

  if (requestHeaders) {
    headers['Access-Control-Allow-Headers'] = requestHeaders;
  } else {
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  }

  return headers;
}
