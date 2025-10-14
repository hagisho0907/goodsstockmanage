import { useState } from 'react';
import { Upload, X, Save, ChevronsUpDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { categories, storageLocations, licensors, licensees, manufacturers, dataStore } from '../lib/dataStore';
import { toast } from 'sonner';
import type { Product } from '../types';

interface ProductRegisterFormProps {
  onNavigate: (page: string) => void;
}

const availableRegions = ['日本', '中国', '韓国', 'アメリカ', 'フランス'];

type ProductFormState = {
  name: string;
  sku: string;
  categoryId: string;
  description: string;
  storageLocationId: string;
  initialStock: {
    new: number;
    used: number;
    damaged: number;
  };
  productionQuantity: number;
  salesStartDate: string;
  salesEndDate: string;
  licensorId: string;
  licenseeId: string;
  manufacturerId: string;
  generateQr: boolean;
};

export function ProductRegisterForm({ onNavigate }: ProductRegisterFormProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [salesRegions, setSalesRegions] = useState<string[]>([]);
  const [isRegionPopoverOpen, setIsRegionPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // フォーム状態
  const [formData, setFormData] = useState<ProductFormState>({
    name: '',
    sku: '',
    categoryId: '',
    description: '',
    storageLocationId: '',
    initialStock: {
      new: 0,
      used: 0,
      damaged: 0
    },
    productionQuantity: 0,
    salesStartDate: '',
    salesEndDate: '',
    licensorId: '',
    licenseeId: '',
    manufacturerId: '',
    generateQr: true
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setSelectedImages([...selectedImages, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const toggleRegion = (region: string) => {
    if (salesRegions.includes(region)) {
      setSalesRegions(salesRegions.filter(r => r !== region));
    } else {
      setSalesRegions([...salesRegions, region]);
    }
  };

  const handleInputChange = <K extends keyof ProductFormState>(
    field: K,
    value: ProductFormState[K],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStockChange = (type: 'new' | 'used' | 'damaged', value: number) => {
    setFormData(prev => ({
      ...prev,
      initialStock: {
        ...prev.initialStock,
        [type]: Math.max(0, value)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.sku.trim() || !formData.categoryId || !formData.storageLocationId) {
      toast.error('必須項目を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const category = categories.find(c => c.id === formData.categoryId);
      const storageLocation = storageLocations.find(s => s.id === formData.storageLocationId);
      
      const totalStock = formData.initialStock.new + formData.initialStock.used + formData.initialStock.damaged;

      const newProduct: Product = {
        id: dataStore.generateId(),
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        categoryId: formData.categoryId,
        categoryName: category?.name || '',
        currentStock: totalStock,
        storageLocationId: formData.storageLocationId,
        storageLocationName: storageLocation?.name || '',
        stockBreakdown: {
          new: formData.initialStock.new,
          used: formData.initialStock.used,
          damaged: formData.initialStock.damaged
        },
        ipInfo: {
          productionQuantity: formData.productionQuantity || undefined,
          salesRegions: salesRegions.length > 0 ? salesRegions : undefined,
          salesStartDate: formData.salesStartDate || undefined,
          salesEndDate: formData.salesEndDate || undefined,
          licensorId: formData.licensorId || undefined,
          licensorName: formData.licensorId ? licensors.find(l => l.id === formData.licensorId)?.name : undefined,
          licenseeId: formData.licenseeId || undefined,
          licenseeName: formData.licenseeId ? licensees.find(l => l.id === formData.licenseeId)?.name : undefined,
          manufacturerId: formData.manufacturerId || undefined,
          manufacturerName: formData.manufacturerId ? manufacturers.find(m => m.id === formData.manufacturerId)?.name : undefined
        },
        createdBy: 'admin@example.com',
        createdAt: new Date().toISOString()
      };

      // データストアに追加
      dataStore.addProduct(newProduct);

      toast.success('商品を登録しました');
      
      // 商品一覧へ遷移
      setTimeout(() => {
        onNavigate('products');
      }, 1000);
      
    } catch (error) {
      console.error('Product registration error:', error);
      toast.error('商品の登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1>物品登録</h1>
        <p className="text-muted-foreground mt-1">新しい物品を在庫管理システムに登録します</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                商品名 <span className="text-[#EF4444]">*</span>
              </Label>
              <Input 
                id="name" 
                placeholder="商品名を入力" 
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">
                SKU <span className="text-[#EF4444]">*</span>
              </Label>
              <Input 
                id="sku" 
                placeholder="SKUを入力" 
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              カテゴリ <span className="text-[#EF4444]">*</span>
            </Label>
            <Select 
              value={formData.categoryId} 
              onValueChange={(value) => handleInputChange('categoryId', value)}
              required
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">商品説明</Label>
            <Textarea
              id="description"
              placeholder="商品の詳細説明を入力"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>商品画像</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="imageUpload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      ファイルをアップロードまたはドロップ
                    </span>
                  </Label>
                  <input
                    id="imageUpload"
                    name="imageUpload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stock Information */}
      <Card>
        <CardHeader>
          <CardTitle>在庫情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storageLocation">
              保管場所 <span className="text-[#EF4444]">*</span>
            </Label>
            <Select 
              value={formData.storageLocationId}
              onValueChange={(value) => handleInputChange('storageLocationId', value)}
              required
            >
              <SelectTrigger id="storageLocation">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {storageLocations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>初期在庫数</Label>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="stockNew">正常</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="stockNew"
                    type="number"
                    placeholder="0"
                    min="0"
                    value={formData.initialStock.new}
                    onChange={(e) => handleStockChange('new', parseInt(e.target.value) || 0)}
                  />
                  <span className="text-sm text-muted-foreground">個</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockUsed">中古</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="stockUsed"
                    type="number"
                    placeholder="0"
                    min="0"
                    value={formData.initialStock.used}
                    onChange={(e) => handleStockChange('used', parseInt(e.target.value) || 0)}
                  />
                  <span className="text-sm text-muted-foreground">個</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockDamaged">破損</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="stockDamaged"
                    type="number"
                    placeholder="0"
                    min="0"
                    value={formData.initialStock.damaged}
                    onChange={(e) => handleStockChange('damaged', parseInt(e.target.value) || 0)}
                  />
                  <span className="text-sm text-muted-foreground">個</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                総在庫数: <span className="font-medium">{formData.initialStock.new + formData.initialStock.used + formData.initialStock.damaged}</span> 個
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Information */}
      <Card>
        <CardHeader>
          <CardTitle>詳細情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productionQty">製造数</Label>
            <div className="flex items-center gap-2">
              <Input
                id="productionQty"
                type="number"
                placeholder="0"
                min="0"
                value={formData.productionQuantity}
                onChange={(e) => handleInputChange('productionQuantity', parseInt(e.target.value) || 0)}
              />
              <span className="text-sm text-muted-foreground">個</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>販売可能地域</Label>
            <Popover open={isRegionPopoverOpen} onOpenChange={setIsRegionPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isRegionPopoverOpen}
                  className="w-full justify-between"
                  type="button"
                >
                  {salesRegions.length > 0
                    ? `${salesRegions.length}件選択中`
                    : "選択してください"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="p-3 space-y-2">
                  {availableRegions.map((region) => (
                    <Label
                      key={region}
                      htmlFor={`region-${region}`}
                      className="flex items-center gap-3 rounded-md p-2 cursor-pointer hover:bg-accent"
                    >
                      <Checkbox
                        id={`region-${region}`}
                        checked={salesRegions.includes(region)}
                        onCheckedChange={() => toggleRegion(region)}
                      />
                      <span>{region}</span>
                    </Label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="salesStart">販売開始日</Label>
              <Input
                type="date"
                id="salesStart"
                value={formData.salesStartDate}
                onChange={(e) => handleInputChange('salesStartDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salesEnd">販売終了日</Label>
              <Input
                type="date"
                id="salesEnd"
                value={formData.salesEndDate}
                onChange={(e) => handleInputChange('salesEndDate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="licensor">版元</Label>
            <Select 
              value={formData.licensorId}
              onValueChange={(value) => handleInputChange('licensorId', value)}
            >
              <SelectTrigger id="licensor">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {licensors.map((lic) => (
                  <SelectItem key={lic.id} value={lic.id}>
                    {lic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="licensee">ライセンシー</Label>
            <Select 
              value={formData.licenseeId}
              onValueChange={(value) => handleInputChange('licenseeId', value)}
            >
              <SelectTrigger id="licensee">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {licensees.map((lic) => (
                  <SelectItem key={lic.id} value={lic.id}>
                    {lic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manufacturer">製造会社</Label>
            <Select 
              value={formData.manufacturerId}
              onValueChange={(value) => handleInputChange('manufacturerId', value)}
            >
              <SelectTrigger id="manufacturer">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map((man) => (
                  <SelectItem key={man.id} value={man.id}>
                    {man.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Generation */}
      <div className="flex items-center gap-2">
        <Checkbox 
          id="generateQr" 
          checked={formData.generateQr}
          onCheckedChange={(checked) => handleInputChange('generateQr', Boolean(checked))}
        />
        <Label htmlFor="generateQr" className="cursor-pointer">
          QRコードを自動生成する
        </Label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          type="submit" 
          className="bg-[#2563EB] hover:bg-[#1d4ed8]"
          disabled={isSubmitting}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? '登録中...' : '登録'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onNavigate('products')}
        >
          キャンセル
        </Button>
      </div>
    </form>
  );
}
