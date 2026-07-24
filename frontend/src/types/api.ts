/** API共通型定義 */

/** API成功レスポンス */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/** APIエラーレスポンス */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/** API統合レスポンス型 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
