import { useState } from 'react';
import { Camera, Search, X, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';

interface StockMovementProps {
  onNavigate: (page: string) => void;
}

interface ScannedProduct {
  id: string;
  name: string;
  sku: string;
  quantity: number;
}

export function StockMovement({ onNavigate }: StockMovementProps) {
  const [activeTab, setActiveTab] = useState<'in' | 'out'>('in');
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    // Simulate scanning
    setTimeout(() => {
      const mockProduct: ScannedProduct = {
        id: String(Date.now()),
        name: 'キャラクターA フィギュア 限定版',
        sku: 'A001',
        quantity: 10,
      };
      setScannedProducts([...scannedProducts, mockProduct]);
      setIsScanning(false);
    }, 1000);
  };

  const removeProduct = (id: string) => {
    setScannedProducts(scannedProducts.filter(p => p.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setScannedProducts(
      scannedProducts.map(p =>
        p.id === id ? { ...p, quantity: Math.max(1, quantity) } : p
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    onNavigate('dashboard');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <h1>入出庫</h1>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'in' | 'out')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="in">入庫</TabsTrigger>
          <TabsTrigger value="out">出庫</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Scan Mode */}
            <Card>
              <CardContent className="pt-6">
                <Label>スキャンモード</Label>
                <div className="mt-3 space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px] bg-gray-50">
                    {isScanning ? (
                      <div className="text-center">
                        <div className="animate-pulse">
                          <Camera className="h-16 w-16 mx-auto text-[#2563EB] mb-4" />
                          <p className="text-lg">スキャン中...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg mb-4">QRコード/バーコードをスキャン</p>
                        <Button
                          type="button"
                          onClick={handleScan}
                          className="bg-[#2563EB] hover:bg-[#1d4ed8]"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          カメラ起動
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="text-center text-muted-foreground">または</div>

                  <div>
                    <Label htmlFor="manualSearch">手動入力</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="manualSearch"
                        placeholder="SKU/商品名を入力"
                        className="flex-1"
                      />
                      <Button type="button" variant="outline">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scanned Products */}
            {scannedProducts.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <Label>スキャン済み商品</Label>
                  <div className="mt-3 space-y-3">
                    {scannedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p>{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            SKU: {product.sku}
                          </p>
                        </div>
                        <Input
                          type="number"
                          value={product.quantity}
                          onChange={(e) =>
                            updateQuantity(product.id, parseInt(e.target.value) || 1)
                          }
                          className="w-24"
                          min="1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProduct(product.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span>合計数量:</span>
                      <Badge variant="secondary" className="text-lg px-4 py-2">
                        {scannedProducts.reduce((sum, p) => sum + p.quantity, 0)} 個
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Movement Details */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">
                    在庫状態 <span className="text-[#EF4444]">*</span>
                  </Label>
                  <Select required defaultValue="new">
                    <SelectTrigger id="condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                          正常
                        </div>
                      </SelectItem>
                      <SelectItem value="used">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div>
                          中古
                        </div>
                      </SelectItem>
                      <SelectItem value="damaged">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#EF4444]"></div>
                          破損
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {activeTab === 'in' ? '入庫する' : '出庫する'}在庫の状態を選択
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">
                    {activeTab === 'in' ? '入庫' : '出庫'}理由{' '}
                    <span className="text-[#EF4444]">*</span>
                  </Label>
                  <Select required>
                    <SelectTrigger id="reason">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTab === 'in' ? (
                        <>
                          <SelectItem value="purchase">仕入れ</SelectItem>
                          <SelectItem value="return">返品</SelectItem>
                          <SelectItem value="transfer">移動</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="sale">販売</SelectItem>
                          <SelectItem value="consignment">委託</SelectItem>
                          <SelectItem value="transfer">移動</SelectItem>
                          <SelectItem value="disposal">廃棄</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {activeTab === 'out' && (
                  <div className="space-y-2">
                    <Label htmlFor="destination">出庫先</Label>
                    <Input
                      id="destination"
                      placeholder="出庫先を入力"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">備考</Label>
                  <Textarea
                    id="notes"
                    placeholder="備考を入力"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={scannedProducts.length === 0}
                className="bg-[#10B981] hover:bg-[#059669]"
              >
                <Save className="h-4 w-4 mr-2" />
                確定処理
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate('dashboard')}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
