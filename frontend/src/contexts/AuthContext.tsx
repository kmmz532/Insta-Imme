import { createContext, useCallback, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/user';
import * as authService from '../services/authService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOADING' }
  | { type: 'AUTHENTICATED'; user: User }
  | { type: 'UNAUTHENTICATED' };

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, isLoading: true };
    case 'AUTHENTICATED':
      return { user: action.user, isLoading: false, isAuthenticated: true };
    case 'UNAUTHENTICATED':
      return { user: null, isLoading: false, isAuthenticated: false };
  }
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      dispatch({ type: 'UNAUTHENTICATED' });
      return;
    }

    authService
      .fetchMe()
      .then((user) => dispatch({ type: 'AUTHENTICATED', user }))
      .catch(() => {
        localStorage.removeItem('auth_token');
        dispatch({ type: 'UNAUTHENTICATED' });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'LOADING' });
    const result = await authService.login(email, password);
    localStorage.setItem('auth_token', result.token);
    dispatch({ type: 'AUTHENTICATED', user: result.user });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'LOADING' });
    const result = await authService.register(email, password);
    localStorage.setItem('auth_token', result.token);
    dispatch({ type: 'AUTHENTICATED', user: result.user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    dispatch({ type: 'UNAUTHENTICATED' });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, register, logout }),
    [state, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
