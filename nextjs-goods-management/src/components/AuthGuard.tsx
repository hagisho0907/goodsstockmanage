'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'manager' | 'staff';
  fallbackPath?: string;
}

export function AuthGuard({ 
  children, 
  requiredRole,
  fallbackPath = '/'
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && requiredRole) {
      const roleHierarchy = {
        staff: 1,
        manager: 2,
        admin: 3
      };

      const userRoleLevel = roleHierarchy[user.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        router.push(fallbackPath);
      }
    }
  }, [user, isLoading, requiredRole, router, fallbackPath]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole) {
    const roleHierarchy = {
      staff: 1,
      manager: 2,
      admin: 3
    };

    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            アクセスが制限されています
          </h2>
          <p className="text-gray-600">
            この機能を使用する権限がありません。
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}