'use client';

import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  ClipboardCheck,
  Users,
  Database,
  FileText,
  Settings,
  QrCode,
  Scan,
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isMobileOpen?: boolean;
}

export function Navigation({ currentPage, onNavigate, isMobileOpen }: NavigationProps) {
  const { user } = useAuth();
  
  const navItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard, minRole: 'staff' },
    { id: 'products', label: '物品一覧', icon: Package, minRole: 'staff' },
    { id: 'stock-movement', label: '入出庫', icon: ArrowRightLeft, minRole: 'staff' },
    { id: 'qr-scanner', label: 'QRスキャン', icon: Scan, minRole: 'staff' },
    { id: 'qr-generator', label: 'QR生成', icon: QrCode, minRole: 'staff' },
    { id: 'stocktaking', label: '棚卸し', icon: ClipboardCheck, minRole: 'staff' },
    { id: 'user-management', label: 'ユーザー管理', icon: Users, minRole: 'admin' },
    { id: 'master-data', label: 'マスタデータ', icon: Database, minRole: 'manager' },
    { id: 'reports', label: 'レポート', icon: FileText, minRole: 'manager' },
    { id: 'settings', label: '設定', icon: Settings, minRole: 'admin' },
  ] as const;

  const roleHierarchy = {
    staff: 1,
    manager: 2,
    admin: 3
  };

  const userRoleLevel = user ? (roleHierarchy[user.role] || 0) : 0;

  const visibleNavItems = navItems.filter(item => {
    const requiredLevel = roleHierarchy[item.minRole as keyof typeof roleHierarchy] || 0;
    return userRoleLevel >= requiredLevel;
  });

  return (
    <nav
      className={`
        fixed md:static inset-y-0 left-0 z-40 w-64
        bg-white/90 border-r border-border/70 backdrop-blur-md shadow-sm
        transform transition-transform duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      <div className="p-4 space-y-2">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`
                w-full justify-start gap-3 rounded-lg border border-transparent
                text-sm transition-all
                hover:border-primary/30 hover:bg-primary/10 hover:text-primary
                ${isActive ? 'bg-primary text-primary-foreground shadow-[0_6px_14px_rgba(37,99,235,0.18)] hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground'}
              `}
              onClick={() => onNavigate(item.id)}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
