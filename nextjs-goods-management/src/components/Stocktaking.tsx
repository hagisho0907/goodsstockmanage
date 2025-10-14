'use client';

import { useState } from 'react';
import { stocktakings, products } from '../lib/mockData';
import type { Stocktaking, StocktakingItem, Product } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  ClipboardList, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Edit,
  Eye
} from 'lucide-react';

interface StocktakingProps {
  onNavigate: (page: string, id?: string) => void;
}

export function Stocktaking({ onNavigate }: StocktakingProps) {
  const [stocktakingList] = useState<Stocktaking[]>(stocktakings);
  const [selectedStocktaking, setSelectedStocktaking] = useState<Stocktaking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newStocktaking, setNewStocktaking] = useState({
    title: '',
    description: '',
  });

  const filteredStocktakings = stocktakingList.filter(st =>
    st.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    st.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Stocktaking['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Stocktaking['status']) => {
    switch (status) {
      case 'draft': return '下書き';
      case 'in_progress': return '実施中';
      case 'completed': return '完了';
      case 'cancelled': return '中止';
      default: return '不明';
    }
  };

  const getItemStatusColor = (status: StocktakingItem['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'checked': return 'bg-green-100 text-green-800';
      case 'discrepancy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemStatusText = (status: StocktakingItem['status']) => {
    switch (status) {
      case 'pending': return '未確認';
      case 'checked': return '確認済み';
      case 'discrepancy': return '差異あり';
      default: return '不明';
    }
  };

  const handleCreateStocktaking = () => {
    if (!newStocktaking.title.trim()) {
      toast.error('棚卸しタイトルを入力してください');
      return;
    }

    const productItems: StocktakingItem[] = products.map(product => ({
      id: `${Date.now()}-${product.id}`,
      stocktakingId: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      theoreticalStock: {
        new: product.stockBreakdown.new,
        used: product.stockBreakdown.used,
        damaged: product.stockBreakdown.damaged,
        total: product.currentStock,
      },
      status: 'pending',
    }));

    const newStocktakingData: Stocktaking = {
      id: Date.now().toString(),
      title: newStocktaking.title,
      description: newStocktaking.description,
      status: 'draft',
      startDate: new Date().toISOString(),
      createdBy: 'current_user',
      createdByName: '現在のユーザー',
      createdAt: new Date().toISOString(),
      items: productItems,
    };

    setSelectedStocktaking(newStocktakingData);
    setShowCreateDialog(false);
    setNewStocktaking({ title: '', description: '' });
    toast.success('棚卸しを作成しました');
  };

  const handleUpdateItemStock = (itemId: string, field: 'new' | 'used' | 'damaged', value: number) => {
    if (!selectedStocktaking) return;

    const updatedItems = selectedStocktaking.items.map(item => {
      if (item.id === itemId) {
        const newActualStock = {
          new: 0,
          used: 0,
          damaged: 0,
          total: 0,
          ...item.actualStock,
          [field]: value,
        };
        
        const total = (newActualStock.new || 0) + (newActualStock.used || 0) + (newActualStock.damaged || 0);
        newActualStock.total = total;

        const difference = {
          new: (newActualStock.new || 0) - item.theoreticalStock.new,
          used: (newActualStock.used || 0) - item.theoreticalStock.used,
          damaged: (newActualStock.damaged || 0) - item.theoreticalStock.damaged,
          total: total - item.theoreticalStock.total,
        };

        const hasDiscrepancy = difference.new !== 0 || difference.used !== 0 || difference.damaged !== 0;
        const status: StocktakingItem['status'] = hasDiscrepancy ? 'discrepancy' : 'checked';

        return {
          ...item,
          actualStock: newActualStock,
          difference,
          status,
          checkedBy: 'current_user',
          checkedByName: '現在のユーザー',
          checkedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    setSelectedStocktaking({
      ...selectedStocktaking,
      items: updatedItems,
    });
  };

  if (selectedStocktaking) {
    const pendingCount = selectedStocktaking.items.filter(item => item.status === 'pending').length;
    const checkedCount = selectedStocktaking.items.filter(item => item.status === 'checked').length;
    const discrepancyCount = selectedStocktaking.items.filter(item => item.status === 'discrepancy').length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{selectedStocktaking.title}</h1>
            <p className="text-muted-foreground mt-1">{selectedStocktaking.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(selectedStocktaking.status)}>
              {getStatusText(selectedStocktaking.status)}
            </Badge>
            <Button variant="outline" onClick={() => setSelectedStocktaking(null)}>
              戻る
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">総商品数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedStocktaking.items.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <Clock className="w-4 h-4 text-yellow-500" />
                未確認
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                確認済み
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{checkedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                差異あり
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{discrepancyCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>商品リスト</CardTitle>
            <CardDescription>
              各商品の理論在庫と実在庫を確認・入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品名</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">理論在庫</TableHead>
                    <TableHead className="text-center">実在庫</TableHead>
                    <TableHead className="text-center">差異</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>備考</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedStocktaking.items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.productSku}</TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="text-sm">正常: {item.theoreticalStock.new}</div>
                          <div className="text-sm">中古: {item.theoreticalStock.used}</div>
                          <div className="text-sm">破損: {item.theoreticalStock.damaged}</div>
                          <div className="font-medium">計: {item.theoreticalStock.total}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <Input
                            type="number"
                            min="0"
                            className="w-16 h-8 text-center"
                            value={item.actualStock?.new ?? ''}
                            onChange={(e) => handleUpdateItemStock(item.id, 'new', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                          <Input
                            type="number"
                            min="0"
                            className="w-16 h-8 text-center"
                            value={item.actualStock?.used ?? ''}
                            onChange={(e) => handleUpdateItemStock(item.id, 'used', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                          <Input
                            type="number"
                            min="0"
                            className="w-16 h-8 text-center"
                            value={item.actualStock?.damaged ?? ''}
                            onChange={(e) => handleUpdateItemStock(item.id, 'damaged', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                          <div className="font-medium text-sm">
                            計: {item.actualStock?.total ?? 0}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.difference && (
                          <div className="space-y-1">
                            <div className={`text-sm ${item.difference.new !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {item.difference.new > 0 ? `+${item.difference.new}` : item.difference.new}
                            </div>
                            <div className={`text-sm ${item.difference.used !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {item.difference.used > 0 ? `+${item.difference.used}` : item.difference.used}
                            </div>
                            <div className={`text-sm ${item.difference.damaged !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {item.difference.damaged > 0 ? `+${item.difference.damaged}` : item.difference.damaged}
                            </div>
                            <div className={`font-medium text-sm ${item.difference.total !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {item.difference.total > 0 ? `+${item.difference.total}` : item.difference.total}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getItemStatusColor(item.status)}>
                          {getItemStatusText(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="備考を入力"
                          value={item.notes ?? ''}
                          onChange={(e) => {
                            const updatedItems = selectedStocktaking.items.map(i =>
                              i.id === item.id ? { ...i, notes: e.target.value } : i
                            );
                            setSelectedStocktaking({ ...selectedStocktaking, items: updatedItems });
                          }}
                          className="w-32"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-8 h-8" />
            棚卸し
          </h1>
          <p className="text-muted-foreground mt-1">理論在庫と実在庫の照合を行います</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新規棚卸し
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規棚卸し作成</DialogTitle>
              <DialogDescription>
                新しい棚卸し作業を作成します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">タイトル</label>
                <Input
                  value={newStocktaking.title}
                  onChange={(e) => setNewStocktaking(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="例: 2025年10月 月次棚卸し"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">説明</label>
                <Textarea
                  value={newStocktaking.description}
                  onChange={(e) => setNewStocktaking(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="棚卸しの目的や注意事項を入力"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleCreateStocktaking}>
                  作成
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>棚卸し一覧</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="棚卸しを検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStocktakings.map(stocktaking => {
              const totalItems = stocktaking.items.length;
              const checkedItems = stocktaking.items.filter(item => item.status !== 'pending').length;
              const discrepancyItems = stocktaking.items.filter(item => item.status === 'discrepancy').length;

              return (
                <div key={stocktaking.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{stocktaking.title}</h3>
                        <Badge className={getStatusColor(stocktaking.status)}>
                          {getStatusText(stocktaking.status)}
                        </Badge>
                      </div>
                      {stocktaking.description && (
                        <p className="text-sm text-muted-foreground">{stocktaking.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>作成者: {stocktaking.createdByName}</span>
                        <span>作成日: {new Date(stocktaking.createdAt).toLocaleDateString('ja-JP')}</span>
                        {stocktaking.endDate && (
                          <span>完了日: {new Date(stocktaking.endDate).toLocaleDateString('ja-JP')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <span>総商品数: {totalItems}</span>
                        </div>
                        {totalItems > 0 && (
                          <>
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span>確認済み: {checkedItems}/{totalItems}</span>
                            </div>
                            {discrepancyItems > 0 && (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <span>差異: {discrepancyItems}件</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStocktaking(stocktaking)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        詳細
                      </Button>
                      {stocktaking.status === 'draft' || stocktaking.status === 'in_progress' ? (
                        <Button
                          size="sm"
                          onClick={() => setSelectedStocktaking(stocktaking)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          編集
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredStocktakings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? '検索条件に一致する棚卸しが見つかりません' : '棚卸しがまだ作成されていません'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}