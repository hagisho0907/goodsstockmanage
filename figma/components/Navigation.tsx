import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  ClipboardCheck,
  Settings,
} from 'lucide-react';
import { Button } from './ui/button';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isMobileOpen?: boolean;
}

export function Navigation({ currentPage, onNavigate, isMobileOpen }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
    { id: 'products', label: '物品一覧', icon: Package },
    { id: 'stock-movement', label: '入出庫', icon: ArrowRightLeft },
    { id: 'stocktaking', label: '棚卸し', icon: ClipboardCheck },
    { id: 'settings', label: '設定', icon: Settings },
  ];

  return (
    <nav
      className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 
        bg-white border-r transform transition-transform duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      <div className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              className={`
                w-full justify-start gap-3
                ${isActive ? 'bg-[#2563EB] hover:bg-[#1d4ed8]' : ''}
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
