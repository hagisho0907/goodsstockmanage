'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import jsQR from 'jsqr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';
import { 
  Camera, 
  CameraOff, 
  QrCode, 
  Package, 
  ArrowRightLeft,
  AlertCircle,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { dataStore } from '../lib/dataStore';
import { Product } from '../types';

interface QRCodeScannerProps {
  onNavigate: (page: string, id?: string) => void;
  mode?: 'search' | 'stock-in' | 'stock-out';
  onProductDetected?: (productId: string) => void;
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

export function QRCodeScanner({ onNavigate, mode = 'search', onProductDetected }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [continuousMode, setContinuousMode] = useState(false);
  const [scanHistory, setScanHistory] = useState<Array<{
    timestamp: Date;
    data: ScanResult;
    product?: Product;
  }>>([]);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'denied' | 'prompt'>('checking');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // カメラデバイスの更新
  const updateCameraDevices = useCallback(async () => {
    console.log('[QRScanner] Updating camera devices...');
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('[QRScanner] All devices:', devices);
      
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      console.log('[QRScanner] Video inputs found:', videoInputs.length, videoInputs);
      
      if (videoInputs.length === 0) {
        console.log('[QRScanner] No video inputs found');
        setHasCamera(false);
        return;
      }

      setCameraDevices(videoInputs);
      setHasCamera(true);

      // デフォルトカメラの選択
      if (!selectedCameraId && videoInputs.length > 0) {
        // バックカメラを優先
        const backCamera = videoInputs.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        
        if (backCamera) {
          console.log('[QRScanner] Back camera found:', backCamera);
          setSelectedCameraId(backCamera.deviceId);
        } else {
          console.log('[QRScanner] Using first camera:', videoInputs[0]);
          setSelectedCameraId(videoInputs[0].deviceId);
        }
      }
    } catch (error) {
      console.error('[QRScanner] Failed to enumerate devices:', error);
      setHasCamera(false);
    }
  }, [selectedCameraId]);

  // カメラ権限の確認
  useEffect(() => {
    const checkCameraPermission = async () => {
      console.log('[QRScanner] Checking camera permission...');
      console.log('[QRScanner] Current URL:', window.location.href);
      console.log('[QRScanner] Protocol:', window.location.protocol);
      console.log('[QRScanner] Is HTTPS:', window.location.protocol === 'https:');
      console.log('[QRScanner] Is localhost:', window.location.hostname === 'localhost');
      console.log('[QRScanner] navigator.mediaDevices:', navigator.mediaDevices);
      console.log('[QRScanner] getUserMedia available:', navigator.mediaDevices?.getUserMedia);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('[QRScanner] Media devices API not available');
        setHasCamera(false);
        setPermissionStatus('denied');
        return;
      }

      try {
        // カメラ権限の状態を確認
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
            console.log('[QRScanner] Permission query result:', result.state);
            setPermissionStatus(result.state);
            
            // 権限状態の変更を監視
            result.onchange = () => {
              console.log('[QRScanner] Permission changed to:', result.state);
              setPermissionStatus(result.state);
            };
          } catch {
            // permissions APIがサポートされていない場合
            console.log('[QRScanner] Permissions API not supported');
            setPermissionStatus('prompt');
          }
        } else {
          console.log('[QRScanner] Permissions API not available');
          setPermissionStatus('prompt');
        }

        // カメラデバイスの列挙
        await updateCameraDevices();
      } catch (error) {
        console.error('[QRScanner] Camera permission check failed:', error);
        setHasCamera(false);
        setPermissionStatus('denied');
      }
    };

    checkCameraPermission();
  }, [updateCameraDevices]);

  // カメラを停止
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  }, []);

  // QRコードのスキャン結果を処理
  const handleScan = useCallback((data: string) => {
    try {
      // JSONパース
      const scanData = JSON.parse(data) as ScanResult;
      
      if (!scanData.id || scanData.type !== 'product') {
        toast.error('無効なQRコードです');
        return;
      }

      // 商品を検索
      const products = dataStore.getProducts();
      const product = products.find(p => p.id === scanData.id);
      
      if (product) {
        setScanResult(scanData);
        setFoundProduct(product);
        
        // 履歴に追加
        setScanHistory(prev => [{
          timestamp: new Date(),
          data: scanData,
          product
        }, ...prev.slice(0, 9)]);

        toast.success(`商品を検出: ${product.name}`);

        // モードに応じた処理
        if (mode === 'stock-in' || mode === 'stock-out') {
          if (onProductDetected) {
            onProductDetected(product.id);
          }
        }

        if (!continuousMode) {
          stopCamera();
        }
      } else {
        toast.error('商品が見つかりません');
      }
    } catch (error) {
      console.error('QR data parse error:', error);
      toast.error('QRコードの形式が正しくありません');
    }
  }, [continuousMode, mode, onProductDetected, stopCamera]);

  // QRコードスキャンループ（requestAnimationFrame使用）
  const startScanLoop = useCallback(() => {
    const scan = () => {
      if (!videoRef.current || !canvasRef.current || !isScanning) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      // Canvas のサイズを動画に合わせる
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 動画フレームを Canvas に描画
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // QRコードをスキャン
      try {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code) {
          handleScan(code.data);
        }
      } catch (error) {
        console.error('QR scan error:', error);
      }

      // 次のフレームをリクエスト
      animationFrameRef.current = requestAnimationFrame(scan);
    };

    // スキャンを開始
    animationFrameRef.current = requestAnimationFrame(scan);
  }, [handleScan, isScanning]);

  // カメラを起動
  const startCamera = useCallback(async () => {
    console.log('[QRScanner] Starting camera...');
    console.log('[QRScanner] isRequestingCamera:', isRequestingCamera);
    console.log('[QRScanner] selectedCameraId:', selectedCameraId);
    
    if (isRequestingCamera) {
      console.log('[QRScanner] Already requesting camera, returning');
      return;
    }

    try {
      setIsRequestingCamera(true);
      
      // 既存のストリームを停止
      stopCamera();

      // カメラ設定
      const constraints: MediaStreamConstraints = {
        video: selectedCameraId 
          ? { deviceId: { exact: selectedCameraId } }
          : { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
        audio: false
      };
      
      console.log('[QRScanner] Camera constraints:', constraints);

      // カメラストリームを取得
      console.log('[QRScanner] Requesting getUserMedia...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[QRScanner] Got stream:', stream);
      console.log('[QRScanner] Stream tracks:', stream.getTracks());
      
      streamRef.current = stream;

      // ビデオ要素に設定
      if (videoRef.current) {
        console.log('[QRScanner] Setting video srcObject');
        videoRef.current.srcObject = stream;
        
        console.log('[QRScanner] Playing video...');
        await videoRef.current.play();
        console.log('[QRScanner] Video playing');
        
        setIsScanning(true);
        setPermissionStatus('granted');
        
        // スキャンループを開始
        setTimeout(() => {
          console.log('[QRScanner] Starting scan loop');
          startScanLoop();
        }, 500);
        
        toast.success('カメラを起動しました');
      } else {
        console.error('[QRScanner] Video element not found');
      }
    } catch (error) {
      console.error('[QRScanner] Camera start error:', error);
      console.error('[QRScanner] Error type:', typeof error);
      if (error instanceof Error) {
        console.error('[QRScanner] Error name:', error.name);
        console.error('[QRScanner] Error message:', error.message);
      } else {
        console.error('[QRScanner] Error name:', 'Unknown');
        console.error('[QRScanner] Error message:', String(error));
      }
      
      let errorMessage = 'カメラの起動に失敗しました';
      
      if (error instanceof Error) {
        console.log('[QRScanner] Error instance detected:', error.name);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'カメラへのアクセスが拒否されました';
          setPermissionStatus('denied');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = 'カメラが見つかりません';
          setHasCamera(false);
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage = 'カメラが他のアプリで使用中です';
        } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
          errorMessage = 'カメラの設定に問題があります';
        }
      }
      
      toast.error(errorMessage);
      stopCamera();
    } finally {
      setIsRequestingCamera(false);
    }
  }, [selectedCameraId, isRequestingCamera, stopCamera, startScanLoop]);

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // デバイスの変更を監視
  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return;

    const handleDeviceChange = () => {
      updateCameraDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [updateCameraDevices]);

  // 画像アップロード処理
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSrc = e.target?.result as string;
      setUploadedImage(imageSrc);
      setIsProcessingImage(true);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          toast.error('画像の処理に失敗しました');
          setIsProcessingImage(false);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            handleScan(code.data);
          } else {
            toast.error('QRコードが見つかりませんでした');
          }
        } catch {
          toast.error('QRコードの読み取りに失敗しました');
        }
        
        setIsProcessingImage(false);
      };
      
      img.onerror = () => {
        toast.error('画像の読み込みに失敗しました');
        setIsProcessingImage(false);
      };
      
      img.src = imageSrc;
    };
    
    reader.readAsDataURL(file);
  }, [handleScan]);

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

      <Tabs defaultValue="scanner" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scanner">スキャナー</TabsTrigger>
          <TabsTrigger value="upload">画像アップロード</TabsTrigger>
          <TabsTrigger value="history">履歴</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>カメラスキャン</CardTitle>
              <CardDescription>
                カメラを使用してQRコードをスキャンします
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 権限エラー表示 */}
              {permissionStatus === 'denied' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    カメラへのアクセスが拒否されています。
                    ブラウザの設定からカメラの使用を許可してください。
                  </AlertDescription>
                </Alert>
              )}

              {/* カメラコントロール */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2 flex-1">
                  <Switch
                    id="continuous"
                    checked={continuousMode}
                    onCheckedChange={setContinuousMode}
                  />
                  <Label htmlFor="continuous">連続スキャン</Label>
                </div>

                {cameraDevices.length > 1 && (
                  <Select value={selectedCameraId} onValueChange={setSelectedCameraId}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="カメラを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {cameraDevices.map((device, index) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label || `カメラ ${index + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button
                  onClick={() => {
                    console.log('[QRScanner] Button clicked');
                    console.log('[QRScanner] Current state - isScanning:', isScanning);
                    console.log('[QRScanner] Current state - hasCamera:', hasCamera);
                    console.log('[QRScanner] Current state - permissionStatus:', permissionStatus);
                    if (isScanning) {
                      stopCamera();
                    } else {
                      startCamera();
                    }
                  }}
                  variant={isScanning ? 'destructive' : 'default'}
                  disabled={isRequestingCamera || !hasCamera}
                  className="min-w-[140px]"
                >
                  {isRequestingCamera ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      準備中...
                    </>
                  ) : isScanning ? (
                    <>
                      <CameraOff className="mr-2 h-4 w-4" />
                      停止
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      開始
                    </>
                  )}
                </Button>
              </div>

              {/* カメラビュー */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {isScanning ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* スキャンフレーム */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-64 border-2 border-white rounded-lg">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <p className="text-white bg-black bg-opacity-50 px-4 py-2 rounded">
                        QRコードを枠内に合わせてください
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white">
                    {hasCamera ? (
                      <>
                        <Camera className="w-16 h-16 mb-4 opacity-50" />
                        <p>「開始」ボタンをクリックしてスキャンを開始</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
                        <p>カメラが利用できません</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* スキャン結果 */}
              {scanResult && foundProduct && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-green-900">商品を検出しました</p>
                      <div className="space-y-1 text-sm">
                        <p>商品名: {foundProduct.name}</p>
                        <p>SKU: {foundProduct.sku}</p>
                        <p>在庫: {foundProduct.currentStock}個</p>
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
                            {mode === 'stock-in' ? '入庫' : '出庫'}処理
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

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>画像からQRコード読み取り</CardTitle>
              <CardDescription>
                QRコードが含まれた画像をアップロードして読み取ります
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {uploadedImage ? (
                    <div className="space-y-4">
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="max-w-full max-h-64 mx-auto rounded"
                      />
                      {isProcessingImage && (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          処理中...
                        </div>
                      )}
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setUploadedImage(null);
                            setScanResult(null);
                            setFoundProduct(null);
                          }}
                        >
                          クリア
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          別の画像を選択
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">
                        クリックまたはドラッグ＆ドロップで画像をアップロード
                      </p>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        ファイルを選択
                      </Button>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>スキャン履歴</CardTitle>
              <CardDescription>
                最近スキャンした商品の履歴
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanHistory.length > 0 ? (
                <div className="space-y-2">
                  {scanHistory.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => item.product && onNavigate('product-detail', item.product.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.timestamp.toLocaleString('ja-JP')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{item.product?.categoryName}</Badge>
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
                <p className="text-center text-gray-500 py-8">
                  まだスキャン履歴はありません
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* スキャン用Canvas（非表示） */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}