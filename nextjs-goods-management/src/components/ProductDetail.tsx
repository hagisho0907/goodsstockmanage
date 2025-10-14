import { useState } from 'react';
import { ArrowLeft, Edit, QrCode, Package, AlertCircle, CheckCircle2, Calendar, MapPin, MessageSquarePlus, FileText, Repeat } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { dataStore } from '../lib/dataStore';

interface ProductDetailProps {
  productId?: string;
  onNavigate: (page: string, productId?: string) => void;
}

export function ProductDetail({ productId, onNavigate }: ProductDetailProps) {
  const [showQRCode, setShowQRCode] = useState(false);
  const products = dataStore.getProducts();
  const product = products.find(p => p.id === productId);

  if (!product) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => onNavigate('products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
        <div className="p-8 text-center border rounded-lg bg-gray-50">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">商品が見つかりません</p>
        </div>
      </div>
    );
  }

  const stockMovements = dataStore.getStockMovements();
  const productNotes = dataStore.getProductNotes();
  const productMovements = stockMovements.filter(m => m.productId === product.id);
  const notes = productNotes.filter(n => n.productId === product.id).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const stockStatus = product.currentStock === 0 ? 'out' : product.currentStock < 10 ? 'low' : 'ok';
  
  const getExpiryStatus = () => {
    if (!product.ipInfo?.salesEndDate) return 'ok';
    const endDate = new Date(product.ipInfo.salesEndDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'warning';
    return 'ok';
  };

  const expiryStatus = getExpiryStatus();

  return (
    <>
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Button variant="outline" onClick={() => onNavigate('products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          物品一覧に戻る
        </Button>
        <div className="flex gap-2">
          <Button 
            onClick={() => onNavigate('product-edit', product.id)}
            className="bg-[#2563EB] hover:bg-[#1d4ed8]"
          >
            <Edit className="h-4 w-4 mr-2" />
            編集
          </Button>
          <Button variant="outline" onClick={() => setShowQRCode(true)}>
            <QrCode className="h-4 w-4 mr-2" />
            QRコード表示
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Images and Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Images */}
          <Card>
            <CardContent className="pt-6">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>
              {/* Thumbnail gallery would go here */}
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h1 className="mb-2">{product.name}</h1>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">SKU: {product.sku}</Badge>
                  <Badge variant="secondary">{product.categoryName}</Badge>
                  {stockStatus === 'out' && (
                    <Badge variant="destructive">在庫切れ</Badge>
                  )}
                  {stockStatus === 'low' && (
                    <Badge className="bg-[#F59E0B] hover:bg-[#D97706]">低在庫</Badge>
                  )}
                  {stockStatus === 'ok' && (
                    <Badge className="bg-[#10B981] hover:bg-[#059669]">在庫あり</Badge>
                  )}
                </div>
              </div>

              {product.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-2">商品説明</h3>
                    <p className="text-muted-foreground">{product.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stock Information */}
          <Card>
            <CardHeader>
              <CardTitle>在庫情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">総在庫数</p>
                  <p className="text-2xl">
                    {product.currentStock.toLocaleString()}{' '}
                    <span className="text-base text-muted-foreground">個</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">保管場所</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p>{product.storageLocationName}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-3">在庫状態別内訳</p>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-3 bg-[#10B981]/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                      <span>正常</span>
                    </div>
                    <span className="font-medium">{product.stockBreakdown.new.toLocaleString()} 個</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#F59E0B]/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div>
                      <span>中古</span>
                    </div>
                    <span className="font-medium">{product.stockBreakdown.used.toLocaleString()} 個</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#EF4444]/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#EF4444]"></div>
                      <span>破損</span>
                    </div>
                    <span className="font-medium">{product.stockBreakdown.damaged.toLocaleString()} 個</span>
                  </div>
                </div>
              </div>

              {/* Used Stock Images */}
              {product.usedStockImages && product.usedStockImages.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">中古品の写真</p>
                    <div className="flex flex-wrap gap-2">
                      {product.usedStockImages.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`中古品 ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Damaged Stock Images */}
              {product.damagedStockImages && product.damagedStockImages.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">破損品の写真</p>
                    <div className="flex flex-wrap gap-2">
                      {product.damagedStockImages.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`破損品 ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Detail Information */}
          {product.ipInfo && (
            <Card>
              <CardHeader>
                <CardTitle>詳細情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 sm:grid-cols-2">
                  {product.ipInfo.productionQuantity && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">製造数</p>
                      <p>{product.ipInfo.productionQuantity.toLocaleString()} 個</p>
                    </div>
                  )}
                  {product.ipInfo.salesRegions && product.ipInfo.salesRegions.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">販売可能地域</p>
                      <div className="flex flex-wrap gap-1">
                        {product.ipInfo.salesRegions.map((region) => (
                          <Badge key={region} variant="outline">
                            {region}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {(product.ipInfo.salesStartDate || product.ipInfo.salesEndDate) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">販売期間</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p>
                          {product.ipInfo.salesStartDate ? 
                            new Date(product.ipInfo.salesStartDate).toLocaleDateString('ja-JP') : 
                            '未設定'
                          }
                          {' 〜 '}
                          {product.ipInfo.salesEndDate ? 
                            new Date(product.ipInfo.salesEndDate).toLocaleDateString('ja-JP') : 
                            '未設定'
                          }
                        </p>
                        {expiryStatus === 'expired' && (
                          <Badge variant="destructive">期限切れ</Badge>
                        )}
                        {expiryStatus === 'warning' && (
                          <Badge className="bg-[#F59E0B] hover:bg-[#D97706]">期限注意</Badge>
                        )}
                        {expiryStatus === 'ok' && (
                          <Badge className="bg-[#10B981] hover:bg-[#059669]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  {product.ipInfo.licensorName && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">版元</p>
                      <p>{product.ipInfo.licensorName}</p>
                    </div>
                  )}
                  {product.ipInfo.licenseeName && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">ライセンシー</p>
                      <p>{product.ipInfo.licenseeName}</p>
                    </div>
                  )}
                  {product.ipInfo.manufacturerName && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">製造会社</p>
                      <p>{product.ipInfo.manufacturerName}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Movement History */}
        <div className="space-y-6">
          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle>QRコード</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center p-4">
                {product.qrCode ? (
                  <img
                    src={product.qrCode}
                    alt={`${product.name} QRコード`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <QrCode className="h-32 w-32 text-gray-400" />
                )}
              </div>
              <Button variant="outline" className="w-full mt-4">
                印刷
              </Button>
            </CardContent>
          </Card>

          {/* Movement History */}
          <Card>
            <CardHeader>
              <CardTitle>入出庫履歴</CardTitle>
            </CardHeader>
            <CardContent>
              {productMovements.length > 0 ? (
                <div className="space-y-3">
                  {productMovements.slice(0, 5).map((movement) => (
                    <div
                      key={movement.id}
                      className="pb-3 border-b last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge
                          variant={movement.movementType === 'in' ? 'default' : 'secondary'}
                          className={movement.movementType === 'in' ? 'bg-[#10B981]' : 'bg-[#2563EB]'}
                        >
                          {movement.movementType === 'in' ? '入庫' : '出庫'}
                        </Badge>
                        <span className="text-sm">{movement.quantity} 個</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {movement.reason}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(movement.createdAt).toLocaleString('ja-JP')}
                      </p>
                      {movement.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          備考: {movement.notes}
                        </p>
                      )}
                    </div>
                  ))}
                  {productMovements.length > 5 && (
                    <Button variant="outline" size="sm" className="w-full">
                      すべて表示
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  入出庫履歴がありません
                </p>
              )}
            </CardContent>
          </Card>

          {/* Registration Info */}
          <Card>
            <CardHeader>
              <CardTitle>登録・更新情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">登録者</p>
                <p>{product.createdBy}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">登録日時</p>
                <p className="text-sm">
                  {new Date(product.createdAt).toLocaleString('ja-JP')}
                </p>
              </div>
              {product.updatedBy && product.updatedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">最終更新者</p>
                    <p>{product.updatedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">最終更新日時</p>
                    <p className="text-sm">
                      {new Date(product.updatedAt).toLocaleString('ja-JP')}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Notes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>申し送り</CardTitle>
            <Button
              onClick={() => onNavigate('product-note-add', product.id)}
              className="bg-[#2563EB] hover:bg-[#1d4ed8]"
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              申し送り追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note) => {
                const noteTypeConfig = {
                  general: { label: '一般メモ', color: 'bg-blue-500', icon: FileText },
                  damage: { label: '破損報告', color: 'bg-red-500', icon: AlertCircle },
                  handover: { label: '引き継ぎ', color: 'bg-orange-500', icon: Repeat },
                  quality: { label: '品質確認', color: 'bg-green-500', icon: Package },
                };
                const config = noteTypeConfig[note.noteType];
                const Icon = config.icon;

                return (
                  <div
                    key={note.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${config.color}`} />
                        <Badge variant="outline">{config.label}</Badge>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{note.createdByName}</p>
                        <p>{new Date(note.createdAt).toLocaleString('ja-JP')}</p>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    {note.attachments && note.attachments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">添付ファイル:</p>
                        <div className="flex flex-wrap gap-2">
                          {note.attachments.map((attachment, index) => (
                            <div
                              key={index}
                              className="relative w-24 h-24 rounded-lg overflow-hidden border"
                            >
                              {attachment.type.startsWith('image/') ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                                  <FileText className="h-8 w-8 text-gray-400" />
                                  <p className="text-xs text-center px-1 mt-1 truncate w-full">
                                    {attachment.name}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <MessageSquarePlus className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground mb-4">
                まだ申し送りがありません
              </p>
              <Button
                variant="outline"
                onClick={() => onNavigate('product-note-add', product.id)}
              >
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                最初の申し送りを追加
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    
    {/* QRコード生成ダイアログ */}
    {showQRCode && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">QRコード生成</h3>
            <button onClick={() => setShowQRCode(false)} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          <p>QRコード生成機能は「QR生成」ページでご利用ください。</p>
          <div className="mt-4">
            <button 
              onClick={() => {
                onNavigate('qr-generator', product.id);
                setShowQRCode(false);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              QR生成ページへ
            </button>
            <button 
              onClick={() => setShowQRCode(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
