'use client';

import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import QRCodeDisplay from 'react-qr-code';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { QrCode, Download, Printer, RefreshCw, Copy } from 'lucide-react';
import { products } from '../lib/mockData';
import { Product } from '../types';

interface QRCodeGeneratorProps {
  onNavigate: (page: string, id?: string) => void;
  productId?: string;
}

export function QRCodeGenerator({ onNavigate, productId }: QRCodeGeneratorProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    productId ? products.find(p => p.id === productId) || null : null
  );
  const [qrCodeData, setQrCodeData] = useState('');
  const [includeDetails, setIncludeDetails] = useState({
    name: true,
    jan: true,
    category: true,
    location: true,
    price: false,
    quantity: false,
    expiryDate: false
  });
  const [customText, setCustomText] = useState('');
  const [qrSize, setQrSize] = useState('256');

  const generateQRData = () => {
    if (!selectedProduct) {
      toast.error('物品を選択してください');
      return;
    }

    const data: Record<string, any> = {
      id: selectedProduct.id,
      type: 'product'
    };

    if (includeDetails.name) data.name = selectedProduct.name;
    if (includeDetails.jan) data.jan = selectedProduct.janCode;
    if (includeDetails.category) data.category = selectedProduct.category;
    if (includeDetails.location) data.location = selectedProduct.storageLocation;
    if (includeDetails.price) data.price = selectedProduct.unitPrice;
    if (includeDetails.quantity) data.quantity = selectedProduct.totalStock;
    if (includeDetails.expiryDate) data.expiryDate = selectedProduct.sellByDate;

    if (customText) {
      data.custom = customText;
    }

    const jsonData = JSON.stringify(data);
    setQrCodeData(jsonData);
    toast.success('QRコードを生成しました');
  };

  const downloadQRCode = async () => {
    if (!qrCodeData) {
      toast.error('先にQRコードを生成してください');
      return;
    }

    try {
      const dataUrl = await QRCode.toDataURL(qrCodeData, {
        width: parseInt(qrSize),
        margin: 2
      });

      const link = document.createElement('a');
      link.download = `qr-${selectedProduct?.janCode || 'custom'}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('QRコードをダウンロードしました');
    } catch (error) {
      toast.error('ダウンロードに失敗しました');
    }
  };

  const copyQRData = () => {
    if (!qrCodeData) {
      toast.error('先にQRコードを生成してください');
      return;
    }

    navigator.clipboard.writeText(qrCodeData);
    toast.success('QRデータをクリップボードにコピーしました');
  };

  const printQRCode = () => {
    if (!qrCodeData) {
      toast.error('先にQRコードを生成してください');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('ポップアップがブロックされています');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QRコード印刷</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
          }
          .qr-container {
            text-align: center;
            margin-bottom: 20px;
          }
          .product-info {
            margin-top: 10px;
            font-size: 14px;
          }
          button {
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="${qrSize}" height="${qrSize}">
            ${document.querySelector('#qr-code-display svg')?.innerHTML}
          </svg>
          ${selectedProduct ? `
            <div class="product-info">
              <strong>${selectedProduct.name}</strong><br>
              JAN: ${selectedProduct.janCode}
            </div>
          ` : ''}
        </div>
        <button class="no-print" onclick="window.print()">印刷</button>
        <button class="no-print" onclick="window.close()">閉じる</button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <QrCode className="w-8 h-8" />
          QRコード生成
        </h1>
        <p className="text-muted-foreground mt-1">物品情報のQRコードを生成・印刷します</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>QRコード設定</CardTitle>
            <CardDescription>
              生成するQRコードの内容を設定します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>物品選択</Label>
              <Select
                value={selectedProduct?.id || ''}
                onValueChange={(value) => {
                  const product = products.find(p => p.id === value);
                  setSelectedProduct(product || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="物品を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex flex-col">
                        <span>{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          JAN: {product.janCode}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>含める情報</Label>
              {Object.entries({
                name: '商品名',
                jan: 'JANコード',
                category: 'カテゴリ',
                location: '保管場所',
                price: '単価',
                quantity: '在庫数',
                expiryDate: '販売期限'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="font-normal">
                    {label}
                  </Label>
                  <Switch
                    id={key}
                    checked={includeDetails[key as keyof typeof includeDetails]}
                    onCheckedChange={(checked) => 
                      setIncludeDetails(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="custom-text">カスタムテキスト（任意）</Label>
              <Textarea
                id="custom-text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="追加情報を入力..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr-size">QRコードサイズ</Label>
              <Select value={qrSize} onValueChange={setQrSize}>
                <SelectTrigger id="qr-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="128">小（128px）</SelectItem>
                  <SelectItem value="256">中（256px）</SelectItem>
                  <SelectItem value="512">大（512px）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={generateQRData} 
              className="w-full"
              disabled={!selectedProduct}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              QRコード生成
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QRコードプレビュー</CardTitle>
            <CardDescription>
              生成されたQRコードが表示されます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrCodeData ? (
              <>
                <div className="flex justify-center p-4 bg-white rounded-lg border" id="qr-code-display">
                  <QRCodeDisplay
                    value={qrCodeData}
                    size={parseInt(qrSize)}
                    level="M"
                  />
                </div>

                {selectedProduct && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{selectedProduct.name}</p>
                    <p className="text-sm text-muted-foreground">
                      JAN: {selectedProduct.janCode}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={downloadQRCode} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    ダウンロード
                  </Button>
                  <Button onClick={printQRCode} variant="outline">
                    <Printer className="w-4 h-4 mr-2" />
                    印刷
                  </Button>
                  <Button 
                    onClick={copyQRData} 
                    variant="outline" 
                    className="col-span-2"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    データをコピー
                  </Button>
                </div>

                <div className="mt-4">
                  <Label className="text-xs">QRコードデータ:</Label>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(qrCodeData), null, 2)}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <QrCode className="w-16 h-16 mb-4" />
                <p>QRコードを生成してください</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}