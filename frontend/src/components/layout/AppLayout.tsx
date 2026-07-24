import { Box } from '@mui/material';
import { Outlet, Navigate } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { CircularProgress } from '@mui/material';

/** 認証チェック付き共通レイアウト */
export function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={loadingStyle}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <Box sx={layoutStyle}>
      <Box sx={contentStyle}>
        <Outlet />
      </Box>
      <BottomNav />
    </Box>
  );
}

const layoutStyle = {
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'background.default',
} as const;

const contentStyle = {
  flex: 1,
  overflow: 'hidden',
  position: 'relative',
} as const;

const loadingStyle = {
  height: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const;
