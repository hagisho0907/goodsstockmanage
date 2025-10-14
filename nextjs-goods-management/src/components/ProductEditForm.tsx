import { useState, useEffect } from 'react';
import { Upload, X, Save, Check, ChevronsUpDown } from 'lucide-react';
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
import { categories, storageLocations, products, licensors, licensees, manufacturers } from '../lib/mockData';
import { cn } from './ui/utils';

interface ProductEditFormProps {
  onNavigate: (page: string) => void;
  productId?: string;
}

const availableRegions = ['日本', '中国', '韓国', 'アメリカ', 'フランス'];

export function ProductEditForm({ onNavigate, productId }: ProductEditFormProps) {
  const product = products.find(p => p.id === productId);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [stockNew, setStockNew] = useState(0);
  const [stockUsed, setStockUsed] = useState(0);
  const [stockDamaged, setStockDamaged] = useState(0);
  const [location, setLocation] = useState('');
  const [usedStockImages, setUsedStockImages] = useState<string[]>([]);
  const [damagedStockImages, setDamagedStockImages] = useState<string[]>([]);
  const [productionQty, setProductionQty] = useState('');
  const [salesRegions, setSalesRegions] = useState<string[]>([]);
  const [salesStart, setSalesStart] = useState('');
  const [salesEnd, setSalesEnd] = useState('');
  const [licensor, setLicensor] = useState('');
  const [licensee, setLicensee] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [isRegionPopoverOpen, setIsRegionPopoverOpen] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setCategory(product.categoryId);
      setDescription(product.description || '');
      if (product.imageUrl) {
        setSelectedImages([product.imageUrl]);
      }
      setStockNew(product.stockBreakdown.new);
      setStockUsed(product.stockBreakdown.used);
      setStockDamaged(product.stockBreakdown.damaged);
      setLocation(product.storageLocationId);
      setUsedStockImages(product.usedStockImages || []);
      setDamagedStockImages(product.damagedStockImages || []);
      
      if (product.ipInfo) {
        setProductionQty(product.ipInfo.productionQuantity?.toString() || '');
        setSalesRegions(product.ipInfo.salesRegions || []);
        setSalesStart(product.ipInfo.salesStartDate || '');
        setSalesEnd(product.ipInfo.salesEndDate || '');
        setLicensor(product.ipInfo.licensorId || '');
        setLicensee(product.ipInfo.licenseeId || '');
        setManufacturer(product.ipInfo.manufacturerId || '');
      }
    }
  }, [product]);

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

  const handleUsedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setUsedStockImages([...usedStockImages, ...newImages]);
    }
  };

  const removeUsedImage = (index: number) => {
    setUsedStockImages(usedStockImages.filter((_, i) => i !== index));
  };

  const handleDamagedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setDamagedStockImages([...damagedStockImages, ...newImages]);
    }
  };

  const removeDamagedImage = (index: number) => {
    setDamagedStockImages(damagedStockImages.filter((_, i) => i !== index));
  };

  const toggleRegion = (region: string) => {
    if (salesRegions.includes(region)) {
      setSalesRegions(salesRegions.filter(r => r !== region));
    } else {
      setSalesRegions([...salesRegions, region]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    onNavigate('products');
  };

  if (!product) {
    return (
      <div className="space-y-4">
        <h1>物品編集</h1>
        <div className="p-8 text-center border rounded-lg bg-gray-50">
          <p className="text-muted-foreground">商品が見つかりません</p>
        </div>
      </div>
    );
  }

  const totalStock = stockNew + stockUsed + stockDamaged;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1>物品編集</h1>
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
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              カテゴリ <span className="text-[#EF4444]">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory} required>
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
              placeholder="商品の説明を入力"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>商品画像</Label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`商品画像 ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {selectedImages.length < 5 && (
                  <label className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">追加</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                最大5枚まで登録できます
              </p>
            </div>
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
            <Label htmlFor="location">
              保管場所 <span className="text-[#EF4444]">*</span>
            </Label>
            <Select value={location} onValueChange={setLocation} required>
              <SelectTrigger id="location">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {storageLocations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h3>在庫状態別の数量</h3>
            
            <div className="space-y-2">
              <Label htmlFor="stockNew">
                正常在庫 <span className="text-[#EF4444]">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="stockNew"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={stockNew}
                  onChange={(e) => setStockNew(parseInt(e.target.value) || 0)}
                  required
                />
                <span className="text-sm text-muted-foreground">個</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockUsed">中古在庫</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="stockUsed"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={stockUsed}
                  onChange={(e) => setStockUsed(parseInt(e.target.value) || 0)}
                />
                <span className="text-sm text-muted-foreground">個</span>
              </div>
            </div>

            {stockUsed > 0 && (
              <div className="space-y-2 pl-4 border-l-2 border-[#F59E0B]">
                <Label>中古品の写真</Label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    {usedStockImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`中古品 ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={() => removeUsedImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <label className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">追加</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleUsedImageUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="stockDamaged">破損在庫</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="stockDamaged"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={stockDamaged}
                  onChange={(e) => setStockDamaged(parseInt(e.target.value) || 0)}
                />
                <span className="text-sm text-muted-foreground">個</span>
              </div>
            </div>

            {stockDamaged > 0 && (
              <div className="space-y-2 pl-4 border-l-2 border-[#EF4444]">
                <Label>破損品の写真</Label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    {damagedStockImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`破損品 ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={() => removeDamagedImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <label className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">追加</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleDamagedImageUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">総在庫数:</span>
                <span className="text-xl font-medium">{totalStock.toLocaleString()} 個</span>
              </div>
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
                value={productionQty}
                onChange={(e) => setProductionQty(e.target.value)}
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
                    <div
                      key={region}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-accent rounded-md p-2"
                      onClick={() => toggleRegion(region)}
                    >
                      <Checkbox
                        id={`region-${region}`}
                        checked={salesRegions.includes(region)}
                        onCheckedChange={() => toggleRegion(region)}
                      />
                      <Label
                        htmlFor={`region-${region}`}
                        className="flex-1 cursor-pointer"
                      >
                        {region}
                      </Label>
                      {salesRegions.includes(region) && (
                        <Check className="h-4 w-4 text-[#2563EB]" />
                      )}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {salesRegions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {salesRegions.map((region) => (
                  <div
                    key={region}
                    className="bg-[#2563EB]/10 text-[#2563EB] px-2 py-1 rounded text-sm flex items-center gap-1"
                  >
                    {region}
                    <button
                      type="button"
                      onClick={() => toggleRegion(region)}
                      className="hover:bg-[#2563EB]/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="salesStart">販売開始日</Label>
              <Input 
                id="salesStart" 
                type="date" 
                value={salesStart}
                onChange={(e) => setSalesStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salesEnd">販売終了日</Label>
              <Input 
                id="salesEnd" 
                type="date"
                value={salesEnd}
                onChange={(e) => setSalesEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="licensor">版元</Label>
            <Select value={licensor} onValueChange={setLicensor}>
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
            <Select value={licensee} onValueChange={setLicensee}>
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
            <Select value={manufacturer} onValueChange={setManufacturer}>
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
        <Checkbox id="generateQr" defaultChecked />
        <Label htmlFor="generateQr" className="cursor-pointer">
          QRコードを自動生成する
        </Label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="submit"
          className="bg-[#2563EB] hover:bg-[#1d4ed8]"
        >
          <Save className="h-4 w-4 mr-2" />
          更新
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
