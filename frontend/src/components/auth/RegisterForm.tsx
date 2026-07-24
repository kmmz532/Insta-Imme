import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

/** 新規登録フォーム */
export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上必要です');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}
    >
      <Typography variant="h4" className="gradient-text" sx={{ textAlign: 'center', mb: 1 }}>
        Insta-Imme
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
        新規アカウントを作成
      </Typography>

      {error && <Alert severity="error" id="register-error">{error}</Alert>}

      <TextField
        id="register-email"
        label="メールアドレス"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        autoComplete="email"
      />
      <TextField
        id="register-password"
        label="パスワード（8文字以上）"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
        autoComplete="new-password"
      />
      <TextField
        id="register-confirm-password"
        label="パスワード確認"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        fullWidth
        autoComplete="new-password"
      />
      <Button
        id="register-submit"
        type="submit"
        variant="contained"
        size="large"
        disabled={isLoading}
        fullWidth
      >
        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'アカウント作成'}
      </Button>
      <Button
        id="switch-to-login"
        variant="text"
        onClick={onSwitchToLogin}
        sx={{ color: 'text.secondary' }}
      >
        ログインに戻る
      </Button>
    </Box>
  );
}
