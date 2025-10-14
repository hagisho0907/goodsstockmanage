'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff';
  department?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultUser: User = {
  email: 'admin@example.com',
  name: '管理者',
  role: 'admin',
  department: 'グッズ管理部',
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    setIsLoading(true);
    const token = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');
    
    if (token && userEmail) {
      // TODO: 実際はトークンの検証を行う
      setUser({
        email: userEmail,
        name: userEmail === 'admin@example.com' ? '管理者' : 'ユーザー',
        role: userEmail === 'admin@example.com' ? 'admin' : 'staff',
        department: 'グッズ管理部'
      });
    } else {
      // ログインページを使わず常に管理者として開始
      localStorage.setItem('authToken', 'demo-token');
      localStorage.setItem('userEmail', defaultUser.email);
      setUser(defaultUser);
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string, remember = false): Promise<boolean> => {
    setIsLoading(true);
    // TODO: 実際のAPI呼び出しに置き換える
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email === 'admin@example.com' && password === 'password123') {
        const userData: User = {
          email,
          name: '管理者',
          role: 'admin',
          department: 'グッズ管理部'
        };
        
        localStorage.setItem('authToken', 'demo-token');
        localStorage.setItem('userEmail', email);
        if (remember) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }
        setUser(userData);
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('rememberMe');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
