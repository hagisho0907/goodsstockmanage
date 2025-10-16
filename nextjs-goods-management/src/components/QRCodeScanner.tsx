'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import jsQR from 'jsqr';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import { 
  Camera, 
  CameraOff, 
  QrCode, 
  ArrowRightLeft,
  AlertCircle,
  CheckCircle,
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
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'denied' | 'prompt'>('checking');
  const [isMounted, setIsMounted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef(false);

  // マウント状態の管理
  useEffect(() => {
    setIsMounted(true);
  }, []);

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

      // デフォルトカメラの選択（常に背面カメラを優先）
      if (videoInputs.length > 0) {
        // バックカメラを優先して選択
        const backCamera = videoInputs.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment') ||
          device.label.toLowerCase().includes('主カメラ') ||
          device.label.toLowerCase().includes('外側')
        );
        
        if (backCamera) {
          console.log('[QRScanner] Back camera found:', backCamera);
          setSelectedCameraId(backCamera.deviceId);
        } else {
          // 背面カメラが見つからない場合は最後のカメラを使用（多くの場合、背面カメラ）
          console.log('[QRScanner] Using last camera (likely back camera):', videoInputs[videoInputs.length - 1]);
          setSelectedCameraId(videoInputs[videoInputs.length - 1].deviceId);
        }
      }
    } catch (error) {
      console.error('[QRScanner] Failed to enumerate devices:', error);
      setHasCamera(false);
    }
  }, [selectedCameraId]);

  // カメラ権限の確認（マウント後のみ）
  useEffect(() => {
    if (!isMounted) return;
    
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
  }, [isMounted, updateCameraDevices]);

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
    isScanningRef.current = false;
  }, []);

  // QRコードのスキャン結果を処理
  const handleScan = useCallback((data: string) => {
    console.log('[QRScanner] Raw QR data received:', data);
    
    // まずは何でもQRコードが読めたことを通知（テスト用）
    toast.info(`QRコード検出: ${data.substring(0, 50)}...`);
    
    try {
      // JSONパース
      const scanData = JSON.parse(data) as ScanResult;
      console.log('[QRScanner] Parsed QR data:', scanData);
      
      if (!scanData.id) {
        console.log('[QRScanner] Invalid QR code - missing id');
        toast.error('商品IDが含まれていません');
        return;
      }
      
      // typeフィールドは必須ではない（後方互換性のため）
      if (scanData.type && scanData.type !== 'product') {
        console.log('[QRScanner] Invalid QR code - wrong type:', scanData.type);
        toast.error('商品用QRコードではありません');
        return;
      }

      // 商品を検索
      const products = dataStore.getProducts();
      console.log('[QRScanner] Available products:', products.length);
      console.log('[QRScanner] Looking for product with id:', scanData.id);
      console.log('[QRScanner] Product IDs available:', products.map(p => p.id));
      const product = products.find(p => p.id === scanData.id);
      console.log('[QRScanner] Found product:', product);
      
      if (product) {
        console.log('[QRScanner] Product found! Setting scan result and found product');
        setScanResult(scanData);
        setFoundProduct(product);

        console.log('[QRScanner] Showing success toast');
        toast.success(`商品を検出: ${product.name}`);

        // モードに応じた処理
        if (mode === 'stock-in' || mode === 'stock-out') {
          console.log('[QRScanner] Stock mode detected, calling onProductDetected');
          if (onProductDetected) {
            onProductDetected(product.id);
          }
        }

        // 常にカメラを停止（シンプル化）
        console.log('[QRScanner] Stopping camera after detection');
        stopCamera();
      } else {
        console.log('[QRScanner] Product not found in database');
        toast.error('商品が見つかりません');
      }
    } catch (error) {
      console.error('[QRScanner] QR data parse error:', error);
      // JSONでない場合も許可（テスト用）
      toast.warning('QRコードを検出しましたが、商品データ形式ではありません');
    }
  }, [mode, onProductDetected, stopCamera]);

  // QRコードスキャンループ（requestAnimationFrame使用）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const startScanLoop = useCallback(() => {
    console.log('[QRScanner] Starting scan loop, isScanning:', isScanning);
    console.log('[QRScanner] Video ref:', videoRef.current);
    console.log('[QRScanner] Canvas ref:', canvasRef.current);
    
    let scanCount = 0;
    
    const scan = () => {
      scanCount++;
      
      if (scanCount === 1) {
        console.log('[QRScanner] First scan attempt');
        console.log('[QRScanner] videoRef.current:', videoRef.current);
        console.log('[QRScanner] canvasRef.current:', canvasRef.current);
        console.log('[QRScanner] isScanning:', isScanning);
      }
      
      if (!videoRef.current || !canvasRef.current || !isScanningRef.current) {
        if (scanCount % 60 === 0) { // ログを間引く
          console.log('[QRScanner] Scan stopped - videoRef:', !!videoRef.current, 'canvasRef:', !!canvasRef.current, 'isScanning:', isScanningRef.current);
        }
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        console.error('[QRScanner] No canvas context');
        animationFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        if (scanCount % 30 === 0) { // ログを間引く
          console.log('[QRScanner] Video not ready, readyState:', video.readyState);
        }
        animationFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      // Canvas のサイズを動画に合わせる
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (scanCount % 60 === 0) { // 1秒ごとにログ
        console.log('[QRScanner] Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        console.log('[QRScanner] Canvas dimensions:', canvas.width, 'x', canvas.height);
      }

      // 動画フレームを Canvas に描画
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // QRコードをスキャン
      try {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        if (scanCount % 60 === 0) { // 1秒ごとにログ
          console.log('[QRScanner] Image data length:', imageData.data.length);
          console.log('[QRScanner] Attempting QR detection...');
        }
        
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (code) {
          console.log('[QRScanner] QR Code detected!', code.data);
          handleScan(code.data);
        } else if (scanCount % 60 === 0) {
          console.log('[QRScanner] No QR code found in frame');
        }
      } catch (error) {
        console.error('[QRScanner] QR scan error:', error);
      }

      // 次のフレームをリクエスト
      animationFrameRef.current = requestAnimationFrame(scan);
    };

    // スキャンを開始
    animationFrameRef.current = requestAnimationFrame(scan);
  }, [handleScan]);

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
        console.log('[QRScanner] Video readyState:', videoRef.current.readyState);
        console.log('[QRScanner] Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
        
        console.log('[QRScanner] Setting isScanning to true');
        setIsScanning(true);
        isScanningRef.current = true;
        setPermissionStatus('granted');
        
        // スキャンループを開始
        setTimeout(() => {
          console.log('[QRScanner] About to start scan loop, isScanning will be:', true);
          console.log('[QRScanner] Video ref current:', videoRef.current);
          console.log('[QRScanner] Canvas ref current:', canvasRef.current);
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


  const getModeInfo = () => {
    switch (mode) {
      case 'stock-in':
        return {
          title: '入庫スキャン',
          description: '',
          icon: <ArrowRightLeft className="w-8 h-8" />
        };
      case 'stock-out':
        return {
          title: '出庫スキャン', 
          description: '',
          icon: <ArrowRightLeft className="w-8 h-8 rotate-180" />
        };
      default:
        return {
          title: 'QRスキャン',
          description: '',
          icon: <QrCode className="w-8 h-8" />
        };
    }
  };

  const modeInfo = getModeInfo();

  // マウント前は何も表示しない（Hydration エラー回避）
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {modeInfo.icon}
            {modeInfo.title}
          </h1>
          <p className="text-muted-foreground mt-1">{modeInfo.description}</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      <Card className="w-full max-w-full overflow-hidden border-gray-200 bg-gray-50">
        <CardContent className="space-y-4 w-full max-w-full overflow-hidden pt-6">
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
          <div className="flex justify-center">
            <Button
              onClick={() => {
                if (isScanning) {
                  stopCamera();
                } else {
                  startCamera();
                }
              }}
              variant={isScanning ? 'destructive' : 'default'}
              disabled={isRequestingCamera || !hasCamera}
              className="min-w-[120px] px-6 py-3"
              size="lg"
            >
              {isRequestingCamera ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  準備中
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
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden w-full max-w-full">
                {/* 常にvideo要素をレンダリング（非表示で） */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover max-w-full ${!isScanning ? 'hidden' : ''}`}
                />
                
                {isScanning ? (
                  <>
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
                      <p className="text-white bg-black bg-opacity-50 px-3 py-2 rounded text-sm">
                        QRコードを枠内に
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white">
                    {hasCamera ? (
                      <>
                        <Camera className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-sm">開始ボタンでスキャン</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-sm">カメラ利用不可</p>
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

      {/* スキャン用Canvas（非表示） */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}