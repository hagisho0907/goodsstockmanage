'use client';

import { ReactNode } from 'react';

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
  // デモモード - 認証チェックをスキップして直接コンテンツを表示
  return <>{children}</>;
}