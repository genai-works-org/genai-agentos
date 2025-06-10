import type { FC, ReactNode } from 'react';
import {
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import { authService, User } from '../services/authService';
import { websocketService } from '../services/websocketService';
import {
  REFRESH_TOKEN_KEY,
  TOKEN_KEY,
  USER_STORAGE_KEY,
} from '../constants/localStorage';

interface AuthContextType {
  user: User | null;
  // move to hooks
  login: (name: string, password: string) => Promise<void>;
  signup: (name: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

/**
 * useAuth token , check if token presented
 */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const userData = await authService.login(username, password);
      setUser(userData);
    } catch (error) {
      // Remove line 47: console.error('Login error:', error);

      throw error;
    }
  }, []);

  const signup = useCallback(async (username: string, password: string) => {
    try {
      await authService.signup(username, password);
    } catch (error) {
      // Remove line 63: console.error('Signup error:', error);

      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    // Clear all context data
    setUser(null);

    // Disconnect websocket
    websocketService.disconnect();

    // Clear all local storage data
    authService.logout();

    // Clear any other local storage items that might be related to the session
    localStorage.clear();
  }, []);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      const storageKeys = [TOKEN_KEY, REFRESH_TOKEN_KEY, USER_STORAGE_KEY];
      const isStorageChanged =
        storageKeys.some(key => event.key === key) || !event.key;

      if (isStorageChanged && !event.newValue) {
        logout();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      signup,
      logout,
      isLoading,
    }),
    [user, login, signup, logout, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
