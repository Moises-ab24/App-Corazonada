import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  nombre: string;
  login: (password: string, nombre: string) => boolean;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PASSWORD = import.meta.env.VITE_APP_PASSWORD;
const AUTH_KEY = 'corazonada_auth';
const NOMBRE_KEY = 'corazonada_nombre'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    const auth = sessionStorage.getItem(AUTH_KEY);
    if (auth === 'true') {
      setIsAuthenticated(true);
      setNombre(sessionStorage.getItem(NOMBRE_KEY) || '');
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((password: string, nombreInput: string): boolean => {
    setError(null);
    if (!nombreInput.trim()) { setError('Ingresá tu nombre'); return false; }
    if (password === PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      sessionStorage.setItem(NOMBRE_KEY, nombreInput.trim());
      setIsAuthenticated(true);
      setNombre(nombreInput.trim());
      return true;
    }
    setError('Contraseña incorrecta');
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(NOMBRE_KEY);
    setIsAuthenticated(false);
    setNombre('');
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, nombre, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
