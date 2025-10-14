'use client';

import { Bell, Menu, User, AlertTriangle, XCircle, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { alerts } from '../lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onMenuClick: () => void;
  notificationCount?: number;
  onNavigate?: (page: string, productId?: string) => void;
}

export function Header({ onMenuClick, notificationCount = alerts.length, onNavigate }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="flex h-16 items-center gap-4 px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_6px_14px_rgba(37,99,235,0.28)]">
            <span className="text-primary-foreground font-semibold">IP</span>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-foreground">
              グッズ在庫管理システム
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              IPグッズの在庫状況をリアルタイムに可視化
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2">
                <h3 className="px-2 py-1.5">通知</h3>
                <DropdownMenuSeparator />
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <DropdownMenuItem
                      key={alert.id}
                      className={`p-3 cursor-pointer ${
                        alert.severity === 'error' ? 'hover:bg-red-50' : 'hover:bg-yellow-50'
                      }`}
                      onClick={() => {
                        if (alert.productId && onNavigate) {
                          onNavigate('product-detail', alert.productId);
                        }
                      }}
                    >
                      <div className="flex gap-3 w-full">
                        {alert.severity === 'error' ? (
                          <XCircle className="h-5 w-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm break-words">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.createdAt).toLocaleString('ja-JP', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    新しい通知はありません
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <User className="h-5 w-5" />
                <span className="hidden md:inline">{user?.name || 'ゲスト'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user && (
                <>
                  <div className="px-3 py-2 text-sm">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-muted-foreground">{user.email}</div>
                    {user.department && (
                      <div className="text-muted-foreground">{user.department}</div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem>プロフィール</DropdownMenuItem>
              <DropdownMenuItem>設定</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
