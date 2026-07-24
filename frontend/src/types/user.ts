/** ユーザー型定義 */
export interface User {
  id: string;
  email: string;
}

/** ログインリクエスト */
export interface LoginRequest {
  email: string;
  password: string;
}

/** 新規登録リクエスト */
export interface RegisterRequest {
  email: string;
  password: string;
}

/** 認証レスポンス */
export interface AuthResponse {
  token: string;
  user: User;
}
