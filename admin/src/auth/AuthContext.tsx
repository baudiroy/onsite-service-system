import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, setUnauthorizedHandler } from '../lib/apiClient';
import { clearAccessToken, getAccessToken, setAccessToken } from '../lib/tokenStorage';
import type { CurrentUser } from '../types/auth';
import {
  hasAnyPermission as userHasAnyPermission,
  hasPermission as userHasPermission,
  hasRole as userHasRole
} from './permissions';

type AuthContextValue = {
  currentUser: CurrentUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  hasPermission: (permissionKey: string) => boolean;
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  hasRole: (roleKey: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken());
  const [isLoading, setIsLoading] = useState(true);

  const resetAuth = useCallback(() => {
    clearAccessToken();
    setAccessTokenState(null);
    setCurrentUser(null);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setAccessTokenState(null);
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setAccessTokenState(token);
      const user = await authApi.me();
      setCurrentUser(user);
    } catch {
      resetAuth();
    } finally {
      setIsLoading(false);
    }
  }, [resetAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setAccessToken(result.accessToken);
    setAccessTokenState(result.accessToken);
    const user = await authApi.me();
    setCurrentUser(user);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getAccessToken()) {
        await authApi.logout();
      }
    } catch {
      // Local logout should still clear the browser session if backend logout fails.
    } finally {
      resetAuth();
    }
  }, [resetAuth]);

  useEffect(() => {
    setUnauthorizedHandler(resetAuth);
    void loadCurrentUser();
    return () => setUnauthorizedHandler(null);
  }, [loadCurrentUser, resetAuth]);

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    accessToken,
    isAuthenticated: Boolean(currentUser),
    isLoading,
    login,
    logout,
    loadCurrentUser,
    hasPermission: (permissionKey: string) => userHasPermission(currentUser, permissionKey),
    hasAnyPermission: (permissionKeys: string[]) => userHasAnyPermission(currentUser, permissionKeys),
    hasRole: (roleKey: string) => userHasRole(currentUser, roleKey)
  }), [accessToken, currentUser, isLoading, loadCurrentUser, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
