'use client';

import { useState, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { 
  Camera, 
  CameraOff, 
  QrCode, 
  Search, 
  Package, 
  ArrowRightLeft,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { products } from '../lib/mockData';
import { Product } from '../types';

interface QRCodeScannerProps {
  onNavigate: (page: string, id?: string) => void;
  mode?: 'search' | 'stock-in' | 'stock-out';
}

interface ScanResult {
  id?: string;
  type?: string;
  name?: string;
  jan?: string;
  category?: string;
  location?: string;
  price?: number;
  quantity?: number;
  expiryDate?: string;
  custom?: string;
}

export function QRCodeScanner({ onNavigate, mode = 'search' }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [continuousMode, setContinuousMode] = useState(false);
  const [scanHistory, setScanHistory] = useState<Array<{
    timestamp: Date;
    data: ScanResult;
    product?: Product;
  }>>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleScan = (result: any) => {
    if (!result) return;

    try {
      const data = JSON.parse(result.text) as ScanResult;
      
      if (data.type !== 'product' || !data.id) {
        toast.error('無効なQRコードです');
        return;
      }

      const product = products.find(p => p.id === data.id);
      
      if (product) {
        setScanResult(data);
        setFoundProduct(product);
        
        // スキャン音を再生
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }

        // 履歴に追加
        setScanHistory(prev => [{
          timestamp: new Date(),
          data,
          product
        }, ...prev.slice(0, 9)]);

        toast.success(`商品を検出: ${product.name}`);

        if (!continuousMode) {
          setIsScanning(false);
        }

        // モードに応じた処理
        switch (mode) {
          case 'stock-in':
            setTimeout(() => {
              onNavigate('stock-movement', product.id);
            }, 1500);
            break;
          case 'stock-out':
            setTimeout(() => {
              onNavigate('stock-movement', product.id);
            }, 1500);
            break;
          case 'search':
          default:
            if (!continuousMode) {
              setTimeout(() => {
                onNavigate('product-detail', product.id);
              }, 1500);
            }
            break;
        }
      } else {
        toast.error('商品が見つかりません');
      }
    } catch (error) {
      toast.error('QRコードの読み取りに失敗しました');
    }
  };

  const handleError = (error: any) => {
    console.error('QR Scanner Error:', error);
    toast.error('カメラへのアクセスに失敗しました');
    setIsScanning(false);
  };

  const getModeInfo = () => {
    switch (mode) {
      case 'stock-in':
        return {
          title: '入庫スキャン',
          description: '入庫する物品のQRコードをスキャンしてください',
          icon: <ArrowRightLeft className="w-8 h-8" />
        };
      case 'stock-out':
        return {
          title: '出庫スキャン',
          description: '出庫する物品のQRコードをスキャンしてください',
          icon: <ArrowRightLeft className="w-8 h-8 rotate-180" />
        };
      default:
        return {
          title: 'QRコードスキャン',
          description: '物品のQRコードをスキャンして情報を確認します',
          icon: <QrCode className="w-8 h-8" />
        };
    }
  };

  const modeInfo = getModeInfo();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {modeInfo.icon}
          {modeInfo.title}
        </h1>
        <p className="text-muted-foreground mt-1">{modeInfo.description}</p>
      </div>

      <audio ref={audioRef} src="/beep.mp3" />

      <Tabs defaultValue="scanner" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scanner">スキャナー</TabsTrigger>
          <TabsTrigger value="history">スキャン履歴</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>カメラスキャン</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="continuous"
                      checked={continuousMode}
                      onCheckedChange={setContinuousMode}
                    />
                    <Label htmlFor="continuous">連続スキャン</Label>
                  </div>
                  <Button
                    onClick={() => setIsScanning(!isScanning)}
                    variant={isScanning ? 'destructive' : 'default'}
                  >
                    {isScanning ? (
                      <>
                        <CameraOff className="w-4 h-4 mr-2" />
                        スキャン停止
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        スキャン開始
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isScanning ? (
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <QrReader
                    onResult={handleScan}
                    constraints={{ facingMode: 'environment' }}
                    className="w-full h-full"
                  />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 border-2 border-white rounded-lg">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
                  <Camera className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    「スキャン開始」をクリックしてカメラを起動してください
                  </p>
                </div>
              )}

              {scanResult && foundProduct && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-green-900">
                        商品を検出しました
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">商品名:</span>
                          <span className="ml-2 font-medium">{foundProduct.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">JAN:</span>
                          <span className="ml-2 font-mono">{foundProduct.janCode}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">カテゴリ:</span>
                          <span className="ml-2">{foundProduct.category}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">保管場所:</span>
                          <span className="ml-2">{foundProduct.storageLocation}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">在庫数:</span>
                          <span className="ml-2">{foundProduct.totalStock}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">単価:</span>
                          <span className="ml-2">¥{foundProduct.unitPrice.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => onNavigate('product-detail', foundProduct.id)}
                        >
                          詳細を見る
                        </Button>
                        {mode !== 'search' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onNavigate('stock-movement', foundProduct.id)}
                          >
                            {mode === 'stock-in' ? '入庫処理' : '出庫処理'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>スキャン履歴</CardTitle>
              <CardDescription>
                最近スキャンした物品の履歴（最大10件）
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanHistory.length > 0 ? (
                <div className="space-y-2">
                  {scanHistory.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                      onClick={() => item.product && onNavigate('product-detail', item.product.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium">
                            {item.product?.name || 'Unknown Product'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.product?.janCode || 'No JAN'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {item.timestamp.toLocaleTimeString('ja-JP')}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {item.product?.category || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setScanHistory([])}
                  >
                    履歴をクリア
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  まだスキャン履歴はありません
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}