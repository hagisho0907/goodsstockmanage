import { useState } from 'react';
import { Search, Plus, Edit, Eye, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Checkbox } from './ui/checkbox';
import { dataStore, categories, storageLocations } from '../lib/dataStore';

interface ProductListProps {
  onNavigate: (page: string, productId?: string) => void;
}

export function ProductList({ onNavigate }: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [products, setProducts] = useState(() => dataStore.getProducts());

  // データ更新の監視（リアルタイム更新）
  const refreshProducts = () => {
    setProducts(dataStore.getProducts());
  };

  const getExpiryStatus = (salesEndDate?: string) => {
    if (!salesEndDate) return 'ok';
    const endDate = new Date(salesEndDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'warning';
    return 'ok';
  };

  const getStockStatus = (currentStock: number) => {
    if (currentStock === 0) return 'out';
    if (currentStock < 10) return 'low';
    return 'ok';
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || product.categoryId === selectedCategory;
    const matchesLocation =
      selectedLocation === 'all' || product.storageLocationId === selectedLocation;

    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h1>物品一覧</h1>
        <Button onClick={() => onNavigate('product-register')} className="bg-[#2563EB] hover:bg-[#1d4ed8]">
          <Plus className="h-4 w-4 mr-2" />
          物品登録
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="商品名、SKUで検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="カテゴリ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="保管場所" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {storageLocations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Table - Desktop */}
      <div className="hidden md:block rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead className="w-24">画像</TableHead>
              <TableHead>商品名</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">在庫</TableHead>
              <TableHead>在庫状況</TableHead>
              <TableHead>期限</TableHead>
              <TableHead className="text-right">アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const expiryStatus = getExpiryStatus(product.ipInfo?.salesEndDate);
              const stockStatus = getStockStatus(product.currentStock);

              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.categoryName}</p>
                    </div>
                  </TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell className="text-right">
                    <span className={stockStatus === 'out' || stockStatus === 'low' ? 'text-[#EF4444]' : ''}>
                      {product.currentStock}
                    </span>
                  </TableCell>
                  <TableCell>
                    {stockStatus === 'out' && (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        在庫切れ
                      </Badge>
                    )}
                    {stockStatus === 'low' && (
                      <Badge className="gap-1 bg-[#F59E0B] hover:bg-[#D97706]">
                        <AlertTriangle className="h-3 w-3" />
                        低在庫
                      </Badge>
                    )}
                    {stockStatus === 'ok' && (
                      <Badge variant="secondary" className="gap-1 bg-[#10B981] text-white hover:bg-[#059669]">
                        <CheckCircle2 className="h-3 w-3" />
                        正常
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {expiryStatus === 'expired' && (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        期限切れ
                      </Badge>
                    )}
                    {expiryStatus === 'warning' && (
                      <Badge className="gap-1 bg-[#F59E0B] hover:bg-[#D97706]">
                        <AlertTriangle className="h-3 w-3" />
                        注意
                      </Badge>
                    )}
                    {expiryStatus === 'ok' && (
                      <Badge variant="secondary" className="gap-1 bg-[#10B981] text-white hover:bg-[#059669]">
                        <CheckCircle2 className="h-3 w-3" />
                        OK
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigate('product-detail', product.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigate('product-edit', product.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Product Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredProducts.map((product) => {
          const expiryStatus = getExpiryStatus(product.ipInfo?.salesEndDate);
          const stockStatus = getStockStatus(product.currentStock);

          return (
            <div key={product.id} className="bg-white rounded-lg border p-4 space-y-3">
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  <p className="text-sm text-muted-foreground">在庫: {product.currentStock}個</p>
                  <p className="text-sm text-muted-foreground">{product.storageLocationName}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {stockStatus === 'out' && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    在庫切れ
                  </Badge>
                )}
                {stockStatus === 'low' && (
                  <Badge className="gap-1 bg-[#F59E0B] hover:bg-[#D97706]">
                    <AlertTriangle className="h-3 w-3" />
                    低在庫
                  </Badge>
                )}
                {expiryStatus === 'expired' && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    期限切れ
                  </Badge>
                )}
                {expiryStatus === 'warning' && (
                  <Badge className="gap-1 bg-[#F59E0B] hover:bg-[#D97706]">
                    <AlertTriangle className="h-3 w-3" />
                    期限注意
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onNavigate('product-detail', product.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  詳細
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onNavigate('product-edit', product.id)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  編集
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length}件の商品
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            前へ
          </Button>
          <Button variant="outline" size="sm" className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            3
          </Button>
          <Button variant="outline" size="sm">
            次へ
          </Button>
        </div>
      </div>
    </div>
  );
}

function Package({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}
