import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PASSWORD = import.meta.env.VITE_APP_PASSWORD;
const AUTH_KEY = 'corazonada_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem(AUTH_KEY);
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((password: string): boolean => {
    setError(null);
    if (password === PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      return true;
    }
    setError('Contraseña incorrecta');
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
