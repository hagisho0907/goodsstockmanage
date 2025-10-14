import { Package, AlertTriangle, XCircle, Plus, LogIn, LogOut, Scan, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { products, stockMovements, alerts } from '../lib/mockData';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const totalProductTypes = products.length;

  const recentMovements = stockMovements.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">在庫の総種類数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalProductTypes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              登録されている商品の種類
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        <h2>アラート</h2>
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            variant={alert.severity === 'error' ? 'destructive' : 'default'}
            className={alert.severity === 'warning' ? 'border-[#F59E0B] bg-[#FEF3C7]' : ''}
          >
            {alert.severity === 'error' ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
            )}
            <AlertDescription className={alert.severity === 'warning' ? 'text-[#92400E]' : ''}>
              {alert.message}
            </AlertDescription>
          </Alert>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3">クイックアクション</h2>
        <div className="grid gap-3 sm:grid-cols-5">
          <Button
            onClick={() => onNavigate('product-register')}
            className="h-auto py-6 flex flex-col gap-2 bg-[#2563EB] hover:bg-[#1d4ed8]"
          >
            <Plus className="h-6 w-6" />
            <span>物品登録</span>
          </Button>
          <Button
            onClick={() => onNavigate('stock-movement')}
            className="h-auto py-6 flex flex-col gap-2 bg-[#10B981] hover:bg-[#059669]"
          >
            <LogIn className="h-6 w-6" />
            <span>入庫処理</span>
          </Button>
          <Button
            onClick={() => onNavigate('stock-movement')}
            className="h-auto py-6 flex flex-col gap-2 bg-[#10B981] hover:bg-[#059669]"
          >
            <LogOut className="h-6 w-6" />
            <span>出庫処理</span>
          </Button>
          <Button
            onClick={() => onNavigate('qr-scanner')}
            className="h-auto py-6 flex flex-col gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED]"
          >
            <Scan className="h-6 w-6" />
            <span>QRスキャン</span>
          </Button>
          <Button
            onClick={() => onNavigate('qr-generator')}
            className="h-auto py-6 flex flex-col gap-2 bg-[#F59E0B] hover:bg-[#D97706]"
          >
            <QrCode className="h-6 w-6" />
            <span>QR生成</span>
          </Button>
        </div>
      </div>

      {/* Recent Stock Movements */}
      <Card>
        <CardHeader>
          <CardTitle>最近の入出庫</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentMovements.map((movement) => (
              <div
                key={movement.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate">{movement.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    SKU: {movement.productSku}
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <Badge
                    variant={movement.movementType === 'in' ? 'default' : 'secondary'}
                    className={movement.movementType === 'in' ? 'bg-[#10B981]' : 'bg-[#2563EB]'}
                  >
                    {movement.movementType === 'in' ? '入庫' : '出庫'}
                  </Badge>
                  <span className="w-12 text-right">{movement.quantity}</span>
                  <span className="text-sm text-muted-foreground w-24 text-right hidden sm:inline">
                    {new Date(movement.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
