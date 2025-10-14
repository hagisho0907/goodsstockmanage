'use client';

import { useState } from 'react';
import { categories, storageLocations, licensors, licensees, manufacturers } from '../lib/mockData';
import { Category, StorageLocation, Licensor, Licensee, Manufacturer } from '../types';
import { AuthGuard } from './AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { 
  Database, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Package,
  MapPin,
  Building,
  Building2,
  Factory
} from 'lucide-react';

interface MasterDataManagementProps {
  onNavigate: (page: string, id?: string) => void;
}

export function MasterDataManagement({ onNavigate }: MasterDataManagementProps) {
  const [categoryList, setCategoryList] = useState<Category[]>(categories);
  const [storageLocationList, setStorageLocationList] = useState<StorageLocation[]>(storageLocations);
  const [licensorList, setLicensorList] = useState<Licensor[]>(licensors);
  const [licenseeList, setLicenseeList] = useState<Licensee[]>(licensees);
  const [manufacturerList, setManufacturerList] = useState<Manufacturer[]>(manufacturers);

  const [searchTerms, setSearchTerms] = useState({
    category: '',
    storage: '',
    licensor: '',
    licensee: '',
    manufacturer: '',
  });

  const [showDialogs, setShowDialogs] = useState({
    category: false,
    storage: false,
    licensor: false,
    licensee: false,
    manufacturer: false,
  });

  const [newItems, setNewItems] = useState({
    category: { name: '' },
    storage: { name: '', code: '' },
    licensor: { name: '', contactInfo: '' },
    licensee: { name: '', contactInfo: '' },
    manufacturer: { name: '', contactInfo: '' },
  });

  const [editItems, setEditItems] = useState<{
    category: Category | null;
    storage: StorageLocation | null;
    licensor: Licensor | null;
    licensee: Licensee | null;
    manufacturer: Manufacturer | null;
  }>({
    category: null,
    storage: null,
    licensor: null,
    licensee: null,
    manufacturer: null,
  });

  const [showEditDialogs, setShowEditDialogs] = useState({
    category: false,
    storage: false,
    licensor: false,
    licensee: false,
    manufacturer: false,
  });

  // フィルタリング関数
  const filteredCategories = categoryList.filter(item =>
    item.name.toLowerCase().includes(searchTerms.category.toLowerCase())
  );

  const filteredStorageLocations = storageLocationList.filter(item =>
    item.name.toLowerCase().includes(searchTerms.storage.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerms.storage.toLowerCase())
  );

  const filteredLicensors = licensorList.filter(item =>
    item.name.toLowerCase().includes(searchTerms.licensor.toLowerCase()) ||
    item.contactInfo?.toLowerCase().includes(searchTerms.licensor.toLowerCase())
  );

  const filteredLicensees = licenseeList.filter(item =>
    item.name.toLowerCase().includes(searchTerms.licensee.toLowerCase()) ||
    item.contactInfo?.toLowerCase().includes(searchTerms.licensee.toLowerCase())
  );

  const filteredManufacturers = manufacturerList.filter(item =>
    item.name.toLowerCase().includes(searchTerms.manufacturer.toLowerCase()) ||
    item.contactInfo?.toLowerCase().includes(searchTerms.manufacturer.toLowerCase())
  );

  // 作成処理
  const handleCreateCategory = () => {
    if (!newItems.category.name.trim()) {
      toast.error('カテゴリ名を入力してください');
      return;
    }

    if (categoryList.some(c => c.name === newItems.category.name)) {
      toast.error('このカテゴリ名は既に存在します');
      return;
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newItems.category.name,
    };

    setCategoryList([...categoryList, newCategory]);
    setShowDialogs(prev => ({ ...prev, category: false }));
    setNewItems(prev => ({ ...prev, category: { name: '' } }));
    toast.success('カテゴリを作成しました');
  };

  const handleCreateStorageLocation = () => {
    if (!newItems.storage.name.trim() || !newItems.storage.code.trim()) {
      toast.error('保管場所名とコードを入力してください');
      return;
    }

    if (storageLocationList.some(s => s.name === newItems.storage.name || s.code === newItems.storage.code)) {
      toast.error('この保管場所名またはコードは既に存在します');
      return;
    }

    const newStorage: StorageLocation = {
      id: Date.now().toString(),
      name: newItems.storage.name,
      code: newItems.storage.code,
    };

    setStorageLocationList([...storageLocationList, newStorage]);
    setShowDialogs(prev => ({ ...prev, storage: false }));
    setNewItems(prev => ({ ...prev, storage: { name: '', code: '' } }));
    toast.success('保管場所を作成しました');
  };

  const handleCreateLicensor = () => {
    if (!newItems.licensor.name.trim()) {
      toast.error('版元名を入力してください');
      return;
    }

    if (licensorList.some(l => l.name === newItems.licensor.name)) {
      toast.error('この版元名は既に存在します');
      return;
    }

    const newLicensor: Licensor = {
      id: Date.now().toString(),
      name: newItems.licensor.name,
      contactInfo: newItems.licensor.contactInfo || undefined,
    };

    setLicensorList([...licensorList, newLicensor]);
    setShowDialogs(prev => ({ ...prev, licensor: false }));
    setNewItems(prev => ({ ...prev, licensor: { name: '', contactInfo: '' } }));
    toast.success('版元を作成しました');
  };

  const handleCreateLicensee = () => {
    if (!newItems.licensee.name.trim()) {
      toast.error('ライセンシー名を入力してください');
      return;
    }

    if (licenseeList.some(l => l.name === newItems.licensee.name)) {
      toast.error('このライセンシー名は既に存在します');
      return;
    }

    const newLicensee: Licensee = {
      id: Date.now().toString(),
      name: newItems.licensee.name,
      contactInfo: newItems.licensee.contactInfo || undefined,
    };

    setLicenseeList([...licenseeList, newLicensee]);
    setShowDialogs(prev => ({ ...prev, licensee: false }));
    setNewItems(prev => ({ ...prev, licensee: { name: '', contactInfo: '' } }));
    toast.success('ライセンシーを作成しました');
  };

  const handleCreateManufacturer = () => {
    if (!newItems.manufacturer.name.trim()) {
      toast.error('製造会社名を入力してください');
      return;
    }

    if (manufacturerList.some(m => m.name === newItems.manufacturer.name)) {
      toast.error('この製造会社名は既に存在します');
      return;
    }

    const newManufacturer: Manufacturer = {
      id: Date.now().toString(),
      name: newItems.manufacturer.name,
      contactInfo: newItems.manufacturer.contactInfo || undefined,
    };

    setManufacturerList([...manufacturerList, newManufacturer]);
    setShowDialogs(prev => ({ ...prev, manufacturer: false }));
    setNewItems(prev => ({ ...prev, manufacturer: { name: '', contactInfo: '' } }));
    toast.success('製造会社を作成しました');
  };

  // 編集処理
  const handleEditCategory = () => {
    if (!editItems.category || !editItems.category.name.trim()) {
      toast.error('カテゴリ名を入力してください');
      return;
    }

    const existingCategory = categoryList.find(c => c.name === editItems.category!.name && c.id !== editItems.category!.id);
    if (existingCategory) {
      toast.error('このカテゴリ名は既に存在します');
      return;
    }

    setCategoryList(categoryList.map(c => c.id === editItems.category!.id ? editItems.category! : c));
    setShowEditDialogs(prev => ({ ...prev, category: false }));
    setEditItems(prev => ({ ...prev, category: null }));
    toast.success('カテゴリを更新しました');
  };

  const handleEditStorageLocation = () => {
    if (!editItems.storage || !editItems.storage.name.trim() || !editItems.storage.code.trim()) {
      toast.error('保管場所名とコードを入力してください');
      return;
    }

    const existingStorage = storageLocationList.find(s => 
      (s.name === editItems.storage!.name || s.code === editItems.storage!.code) && 
      s.id !== editItems.storage!.id
    );
    if (existingStorage) {
      toast.error('この保管場所名またはコードは既に存在します');
      return;
    }

    setStorageLocationList(storageLocationList.map(s => s.id === editItems.storage!.id ? editItems.storage! : s));
    setShowEditDialogs(prev => ({ ...prev, storage: false }));
    setEditItems(prev => ({ ...prev, storage: null }));
    toast.success('保管場所を更新しました');
  };

  const handleEditLicensor = () => {
    if (!editItems.licensor || !editItems.licensor.name.trim()) {
      toast.error('版元名を入力してください');
      return;
    }

    const existingLicensor = licensorList.find(l => l.name === editItems.licensor!.name && l.id !== editItems.licensor!.id);
    if (existingLicensor) {
      toast.error('この版元名は既に存在します');
      return;
    }

    setLicensorList(licensorList.map(l => l.id === editItems.licensor!.id ? editItems.licensor! : l));
    setShowEditDialogs(prev => ({ ...prev, licensor: false }));
    setEditItems(prev => ({ ...prev, licensor: null }));
    toast.success('版元を更新しました');
  };

  const handleEditLicensee = () => {
    if (!editItems.licensee || !editItems.licensee.name.trim()) {
      toast.error('ライセンシー名を入力してください');
      return;
    }

    const existingLicensee = licenseeList.find(l => l.name === editItems.licensee!.name && l.id !== editItems.licensee!.id);
    if (existingLicensee) {
      toast.error('このライセンシー名は既に存在します');
      return;
    }

    setLicenseeList(licenseeList.map(l => l.id === editItems.licensee!.id ? editItems.licensee! : l));
    setShowEditDialogs(prev => ({ ...prev, licensee: false }));
    setEditItems(prev => ({ ...prev, licensee: null }));
    toast.success('ライセンシーを更新しました');
  };

  const handleEditManufacturer = () => {
    if (!editItems.manufacturer || !editItems.manufacturer.name.trim()) {
      toast.error('製造会社名を入力してください');
      return;
    }

    const existingManufacturer = manufacturerList.find(m => m.name === editItems.manufacturer!.name && m.id !== editItems.manufacturer!.id);
    if (existingManufacturer) {
      toast.error('この製造会社名は既に存在します');
      return;
    }

    setManufacturerList(manufacturerList.map(m => m.id === editItems.manufacturer!.id ? editItems.manufacturer! : m));
    setShowEditDialogs(prev => ({ ...prev, manufacturer: false }));
    setEditItems(prev => ({ ...prev, manufacturer: null }));
    toast.success('製造会社を更新しました');
  };

  // 削除処理
  const handleDeleteCategory = (id: string) => {
    setCategoryList(categoryList.filter(c => c.id !== id));
    toast.success('カテゴリを削除しました');
  };

  const handleDeleteStorageLocation = (id: string) => {
    setStorageLocationList(storageLocationList.filter(s => s.id !== id));
    toast.success('保管場所を削除しました');
  };

  const handleDeleteLicensor = (id: string) => {
    setLicensorList(licensorList.filter(l => l.id !== id));
    toast.success('版元を削除しました');
  };

  const handleDeleteLicensee = (id: string) => {
    setLicenseeList(licenseeList.filter(l => l.id !== id));
    toast.success('ライセンシーを削除しました');
  };

  const handleDeleteManufacturer = (id: string) => {
    setManufacturerList(manufacturerList.filter(m => m.id !== id));
    toast.success('製造会社を削除しました');
  };

  return (
    <AuthGuard requiredRole="manager">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-8 h-8" />
            マスタデータ管理
          </h1>
          <p className="text-muted-foreground mt-1">カテゴリ、保管場所、企業情報などの基本データを管理します</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Package className="w-4 h-4" />
              カテゴリ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryList.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              保管場所
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageLocationList.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Building className="w-4 h-4" />
              版元
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licensorList.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              ライセンシー
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenseeList.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Factory className="w-4 h-4" />
              製造会社
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{manufacturerList.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="categories">カテゴリ</TabsTrigger>
          <TabsTrigger value="storage">保管場所</TabsTrigger>
          <TabsTrigger value="licensors">版元</TabsTrigger>
          <TabsTrigger value="licensees">ライセンシー</TabsTrigger>
          <TabsTrigger value="manufacturers">製造会社</TabsTrigger>
        </TabsList>

        {/* カテゴリタブ */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>カテゴリ管理</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="カテゴリを検索"
                      value={searchTerms.category}
                      onChange={(e) => setSearchTerms(prev => ({ ...prev, category: e.target.value }))}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Dialog open={showDialogs.category} onOpenChange={(open) => setShowDialogs(prev => ({ ...prev, category: open }))}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        追加
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>新しいカテゴリを追加</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">カテゴリ名 *</label>
                          <Input
                            value={newItems.category.name}
                            onChange={(e) => setNewItems(prev => ({ ...prev, category: { name: e.target.value } }))}
                            placeholder="例: フィギュア"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowDialogs(prev => ({ ...prev, category: false }))}>
                            キャンセル
                          </Button>
                          <Button onClick={handleCreateCategory}>
                            作成
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>カテゴリ名</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map(category => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Dialog open={showEditDialogs.category && editItems.category?.id === category.id} onOpenChange={(open) => {
                            setShowEditDialogs(prev => ({ ...prev, category: open }));
                            if (!open) setEditItems(prev => ({ ...prev, category: null }));
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditItems(prev => ({ ...prev, category }));
                                  setShowEditDialogs(prev => ({ ...prev, category: true }));
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>カテゴリを編集</DialogTitle>
                              </DialogHeader>
                              {editItems.category && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">カテゴリ名 *</label>
                                    <Input
                                      value={editItems.category.name}
                                      onChange={(e) => setEditItems(prev => ({ 
                                        ...prev, 
                                        category: prev.category ? { ...prev.category, name: e.target.value } : null 
                                      }))}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowEditDialogs(prev => ({ ...prev, category: false }))}>
                                      キャンセル
                                    </Button>
                                    <Button onClick={handleEditCategory}>
                                      更新
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>カテゴリを削除しますか？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  この操作は取り消せません。カテゴリ「{category.name}」を完全に削除します。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeleteCategory(category.id)}
                                >
                                  削除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredCategories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerms.category ? '検索条件に一致するカテゴリが見つかりません' : 'カテゴリがまだ作成されていません'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 保管場所タブ */}
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>保管場所管理</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="保管場所を検索"
                      value={searchTerms.storage}
                      onChange={(e) => setSearchTerms(prev => ({ ...prev, storage: e.target.value }))}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Dialog open={showDialogs.storage} onOpenChange={(open) => setShowDialogs(prev => ({ ...prev, storage: open }))}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        追加
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>新しい保管場所を追加</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">保管場所名 *</label>
                          <Input
                            value={newItems.storage.name}
                            onChange={(e) => setNewItems(prev => ({ ...prev, storage: { ...prev.storage, name: e.target.value } }))}
                            placeholder="例: 倉庫A-1"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">コード *</label>
                          <Input
                            value={newItems.storage.code}
                            onChange={(e) => setNewItems(prev => ({ ...prev, storage: { ...prev.storage, code: e.target.value } }))}
                            placeholder="例: WH-A-1"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowDialogs(prev => ({ ...prev, storage: false }))}>
                            キャンセル
                          </Button>
                          <Button onClick={handleCreateStorageLocation}>
                            作成
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>保管場所名</TableHead>
                    <TableHead>コード</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStorageLocations.map(storage => (
                    <TableRow key={storage.id}>
                      <TableCell className="font-medium">{storage.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{storage.code}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Dialog open={showEditDialogs.storage && editItems.storage?.id === storage.id} onOpenChange={(open) => {
                            setShowEditDialogs(prev => ({ ...prev, storage: open }));
                            if (!open) setEditItems(prev => ({ ...prev, storage: null }));
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditItems(prev => ({ ...prev, storage }));
                                  setShowEditDialogs(prev => ({ ...prev, storage: true }));
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>保管場所を編集</DialogTitle>
                              </DialogHeader>
                              {editItems.storage && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">保管場所名 *</label>
                                    <Input
                                      value={editItems.storage.name}
                                      onChange={(e) => setEditItems(prev => ({ 
                                        ...prev, 
                                        storage: prev.storage ? { ...prev.storage, name: e.target.value } : null 
                                      }))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">コード *</label>
                                    <Input
                                      value={editItems.storage.code}
                                      onChange={(e) => setEditItems(prev => ({ 
                                        ...prev, 
                                        storage: prev.storage ? { ...prev.storage, code: e.target.value } : null 
                                      }))}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowEditDialogs(prev => ({ ...prev, storage: false }))}>
                                      キャンセル
                                    </Button>
                                    <Button onClick={handleEditStorageLocation}>
                                      更新
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>保管場所を削除しますか？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  この操作は取り消せません。保管場所「{storage.name}」を完全に削除します。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeleteStorageLocation(storage.id)}
                                >
                                  削除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredStorageLocations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerms.storage ? '検索条件に一致する保管場所が見つかりません' : '保管場所がまだ作成されていません'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 版元タブ */}
        <TabsContent value="licensors">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>版元管理</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="版元を検索"
                      value={searchTerms.licensor}
                      onChange={(e) => setSearchTerms(prev => ({ ...prev, licensor: e.target.value }))}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Dialog open={showDialogs.licensor} onOpenChange={(open) => setShowDialogs(prev => ({ ...prev, licensor: open }))}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        追加
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>新しい版元を追加</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">版元名 *</label>
                          <Input
                            value={newItems.licensor.name}
                            onChange={(e) => setNewItems(prev => ({ ...prev, licensor: { ...prev.licensor, name: e.target.value } }))}
                            placeholder="例: 株式会社アニメ制作"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">連絡先</label>
                          <Input
                            value={newItems.licensor.contactInfo}
                            onChange={(e) => setNewItems(prev => ({ ...prev, licensor: { ...prev.licensor, contactInfo: e.target.value } }))}
                            placeholder="例: contact@anime.com"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowDialogs(prev => ({ ...prev, licensor: false }))}>
                            キャンセル
                          </Button>
                          <Button onClick={handleCreateLicensor}>
                            作成
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>版元名</TableHead>
                    <TableHead>連絡先</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLicensors.map(licensor => (
                    <TableRow key={licensor.id}>
                      <TableCell className="font-medium">{licensor.name}</TableCell>
                      <TableCell>{licensor.contactInfo || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Dialog open={showEditDialogs.licensor && editItems.licensor?.id === licensor.id} onOpenChange={(open) => {
                            setShowEditDialogs(prev => ({ ...prev, licensor: open }));
                            if (!open) setEditItems(prev => ({ ...prev, licensor: null }));
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditItems(prev => ({ ...prev, licensor }));
                                  setShowEditDialogs(prev => ({ ...prev, licensor: true }));
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>版元を編集</DialogTitle>
                              </DialogHeader>
                              {editItems.licensor && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">版元名 *</label>
                                    <Input
                                      value={editItems.licensor.name}
                                      onChange={(e) => setEditItems(prev => ({ 
                                        ...prev, 
                                        licensor: prev.licensor ? { ...prev.licensor, name: e.target.value } : null 
                                      }))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">連絡先</label>
                                    <Input
                                      value={editItems.licensor.contactInfo || ''}
                                      onChange={(e) => setEditItems(prev => ({ 
                                        ...prev, 
                                        licensor: prev.licensor ? { ...prev.licensor, contactInfo: e.target.value } : null 
                                      }))}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowEditDialogs(prev => ({ ...prev, licensor: false }))}>
                                      キャンセル
                                    </Button>
                                    <Button onClick={handleEditLicensor}>
                                      更新
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>版元を削除しますか？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  この操作は取り消せません。版元「{licensor.name}」を完全に削除します。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeleteLicensor(licensor.id)}
                                >
                                  削除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredLicensors.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerms.licensor ? '検索条件に一致する版元が見つかりません' : '版元がまだ作成されていません'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ライセンシータブ */}
        <TabsContent value="licensees">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>ライセンシー管理</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="ライセンシーを検索"
                      value={searchTerms.licensee}
                      onChange={(e) => setSearchTerms(prev => ({ ...prev, licensee: e.target.value }))}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Dialog open={showDialogs.licensee} onOpenChange={(open) => setShowDialogs(prev => ({ ...prev, licensee: open }))}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        追加
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>新しいライセンシーを追加</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">ライセンシー名 *</label>
                          <Input
                            value={newItems.licensee.name}
                            onChange={(e) => setNewItems(prev => ({ ...prev, licensee: { ...prev.licensee, name: e.target.value } }))}
                            placeholder="例: 株式会社グッズ企画"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">連絡先</label>
                          <Input
                            value={newItems.licensee.contactInfo}
                            onChange={(e) => setNewItems(prev => ({ ...prev, licensee: { ...prev.licensee, contactInfo: e.target.value } }))}
                            placeholder="例: goods@company.com"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowDialogs(prev => ({ ...prev, licensee: false }))}>
                            キャンセル
                          </Button>
                          <Button onClick={handleCreateLicensee}>
                            作成
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ライセンシー名</TableHead>
                    <TableHead>連絡先</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLicensees.map(licensee => (
                    <TableRow key={licensee.id}>
                      <TableCell className="font-medium">{licensee.name}</TableCell>
                      <TableCell>{licensee.contactInfo || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Dialog open={showEditDialogs.licensee && editItems.licensee?.id === licensee.id} onOpenChange={(open) => {
                            setShowEditDialogs(prev => ({ ...prev, licensee: open }));
                            if (!open) setEditItems(prev => ({ ...prev, licensee: null }));
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditItems(prev => ({ ...prev, licensee }));
                                  setShowEditDialogs(prev => ({ ...prev, licensee: true }));
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>ライセンシーを編集</DialogTitle>
                              </DialogHeader>
                              {editItems.licensee && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">ライセンシー名 *</label>
                                    <Input
                                      value={editItems.licensee.name}
                                      onChange={(e) => setEditItems(prev => ({ 
                                        ...prev, 
                                        licensee: prev.licensee ? { ...prev.licensee, name: e.target.value } : null 
                                      }))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">連絡先</label>
                                    <Input
                                      value={editItems.licensee.contactInfo || ''}
                                      onChange={(e) => setEditItems(prev => ({ 
                                        ...prev, 
                                        licensee: prev.licensee ? { ...prev.licensee, contactInfo: e.target.value } : null 
                                      }))}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowEditDialogs(prev => ({ ...prev, licensee: false }))}>
                                      キャンセル
                                    </Button>
                                    <Button onClick={handleEditLicensee}>
                                      更新
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>ライセンシーを削除しますか？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  この操作は取り消せません。ライセンシー「{licensee.name}」を完全に削除します。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeleteLicensee(licensee.id)}
                                >
                                  削除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredLicensees.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerms.licensee ? '検索条件に一致するライセンシーが見つかりません' : 'ライセンシーがまだ作成されていません'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 製造会社タブ */}
        <TabsContent value="manufacturers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>製造会社管理</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="製造会社を検索"
                      value={searchTerms.manufacturer}
                      onChange={(e) => setSearchTerms(prev => ({ ...prev, manufacturer: e.target.value }))}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Dialog open={showDialogs.manufacturer} onOpenChange={(open) => setShowDialogs(prev => ({ ...prev, manufacturer: open }))}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        追加
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>新しい製造会社を追加</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">製造会社名 *</label>
                          <Input
                            value={newItems.manufacturer.name}
                            onChange={(e) => setNewItems(prev => ({ ...prev, manufacturer: { ...prev.manufacturer, name: e.target.value } }))}
                            placeholder="例: 株式会社製造工場"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">連絡先</label>
                          <Input
                            value={newItems.manufacturer.contactInfo}
                            onChange={(e) => setNewItems(prev => ({ ...prev, manufacturer: { ...prev.manufacturer, contactInfo: e.target.value } }))}
                            placeholder="例: factory@company.com"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowDialogs(prev => ({ ...prev, manufacturer: false }))}>
                            キャンセル
                          </Button>
                          <Button onClick={handleCreateManufacturer}>
                            作成
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>製造会社名</TableHead>
                    <TableHead>連絡先</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredManufacturers.map(manufacturer => (
                    <TableRow key={manufacturer.id}>
                      <TableCell className="font-medium">{manufacturer.name}</TableCell>
                      <TableCell>{manufacturer.contactInfo || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Dialog open={showEditDialogs.manufacturer && editItems.manufacturer?.id === manufacturer.id} onOpenChange={(open) => {
                            setShowEditDialogs(prev => ({ ...prev, manufacturer: open }));
                            if (!open) setEditItems(prev => ({ ...prev, manufacturer: null }));
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditItems(prev => ({ ...prev, manufacturer }));
                                  setShowEditDialogs(prev => ({ ...prev, manufacturer: true }));
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>製造会社を編集</DialogTitle>
                              </DialogHeader>
                              {editItems.manufacturer && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">製造会社名 *</label>
                                    <Input
                                      value={editItems.manufacturer.name}
                                      onChange={(e) => setEditItems(prev => ({ 
                                        ...prev, 
                                        manufacturer: prev.manufacturer ? { ...prev.manufacturer, name: e.target.value } : null 
                                      }))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">連絡先</label>
                                    <Input
                                      value={editItems.manufacturer.contactInfo || ''}
                                      onChange={(e) => setEditItems(prev => ({ 
                                        ...prev, 
                                        manufacturer: prev.manufacturer ? { ...prev.manufacturer, contactInfo: e.target.value } : null 
                                      }))}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowEditDialogs(prev => ({ ...prev, manufacturer: false }))}>
                                      キャンセル
                                    </Button>
                                    <Button onClick={handleEditManufacturer}>
                                      更新
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>製造会社を削除しますか？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  この操作は取り消せません。製造会社「{manufacturer.name}」を完全に削除します。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeleteManufacturer(manufacturer.id)}
                                >
                                  削除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredManufacturers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerms.manufacturer ? '検索条件に一致する製造会社が見つかりません' : '製造会社がまだ作成されていません'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AuthGuard>
  );
}