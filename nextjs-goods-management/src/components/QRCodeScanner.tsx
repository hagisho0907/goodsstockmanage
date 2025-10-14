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
  Search, 
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
  onProductDetected?: (productId: string) => void; // 商品検出時のコールバック
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
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isScanningRef = useRef(false);

  const stopCamera = useCallback((options?: { silent?: boolean }) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
    isScanningRef.current = false;
    setIsRequestingCamera(false);
    if (!options?.silent) {
      toast.info('カメラを停止しました');
    }
  }, []);

  const updateCameraDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setHasCamera(false);
      setCameraDevices([]);
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === 'videoinput');
      const usableDevices = videoInputs.filter((device) => Boolean(device.deviceId));

      setCameraDevices(usableDevices);
      setHasCamera(videoInputs.length > 0);

      if (!selectedCameraId) {
        const preferredDevice =
          usableDevices.find(
            (device) =>
              device.label &&
              /back|environment|rear/i.test(device.label.toLowerCase()),
          ) ?? usableDevices[0];

        if (preferredDevice?.deviceId) {
          setSelectedCameraId(preferredDevice.deviceId);
        }
      }
    } catch (error) {
      console.error('Camera enumeration failed:', error);
      setHasCamera(false);
      setCameraDevices([]);
    }
  }, [selectedCameraId]);

  // カメラの利用可能性をチェック
  useEffect(() => {
    if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function') {
      updateCameraDevices();
    } else {
      setHasCamera(false);
    }
  }, [updateCameraDevices]);

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

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      stopCamera({ silent: true });
    };
  }, [stopCamera]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopCamera({ silent: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stopCamera]);

  const startCamera = useCallback(
    async (targetDeviceId?: string) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('カメラAPIがサポートされていません');
        return;
      }

      try {
        stopCamera({ silent: true });
        setIsRequestingCamera(true);

        const selectedId = targetDeviceId ?? selectedCameraId;
        const videoConstraints: MediaTrackConstraints = selectedId
          ? { deviceId: { exact: selectedId } }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
            };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        await updateCameraDevices();

        const videoElement = videoRef.current;
        if (!videoElement) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const [track] = stream.getVideoTracks();
        const settings = track.getSettings();
        if (!selectedId && settings.deviceId) {
          setSelectedCameraId(settings.deviceId);
        }

        videoElement.srcObject = stream;
        streamRef.current = stream;

        // iOS向け属性セット
        videoElement.setAttribute('playsinline', 'true');
        videoElement.setAttribute('autoplay', 'true');
        videoElement.setAttribute('muted', 'true');
        videoElement.playsInline = true;
        videoElement.autoplay = true;
        videoElement.muted = true;

        try {
          await videoElement.play();
          setIsScanning(true);
          isScanningRef.current = true;
          setPermissionStatus('granted');
          startQRScan();
          toast.success('カメラを起動しました');
        } catch (playError) {
          console.error('Video playback failed:', playError);
          toast.error('カメラの再生がブロックされました。画面をタップしてから再試行してください。');
        }
      } catch (error) {
        console.error('Camera access failed:', error);
        setIsScanning(false);
        isScanningRef.current = false;

        let errorMessage = 'カメラへのアクセスに失敗しました';
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            errorMessage = 'カメラの使用許可が必要です。ブラウザの設定を確認してください';
            setPermissionStatus('denied');
          } else if (error.name === 'NotFoundError') {
            errorMessage = 'カメラが見つかりません';
          } else if (error.name === 'NotReadableError') {
            errorMessage = 'カメラが他のアプリで使用中です';
          } else if (error.name === 'NotSupportedError') {
            errorMessage = 'HTTPS環境が必要です';
          }
        }

        toast.error(errorMessage);
      } finally {
        setIsRequestingCamera(false);
      }
    },
    [selectedCameraId, stopCamera, updateCameraDevices],
  );

  const handleSelectCamera = useCallback(
    async (deviceId: string) => {
      setSelectedCameraId(deviceId);

      if (isRequestingCamera) {
        return;
      }

      if (isScanningRef.current) {
        await startCamera(deviceId);
      }
    },
    [isRequestingCamera, startCamera],
  );

  const handleCycleCamera = useCallback(async () => {
    if (cameraDevices.length <= 1) {
      toast.info('切り替え可能なカメラが見つかりません');
      return;
    }

    const currentIndex = cameraDevices.findIndex(
      (device) => device.deviceId === selectedCameraId,
    );
    const nextDevice = cameraDevices[(currentIndex + 1) % cameraDevices.length];

    if (nextDevice?.deviceId) {
      await handleSelectCamera(nextDevice.deviceId);
    } else {
      await startCamera();
    }
  }, [cameraDevices, handleSelectCamera, selectedCameraId, startCamera]);

  const handleCameraChange = useCallback(
    async (value: string) => {
      if (value === 'auto') {
        setSelectedCameraId('');
        if (isScanningRef.current && !isRequestingCamera) {
          await startCamera();
        }
        return;
      }

      await handleSelectCamera(value);
    },
    [handleSelectCamera, isRequestingCamera, startCamera],
  );

  // リアルタイムQRコードスキャン機能
  const startQRScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && isScanningRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            handleScan(code.data);
          }
        }
      }
    }, 300); // 300ms間隔でスキャン
  };

  const handleScan = useCallback((result: string) => {
    try {
      const data = JSON.parse(result) as ScanResult;
      
      if (data.type !== 'product' || !data.id) {
        toast.error('無効なQRコードです');
        return;
      }

      const products = dataStore.getProducts();
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
          stopCamera({ silent: true });
        }

        // モードに応じた処理
        switch (mode) {
          case 'stock-in':
          case 'stock-out':
            if (onProductDetected) {
              // 入出庫モードでは即座にコールバックを呼び出し
              onProductDetected(product.id);
            } else {
              setTimeout(() => {
                onNavigate('stock-movement', product.id);
              }, 1500);
            }
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
  }, [continuousMode, mode, onNavigate, onProductDetected, stopCamera]);

  // 画像ファイルからQRコードを読み取る
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageSrc = e.target?.result as string;
      setUploadedImage(imageSrc);
      setIsProcessingImage(true);

      try {
        // 画像をCanvasに描画してImageDataを取得
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
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // jsQRでQRコードを検出
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            try {
              const qrData = JSON.parse(code.data);
              handleScan(qrData);
              toast.success('QRコードを検出しました');
            } catch (error) {
              toast.error('QRコードの形式が正しくありません');
            }
          } else {
            toast.error('QRコードが見つかりませんでした');
          }
          
          setIsProcessingImage(false);
        };
        
        img.onerror = () => {
          toast.error('画像の読み込みに失敗しました');
          setIsProcessingImage(false);
        };
        
        img.src = imageSrc;
      } catch (error) {
        toast.error('画像の処理中にエラーが発生しました');
        setIsProcessingImage(false);
      }
    };
    
    reader.readAsDataURL(file);
  }, [handleScan]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setScanResult(null);
    setFoundProduct(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scanner">スキャナー</TabsTrigger>
          <TabsTrigger value="upload">画像アップロード</TabsTrigger>
          <TabsTrigger value="history">スキャン履歴</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>カメラスキャン</CardTitle>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="continuous"
                      checked={continuousMode}
                      onCheckedChange={setContinuousMode}
                    />
                    <Label htmlFor="continuous">連続スキャン</Label>
                  </div>
                  {hasCamera && cameraDevices.length > 1 && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedCameraId || 'auto'}
                        onValueChange={handleCameraChange}
                        disabled={isRequestingCamera}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="カメラ選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">自動選択</SelectItem>
                          {cameraDevices.map((device, index) => (
                            <SelectItem key={device.deviceId} value={device.deviceId}>
                              {device.label || `カメラ${index + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCycleCamera}
                        disabled={isRequestingCamera}
                      >
                        カメラ切替
                      </Button>
                    </div>
                  )}
                  {hasCamera ? (
                    <Button
                      onClick={() => (isScanning ? stopCamera() : startCamera())}
                      variant={isScanning ? 'destructive' : 'default'}
                      disabled={isRequestingCamera}
                    >
                      {isRequestingCamera ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          準備中...
                        </>
                      ) : isScanning ? (
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
                  ) : (
                    <Alert className="p-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        カメラが利用できません
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {permissionStatus === 'denied' && (
                <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm leading-relaxed">
                    カメラの使用がブラウザによってブロックされています。ブラウザの設定からこのサイトへのカメラアクセスを許可し、ページを再読み込みしてください。
                  </AlertDescription>
                </Alert>
              )}
              {isScanning ? (
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    controls={false}
                    webkit-playsinline="true"
                    x-webkit-airplay="allow"
                    style={{ objectFit: 'cover' }}
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
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <p className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                      QRコードをスキャン枠内に合わせてください
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
                  {hasCamera ? (
                    <>
                      <Camera className="w-16 h-16 text-gray-400 mb-4" />
                      <p className="text-gray-500">
                        「スキャン開始」をクリックしてカメラを起動してください
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
                      <p className="text-gray-500">
                        カメラが利用できません
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        代わりに手動でQRコードデータを入力するか、<br />
                        ファイルアップロード機能をご利用ください
                      </p>
                    </>
                  )}
                </div>
              )}

              {!hasCamera && (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                  <h3 className="font-medium text-blue-900">代替手段</h3>
                  <p className="text-blue-800 text-sm">
                    カメラスキャンが利用できない場合は、以下の方法をお試しください：
                  </p>
                  <div className="space-y-2 text-sm text-blue-700">
                    <div>• QRコード画像をアップロード</div>
                    <div>• JANコードで手動検索</div>
                    <div>• 物品一覧から選択</div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => onNavigate('products')}
                    className="mt-2"
                  >
                    物品一覧へ
                  </Button>
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
                          <span className="text-gray-600">SKU:</span>
                          <span className="ml-2 font-mono">{foundProduct.sku}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">カテゴリ:</span>
                          <span className="ml-2">{foundProduct.categoryName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">保管場所:</span>
                          <span className="ml-2">{foundProduct.storageLocationName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">在庫数:</span>
                          <span className="ml-2">{foundProduct.currentStock}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">単価:</span>
                          <span className="ml-2">価格情報なし</span>
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

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                画像からQRコード読み取り
              </CardTitle>
              <CardDescription>
                QRコードが含まれた画像ファイルをアップロードして読み取ります
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {uploadedImage ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={uploadedImage}
                        alt="アップロードされた画像"
                        className="max-w-full max-h-64 rounded-lg border"
                      />
                      {isProcessingImage && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                            処理中...
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={openFileDialog} variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        別の画像を選択
                      </Button>
                      <Button onClick={clearUploadedImage} variant="outline">
                        クリア
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ImageIcon className="w-16 h-16 mx-auto text-gray-400" />
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        QRコード画像をアップロード
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        PNG、JPG、GIF形式の画像に対応しています
                      </p>
                      <Button onClick={openFileDialog} className="mx-auto">
                        <Upload className="w-4 h-4 mr-2" />
                        ファイルを選択
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* 読み取り結果 */}
              {scanResult && foundProduct && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {foundProduct.imageUrl ? (
                          <img
                            src={foundProduct.imageUrl}
                            alt={foundProduct.name}
                            className="w-16 h-16 rounded-lg object-cover border"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-green-800">商品を検出しました</h4>
                        </div>
                        <p className="font-medium">{foundProduct.name}</p>
                        <p className="text-sm text-gray-600">SKU: {foundProduct.sku}</p>
                        <p className="text-sm text-gray-600">在庫: {foundProduct.currentStock}個</p>
                        <p className="text-sm text-gray-600">保管場所: {foundProduct.storageLocationName}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => onNavigate('product-detail', foundProduct.id)}
                        >
                          詳細を見る
                        </Button>
                        {(mode === 'stock-in' || mode === 'stock-out') && (
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
                  </CardContent>
                </Card>
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
                            {item.product?.sku || 'No SKU'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {item.timestamp.toLocaleTimeString('ja-JP')}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {item.product?.categoryName || 'Unknown'}
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

      {/* QRコード検出用の非表示canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
