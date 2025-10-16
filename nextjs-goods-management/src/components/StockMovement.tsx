import { useState, useCallback } from 'react';
import { Camera, Search, X, Save, ArrowRightLeft } from 'lucide-react';
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
import { QRCodeScanner } from './QRCodeScanner';
import { dataStore } from '../lib/dataStore';
import { toast } from 'sonner';
import { StockMovement as StockMovementType } from '../types';

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
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // フォーム状態管理
  const [condition, setCondition] = useState<'new' | 'used' | 'damaged'>('new');
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QRスキャナーからの商品検出時の処理
  const handleProductDetected = useCallback((productId: string) => {
    const products = dataStore.getProducts();
    const product = products.find(p => p.id === productId);
    
    if (product) {
      const newScannedProduct: ScannedProduct = {
        id: productId + '-' + Date.now(), // 重複を避けるためのユニークID
        name: product.name,
        sku: product.sku,
        quantity: 1,
      };
      
      setScannedProducts(prev => [...prev, newScannedProduct]);
      setShowScanner(false);
    }
  }, []);

  // 手動検索機能
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      toast.warning('検索キーワードを入力してください');
      return;
    }

    const products = dataStore.getProducts();
    const results = products.filter(product => 
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setSearchResults(results);
    setShowSearchResults(true);

    if (results.length === 0) {
      toast.info('該当する商品が見つかりませんでした');
    }
  }, [searchQuery]);

  // 検索結果から商品を追加
  const addProductFromSearch = useCallback((product: any) => {
    const newScannedProduct: ScannedProduct = {
      id: product.id + '-' + Date.now(), // 重複を避けるためのユニークID
      name: product.name,
      sku: product.sku,
      quantity: 1,
    };
    
    setScannedProducts(prev => [...prev, newScannedProduct]);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    
    toast.success(`商品を追加しました: ${product.name}`);
  }, []);

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

  // タブ切り替え時のフォームリセット
  const handleTabChange = useCallback((newTab: 'in' | 'out') => {
    setActiveTab(newTab);
    setCondition('new');
    setReason('');
    setDestination('');
    setNotes('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (scannedProducts.length === 0) {
      toast.error('商品を追加してください');
      return;
    }

    if (!reason) {
      toast.error(`${activeTab === 'in' ? '入庫' : '出庫'}理由を選択してください`);
      return;
    }

    if (activeTab === 'out' && !destination.trim()) {
      toast.error('出庫先を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      // 各商品の入出庫処理
      for (const product of scannedProducts) {
        // 商品IDを取得（元のproduct.idから時刻部分を除去）
        const originalProductId = product.id.split('-')[0];
        
        // 商品存在確認
        const dbProduct = dataStore.getProducts().find(p => p.id === originalProductId);
        if (!dbProduct) {
          toast.error(`商品が見つかりません: ${product.name}`);
          continue;
        }

        // 出庫の場合、在庫確認
        if (activeTab === 'out') {
          const availableStock = condition === 'new' ? dbProduct.stockBreakdown.new :
                                condition === 'used' ? dbProduct.stockBreakdown.used :
                                dbProduct.stockBreakdown.damaged;
          
          if (availableStock < product.quantity) {
            toast.error(`${product.name}の${condition === 'new' ? '正常' : condition === 'used' ? '中古' : '破損'}在庫が不足しています（在庫: ${availableStock}個）`);
            continue;
          }
        }

        // StockMovementレコード作成
        const movement: StockMovementType = {
          id: dataStore.generateId(),
          productId: originalProductId,
          productName: product.name,
          productSku: product.sku,
          movementType: activeTab,
          quantity: product.quantity,
          condition: condition,
          reason: reason,
          notes: notes.trim() || undefined,
          createdBy: 'current-user', // TODO: 実際のユーザーIDに置き換え
          createdAt: new Date().toISOString(),
        };

        // データストアに追加（これで自動的に在庫数も更新される）
        dataStore.addStockMovement(movement);
      }

      // 成功メッセージ
      const totalQuantity = scannedProducts.reduce((sum, p) => sum + p.quantity, 0);
      toast.success(`${activeTab === 'in' ? '入庫' : '出庫'}処理が完了しました（${totalQuantity}個）`);

      // フォームリセット
      setScannedProducts([]);
      setCondition('new');
      setReason('');
      setDestination('');
      setNotes('');

      // ダッシュボードに戻る
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1500);

    } catch (error) {
      console.error('Stock movement error:', error);
      toast.error('処理中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full max-w-4xl mx-auto px-2 sm:px-0">
      {/* Header */}
      <h1 className="text-xl sm:text-2xl font-bold">入出庫</h1>

      <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as 'in' | 'out')} className="w-full">
        <TabsList className="grid w-full max-w-xs sm:max-w-sm grid-cols-2 gap-1 mx-auto h-auto">
          <TabsTrigger value="in" className="py-2 sm:py-3 min-h-[40px] sm:min-h-[44px] text-sm sm:text-base px-2 sm:px-4">
            入庫
          </TabsTrigger>
          <TabsTrigger value="out" className="py-2 sm:py-3 min-h-[40px] sm:min-h-[44px] text-sm sm:text-base px-2 sm:px-4">
            出庫
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 sm:space-y-6 mt-4 sm:mt-6 w-full overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Scan Mode */}
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <Label className="text-sm sm:text-base">スキャンモード</Label>
                <div className="mt-3 space-y-3 sm:space-y-4">
                  {showScanner ? (
                    <div className="border rounded-lg overflow-hidden w-full max-w-full">
                      <div className="w-full overflow-hidden">
                        <QRCodeScanner 
                          onNavigate={() => {}} // ダミー関数
                          mode={activeTab === 'in' ? 'stock-in' : 'stock-out'}
                          onProductDetected={handleProductDetected}
                        />
                      </div>
                      <div className="p-3 sm:p-4 border-t bg-gray-50">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowScanner(false)}
                          className="w-full min-h-[44px] py-3"
                        >
                          スキャンを終了
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="border-2 border-dashed rounded-lg p-4 sm:p-8 flex flex-col items-center justify-center min-h-[180px] sm:min-h-[200px] bg-gray-50">
                        <div className="text-center">
                          <ArrowRightLeft className={`h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 ${
                            activeTab === 'in' ? 'text-[#10B981]' : 'text-[#2563EB]'
                          }`} />
                          <p className="text-sm sm:text-lg mb-3 sm:mb-4 px-2">
                            {activeTab === 'in' ? '入庫する' : '出庫する'}商品のQRコードをスキャン
                          </p>
                          <Button
                            type="button"
                            onClick={() => setShowScanner(true)}
                            className={`min-h-[44px] px-4 py-3 ${
                              activeTab === 'in' 
                                ? 'bg-[#10B981] hover:bg-[#059669]' 
                                : 'bg-[#2563EB] hover:bg-[#1d4ed8]'
                            }`}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            <span className="text-sm sm:text-base">QRスキャン開始</span>
                          </Button>
                        </div>
                      </div>

                      <div className="text-center text-muted-foreground text-sm">または</div>

                      <div className="relative">
                        <Label htmlFor="manualSearch" className="text-sm sm:text-base">手動入力</Label>
                        <div className="flex flex-col sm:flex-row gap-2 mt-2">
                          <Input
                            id="manualSearch"
                            placeholder="SKU/商品名を入力"
                            className="flex-1"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSearch();
                              }
                            }}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="min-h-[44px] px-4 py-2"
                            onClick={handleSearch}
                          >
                            <Search className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">検索</span>
                          </Button>
                        </div>

                        {/* 検索結果表示 */}
                        {showSearchResults && (
                          <div className="mt-3 border rounded-lg bg-white shadow-md max-h-60 overflow-y-auto">
                            {searchResults.length > 0 ? (
                              <div className="p-2">
                                <p className="text-sm text-muted-foreground mb-2 px-2">
                                  {searchResults.length}件の商品が見つかりました
                                </p>
                                {searchResults.map((product) => (
                                  <button
                                    key={product.id}
                                    type="button"
                                    className="w-full text-left p-3 hover:bg-gray-50 rounded border-b last:border-b-0 transition-colors"
                                    onClick={() => addProductFromSearch(product)}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{product.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                          SKU: {product.sku}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          在庫: {product.currentStock}個
                                        </p>
                                      </div>
                                      <div className="text-sm text-blue-600 ml-2">
                                        追加
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 text-center text-muted-foreground">
                                商品が見つかりませんでした
                              </div>
                            )}
                            <div className="p-2 border-t bg-gray-50">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setShowSearchResults(false);
                                  setSearchResults([]);
                                }}
                                className="w-full text-sm"
                              >
                                閉じる
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
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
                  <Select 
                    required 
                    value={condition} 
                    onValueChange={(value: 'new' | 'used' | 'damaged') => setCondition(value)}
                  >
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
                  <Select 
                    required 
                    value={reason} 
                    onValueChange={setReason}
                  >
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
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">備考</Label>
                  <Textarea
                    id="notes"
                    placeholder="備考を入力"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={scannedProducts.length === 0 || isSubmitting}
                className="bg-[#10B981] hover:bg-[#059669] min-h-[44px] px-4 py-3 order-1 sm:order-none"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    処理中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    確定処理
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate('dashboard')}
                className="min-h-[44px] px-4 py-3 order-2 sm:order-none"
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
