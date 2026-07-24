import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/** 認証状態を取得するフック */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthはAuthProvider内で使用してください');
  }
  return context;
}
