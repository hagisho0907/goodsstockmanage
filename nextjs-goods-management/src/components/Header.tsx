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
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="flex h-14 sm:h-16 items-center px-3 sm:px-4">
        {/* ハンバーガーメニュー（モバイルのみ） */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden min-w-[44px] min-h-[44px] p-2 mr-2"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* ロゴとタイトル */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_6px_14px_rgba(37,99,235,0.28)] shrink-0">
            <span className="text-primary-foreground font-semibold text-sm sm:text-base">IP</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground truncate">
              <span className="hidden sm:inline">グッズ在庫管理システム</span>
              <span className="sm:hidden">在庫管理</span>
            </h1>
            <p className="text-xs text-muted-foreground hidden md:block truncate">
              IPグッズの在庫状況をリアルタイムに可視化
            </p>
          </div>
        </div>

        {/* 右側のボタン群 */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground min-w-[44px] min-h-[44px] p-2">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 sm:w-80 max-w-[calc(100vw-2rem)] notification-dropdown">
              <div className="p-2 bg-white">
                <h3 className="px-2 py-1.5 font-medium text-gray-900">通知</h3>
                <DropdownMenuSeparator />
                <div className="max-h-64 sm:max-h-80 overflow-y-auto">
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <DropdownMenuItem
                        key={alert.id}
                        className={`p-3 cursor-pointer dropdown-item-enhanced ${
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
                            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm break-words">{alert.message}</p>
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
                    <div className="p-4 text-center text-sm text-gray-600 bg-white">
                      新しい通知はありません
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground min-h-[44px] px-3 py-2">
                <User className="h-5 w-5 shrink-0" />
                <span className="hidden sm:inline truncate max-w-24">{user?.name || 'ゲスト'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="user-dropdown">
              <div className="bg-white">
                {user && (
                  <>
                    <div className="px-3 py-2 text-sm bg-white">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-gray-600">{user.email}</div>
                      {user.department && (
                        <div className="text-gray-600">{user.department}</div>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem className="dropdown-item-enhanced bg-white text-gray-900">プロフィール</DropdownMenuItem>
                <DropdownMenuItem className="dropdown-item-enhanced bg-white text-gray-900">設定</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive cursor-pointer dropdown-item-enhanced bg-white hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
