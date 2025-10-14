'use client';

import { useState } from 'react';
import { Product } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { QrCode, Download, Printer, Copy } from 'lucide-react';

interface QRCodeGeneratorProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeGenerator({ product, isOpen, onClose }: QRCodeGeneratorProps) {
  const [qrCodeSize, setQrCodeSize] = useState('medium');
  const [includeText, setIncludeText] = useState(true);

  // QRコードデータの生成
  const generateQRData = () => {
    return JSON.stringify({
      id: product.id,
      sku: product.sku,
      name: product.name,
      type: 'product',
      timestamp: new Date().toISOString(),
    });
  };

  // QRコードSVGの生成（シンプルな実装）
  const generateQRCodeSVG = (data: string, size: number) => {
    // 実際の実装では qrcode.js などのライブラリを使用
    // ここではプレースホルダーとしてシンプルなSVGを返す
    const qrData = generateQRData();
    const cellSize = size / 25; // 25x25 grid
    
    // シンプルなパターン生成（実際はQRコードアルゴリズムを使用）
    const pattern = Array(25).fill(0).map((_, i) => 
      Array(25).fill(0).map((_, j) => 
        Math.random() > 0.5 ? 1 : 0
      )
    );

    const cells = pattern.map((row, i) => 
      row.map((cell, j) => 
        cell ? `<rect x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>` : ''
      ).join('')
    ).join('');

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="white"/>
        ${cells}
      </svg>
    `;
  };

  const getSizePixels = (size: string) => {
    switch (size) {
      case 'small': return 150;
      case 'medium': return 200;
      case 'large': return 300;
      case 'xlarge': return 400;
      default: return 200;
    }
  };

  const handleCopyData = () => {
    const qrData = generateQRData();
    navigator.clipboard.writeText(qrData);
    toast.success('QRコードデータをコピーしました');
  };

  const handleDownloadSVG = () => {
    const size = getSizePixels(qrCodeSize);
    const svg = generateQRCodeSVG(generateQRData(), size);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrcode-${product.sku}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('QRコードをダウンロードしました');
  };

  const handleDownloadPNG = () => {
    const size = getSizePixels(qrCodeSize);
    const svg = generateQRCodeSVG(generateQRData(), size);
    
    // SVGをPNGに変換
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = size;
    canvas.height = includeText ? size + 60 : size;
    
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      if (ctx) {
        // 背景を白で塗りつぶし
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // QRコードを描画
        ctx.drawImage(img, 0, 0, size, size);
        
        // テキストを追加
        if (includeText) {
          ctx.fillStyle = 'black';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(product.sku, size / 2, size + 20);
          ctx.fillText(product.name, size / 2, size + 40);
        }
        
        // PNGとしてダウンロード
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `qrcode-${product.sku}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(pngUrl);
            toast.success('QRコードをダウンロードしました');
          }
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  const handlePrint = () => {
    const size = getSizePixels(qrCodeSize);
    const svg = generateQRCodeSVG(generateQRData(), size);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QRコード印刷 - ${product.sku}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                text-align: center;
              }
              .qrcode-container {
                display: inline-block;
                border: 1px solid #ccc;
                padding: 20px;
                margin: 10px;
              }
              .product-info {
                margin-top: 10px;
                font-size: 14px;
              }
              .sku {
                font-weight: bold;
                font-size: 16px;
              }
            </style>
          </head>
          <body>
            <div class="qrcode-container">
              ${svg}
              ${includeText ? `
                <div class="product-info">
                  <div class="sku">${product.sku}</div>
                  <div>${product.name}</div>
                </div>
              ` : ''}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
    
    toast.success('印刷ダイアログを開きました');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QRコード生成
          </DialogTitle>
          <DialogDescription>
            商品「{product.name}」のQRコードを生成・印刷できます
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 設定パネル */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">QRコード設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">サイズ</label>
                  <Select value={qrCodeSize} onValueChange={setQrCodeSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">小 (150px)</SelectItem>
                      <SelectItem value="medium">中 (200px)</SelectItem>
                      <SelectItem value="large">大 (300px)</SelectItem>
                      <SelectItem value="xlarge">特大 (400px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeText"
                    checked={includeText}
                    onChange={(e) => setIncludeText(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="includeText" className="text-sm font-medium">
                    商品情報を含める
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">商品情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium">SKU: </span>
                  <span className="text-sm">{product.sku}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">商品名: </span>
                  <span className="text-sm">{product.name}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">カテゴリ: </span>
                  <span className="text-sm">{product.categoryName}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">保管場所: </span>
                  <span className="text-sm">{product.storageLocationName}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* プレビューパネル */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">プレビュー</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: generateQRCodeSVG(generateQRData(), getSizePixels(qrCodeSize)) 
                    }}
                    className="flex justify-center"
                  />
                  {includeText && (
                    <div className="text-center mt-2 space-y-1">
                      <div className="font-bold text-sm">{product.sku}</div>
                      <div className="text-xs text-muted-foreground">{product.name}</div>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground text-center">
                  サイズ: {getSizePixels(qrCodeSize)}px × {getSizePixels(qrCodeSize)}px
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button 
                onClick={handlePrint}
                className="w-full"
                variant="default"
              >
                <Printer className="w-4 h-4 mr-2" />
                印刷
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleDownloadPNG}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  PNG
                </Button>
                <Button 
                  onClick={handleDownloadSVG}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  SVG
                </Button>
              </div>
              
              <Button 
                onClick={handleCopyData}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                データをコピー
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">QRコードに含まれるデータ:</h4>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
            {JSON.stringify(JSON.parse(generateQRData()), null, 2)}
          </pre>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}