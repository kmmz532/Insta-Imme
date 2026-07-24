import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';

interface PostConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
  isPublishing: boolean;
}

/** 投稿確認ダイアログ */
export function PostConfirm({ onConfirm, onCancel, isPublishing }: PostConfirmProps) {
  return (
    <Dialog open onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>投稿確認</DialogTitle>
      <DialogContent>
        <Typography>
          Instagramに投稿します。よろしいですか？
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          id="post-cancel"
          onClick={onCancel}
          disabled={isPublishing}
        >
          キャンセル
        </Button>
        <Button
          id="post-confirm"
          onClick={onConfirm}
          variant="contained"
          disabled={isPublishing}
        >
          {isPublishing ? <CircularProgress size={20} color="inherit" /> : '投稿する'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
