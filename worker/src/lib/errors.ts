/** アプリケーション固有エラーの基底クラス */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** 認証エラー（401） */
export class AuthError extends AppError {
  constructor(message = '認証に失敗しました') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

/** バリデーションエラー（400） */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/** Instagram API通信エラー（502） */
export class InstagramApiError extends AppError {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message, 502, 'INSTAGRAM_API_ERROR');
    this.name = 'InstagramApiError';
  }
}

/** Instagram投稿エラー（502） */
export class InstagramPostError extends AppError {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message, 502, 'INSTAGRAM_POST_ERROR');
    this.name = 'InstagramPostError';
  }
}

/** リソース未検出エラー（404） */
export class NotFoundError extends AppError {
  constructor(message = 'リソースが見つかりません') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/** 権限エラー（403） */
export class ForbiddenError extends AppError {
  constructor(message = 'アクセス権限がありません') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}
