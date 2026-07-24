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

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

/** ログインフォーム */
export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
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
        ログインしてInstagram投稿を始めましょう
      </Typography>

      {error && <Alert severity="error" id="login-error">{error}</Alert>}

      <TextField
        id="login-email"
        label="メールアドレス"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        autoComplete="email"
      />
      <TextField
        id="login-password"
        label="パスワード"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
        autoComplete="current-password"
      />
      <Button
        id="login-submit"
        type="submit"
        variant="contained"
        size="large"
        disabled={isLoading}
        fullWidth
      >
        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'ログイン'}
      </Button>
      <Button
        id="switch-to-register"
        variant="text"
        onClick={onSwitchToRegister}
        sx={{ color: 'text.secondary' }}
      >
        アカウントをお持ちでない方はこちら
      </Button>
    </Box>
  );
}
