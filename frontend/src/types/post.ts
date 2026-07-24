/** 投稿型定義 */

/** 投稿ステータス */
export type PostStatus = 'captured' | 'uploading' | 'publishing' | 'success' | 'failed';

/** 投稿データ */
export interface PostData {
  imageId: string;
  instagramAccountId: string;
  caption: string;
}

/** 投稿結果 */
export interface PostResult {
  postId: string;
  instagramPostId: string;
}

/** 投稿状態 */
export interface PostState {
  id: string;
  status: PostStatus;
  instagram_post_id: string | null;
  posted_at: string | null;
}
