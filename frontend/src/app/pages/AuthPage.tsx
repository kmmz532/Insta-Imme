import { useState } from 'react';
import { Box, Card } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { useAuth } from '../../hooks/useAuth';

/** 認証ページ - ログイン / 新規登録の切替 */
export function AuthPage() {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // ログイン/登録成功で認証済みになったらトップへ遷移する
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <Box sx={containerStyle} className="gradient-bg">
      <Card sx={cardStyle} className="fade-in">
        {mode === 'login' ? (
          <LoginForm onSwitchToRegister={() => setMode('register')} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setMode('login')} />
        )}
      </Card>
    </Box>
  );
}

const containerStyle = {
  height: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: 3,
} as const;

const cardStyle = {
  width: '100%',
  maxWidth: 400,
  p: 4,
  borderRadius: 3,
} as const;
