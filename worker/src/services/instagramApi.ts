import { InstagramApiError, InstagramPostError } from '../lib/errors';

interface TokenResponse {
  access_token: string;
  user_id: number;
}

interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface InstagramUser {
  id: string;
  username: string;
}

interface ContainerResponse {
  id: string;
}

interface PublishResponse {
  id: string;
}

/** Instagram OAuth認証URLを生成する */
export function buildAuthUrl(appId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'instagram_basic,instagram_content_publish,pages_show_list',
    response_type: 'code',
    state,
  });

  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

/** OAuth認可コードからアクセストークンを取得する */
export async function exchangeCodeForToken(
  code: string,
  appId: string,
  appSecret: string,
  redirectUri: string
): Promise<TokenResponse> {
  try {
    const res = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new InstagramApiError(`トークン取得失敗: ${error}`);
    }

    return (await res.json()) as TokenResponse;
  } catch (error) {
    if (error instanceof InstagramApiError) throw error;
    throw new InstagramApiError('Instagram認証に失敗しました', error);
  }
}

/** 短期トークンを長期トークンに交換する */
export async function exchangeForLongLivedToken(
  shortToken: string,
  appSecret: string
): Promise<LongLivedTokenResponse> {
  try {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_secret: appSecret,
      fb_exchange_token: shortToken,
    });

    const res = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${params.toString()}`
    );

    if (!res.ok) {
      const error = await res.text();
      throw new InstagramApiError(`長期トークン取得失敗: ${error}`);
    }

    return (await res.json()) as LongLivedTokenResponse;
  } catch (error) {
    if (error instanceof InstagramApiError) throw error;
    throw new InstagramApiError('長期トークン交換に失敗しました', error);
  }
}

/** Instagramビジネスアカウント情報を取得する */
export async function getInstagramUser(accessToken: string): Promise<InstagramUser> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account{id,username}&access_token=${accessToken}`
    );

    if (!res.ok) {
      throw new InstagramApiError('Instagramアカウント情報の取得に失敗しました');
    }

    const data = (await res.json()) as { data: Array<{ instagram_business_account?: InstagramUser }> };
    const account = data.data[0]?.instagram_business_account;

    if (!account) {
      throw new InstagramApiError('Instagramビジネスアカウントが見つかりません');
    }

    return account;
  } catch (error) {
    if (error instanceof InstagramApiError) throw error;
    throw new InstagramApiError('Instagramユーザー情報取得に失敗しました', error);
  }
}

/** Instagram Content Publishing: コンテナを作成する */
export async function createMediaContainer(
  igUserId: string,
  imageUrl: string,
  caption: string,
  accessToken: string
): Promise<string> {
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new InstagramPostError(`メディアコンテナ作成失敗: ${error}`);
    }

    const data = (await res.json()) as ContainerResponse;
    return data.id;
  } catch (error) {
    if (error instanceof InstagramPostError) throw error;
    throw new InstagramPostError('メディアコンテナの作成に失敗しました', error);
  }
}

/** Instagram Content Publishing: メディアを公開する */
export async function publishMedia(
  igUserId: string,
  containerId: string,
  accessToken: string
): Promise<string> {
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new InstagramPostError(`メディア公開失敗: ${error}`);
    }

    const data = (await res.json()) as PublishResponse;
    return data.id;
  } catch (error) {
    if (error instanceof InstagramPostError) throw error;
    throw new InstagramPostError('Instagram投稿の公開に失敗しました', error);
  }
}
