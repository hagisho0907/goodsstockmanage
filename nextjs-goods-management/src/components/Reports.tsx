'use client';

import { useState } from 'react';
import { reports, categories, storageLocations, users } from '../lib/mockData';
import { Report } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { 
  FileText, 
  Download, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  FileImage,
  Users as UsersIcon,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface ReportsProps {
  onNavigate: (page: string, id?: string) => void;
}

export function Reports({ onNavigate }: ReportsProps) {
  const [reportList, setReportList] = useState<Report[]>(reports);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    type: 'stock_summary' as Report['type'],
    dateRange: {
      start: '',
      end: '',
    },
    categories: [] as string[],
    storageLocations: [] as string[],
    users: [] as string[],
  });

  const filteredReports = reportList.filter(report => {
    const matchesSearch = 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.generatedByName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getReportTypeDisplayName = (type: Report['type']) => {
    switch (type) {
      case 'stock_summary': return '在庫サマリー';
      case 'movement_history': return '入出庫履歴';
      case 'alert_history': return 'アラート履歴';
      case 'stocktaking_summary': return '棚卸しサマリー';
      case 'user_activity': return 'ユーザー活動';
      default: return type;
    }
  };

  const getReportTypeColor = (type: Report['type']) => {
    switch (type) {
      case 'stock_summary': return 'bg-blue-100 text-blue-800';
      case 'movement_history': return 'bg-green-100 text-green-800';
      case 'alert_history': return 'bg-red-100 text-red-800';
      case 'stocktaking_summary': return 'bg-purple-100 text-purple-800';
      case 'user_activity': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Report['status']) => {
    switch (status) {
      case 'generating': return '生成中';
      case 'completed': return '完了';
      case 'failed': return '失敗';
      default: return '不明';
    }
  };

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'generating': return <RefreshCw className="w-3 h-3 mr-1 animate-spin" />;
      case 'completed': return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'failed': return <XCircle className="w-3 h-3 mr-1" />;
      default: return <Clock className="w-3 h-3 mr-1" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileExtension = (url: string) => {
    return url.split('.').pop()?.toUpperCase() || '';
  };

  const getFileIcon = (url: string) => {
    const ext = getFileExtension(url);
    switch (ext) {
      case 'XLSX':
      case 'XLS':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'PDF':
        return <FileText className="w-4 h-4" />;
      case 'CSV':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileImage className="w-4 h-4" />;
    }
  };

  const handleCreateReport = () => {
    if (!newReport.name.trim()) {
      toast.error('レポート名を入力してください');
      return;
    }

    if (!newReport.dateRange.start || !newReport.dateRange.end) {
      toast.error('期間を指定してください');
      return;
    }

    const createdReport: Report = {
      id: Date.now().toString(),
      name: newReport.name,
      description: newReport.description,
      type: newReport.type,
      parameters: {
        dateRange: newReport.dateRange,
        categories: newReport.categories.length > 0 ? newReport.categories : undefined,
        storageLocations: newReport.storageLocations.length > 0 ? newReport.storageLocations : undefined,
        users: newReport.users.length > 0 ? newReport.users : undefined,
      },
      generatedBy: 'current_user',
      generatedByName: '現在のユーザー',
      generatedAt: new Date().toISOString(),
      status: 'generating',
    };

    setReportList([createdReport, ...reportList]);
    setShowCreateDialog(false);
    setNewReport({
      name: '',
      description: '',
      type: 'stock_summary',
      dateRange: { start: '', end: '' },
      categories: [],
      storageLocations: [],
      users: [],
    });
    toast.success('レポート生成を開始しました');

    // シミュレート：3秒後に完了状態に変更
    setTimeout(() => {
      setReportList(prev => prev.map(r => 
        r.id === createdReport.id 
          ? { 
              ...r, 
              status: 'completed' as const,
              downloadUrl: `/reports/${r.type}-${Date.now()}.xlsx`,
              fileSize: Math.floor(Math.random() * 500000) + 100000
            }
          : r
      ));
      toast.success('レポートが生成されました');
    }, 3000);
  };

  const handleDownload = (report: Report) => {
    if (report.status !== 'completed' || !report.downloadUrl) {
      toast.error('ダウンロードできません');
      return;
    }

    // 実際の実装では実際のダウンロード処理を行う
    toast.success(`${report.name} をダウンロードしました`);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setNewReport(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleStorageLocationToggle = (locationId: string) => {
    setNewReport(prev => ({
      ...prev,
      storageLocations: prev.storageLocations.includes(locationId)
        ? prev.storageLocations.filter(id => id !== locationId)
        : [...prev.storageLocations, locationId]
    }));
  };

  const handleUserToggle = (userId: string) => {
    setNewReport(prev => ({
      ...prev,
      users: prev.users.includes(userId)
        ? prev.users.filter(id => id !== userId)
        : [...prev.users, userId]
    }));
  };

  const reportTemplates = [
    {
      type: 'stock_summary' as const,
      name: '在庫サマリーレポート',
      description: '指定期間内の商品在庫状況をまとめたレポート',
      icon: <Package className="w-5 h-5" />,
    },
    {
      type: 'movement_history' as const,
      name: '入出庫履歴レポート',
      description: '指定期間内の入出庫履歴の詳細レポート',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      type: 'alert_history' as const,
      name: 'アラート履歴レポート',
      description: '指定期間内に発生したアラートの履歴レポート',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      type: 'stocktaking_summary' as const,
      name: '棚卸しサマリーレポート',
      description: '指定期間内の棚卸し結果のサマリーレポート',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      type: 'user_activity' as const,
      name: 'ユーザー活動レポート',
      description: '指定期間内のユーザー活動状況レポート',
      icon: <UsersIcon className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            レポート
          </h1>
          <p className="text-muted-foreground mt-1">各種レポートの生成・ダウンロードを行います</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新規レポート
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新規レポート生成</DialogTitle>
              <DialogDescription>
                レポートの種類と条件を指定してレポートを生成します
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="template" className="space-y-4">
              <TabsList>
                <TabsTrigger value="template">テンプレート選択</TabsTrigger>
                <TabsTrigger value="settings">詳細設定</TabsTrigger>
              </TabsList>

              <TabsContent value="template" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportTemplates.map(template => (
                    <Card 
                      key={template.type}
                      className={`cursor-pointer transition-colors ${
                        newReport.type === template.type 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setNewReport(prev => ({ ...prev, type: template.type }))}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          {template.icon}
                          {template.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">レポート名 *</label>
                    <Input
                      value={newReport.name}
                      onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="例: 2025年10月 在庫サマリーレポート"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">説明</label>
                    <Input
                      value={newReport.description}
                      onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="レポートの目的や内容を説明"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">開始日 *</label>
                      <Input
                        type="date"
                        value={newReport.dateRange.start}
                        onChange={(e) => setNewReport(prev => ({ 
                          ...prev, 
                          dateRange: { ...prev.dateRange, start: e.target.value } 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">終了日 *</label>
                      <Input
                        type="date"
                        value={newReport.dateRange.end}
                        onChange={(e) => setNewReport(prev => ({ 
                          ...prev, 
                          dateRange: { ...prev.dateRange, end: e.target.value } 
                        }))}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">フィルター条件（オプション）</h3>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">カテゴリ</label>
                      <div className="grid grid-cols-3 gap-2 border rounded-lg p-3">
                        {categories.map(category => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category.id}`}
                              checked={newReport.categories.includes(category.id)}
                              onCheckedChange={() => handleCategoryToggle(category.id)}
                            />
                            <label htmlFor={`category-${category.id}`} className="text-sm">
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">保管場所</label>
                      <div className="grid grid-cols-3 gap-2 border rounded-lg p-3">
                        {storageLocations.map(location => (
                          <div key={location.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`location-${location.id}`}
                              checked={newReport.storageLocations.includes(location.id)}
                              onCheckedChange={() => handleStorageLocationToggle(location.id)}
                            />
                            <label htmlFor={`location-${location.id}`} className="text-sm">
                              {location.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {newReport.type === 'user_activity' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">対象ユーザー</label>
                        <div className="grid grid-cols-2 gap-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
                          {users.map(user => (
                            <div key={user.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`user-${user.id}`}
                                checked={newReport.users.includes(user.id)}
                                onCheckedChange={() => handleUserToggle(user.id)}
                              />
                              <label htmlFor={`user-${user.id}`} className="text-sm">
                                {user.fullName}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreateReport}>
                レポート生成
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総レポート数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportList.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              完了
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reportList.filter(r => r.status === 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <RefreshCw className="w-4 h-4 text-yellow-500" />
              生成中
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {reportList.filter(r => r.status === 'generating').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-500" />
              失敗
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reportList.filter(r => r.status === 'failed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Calendar className="w-4 h-4 text-blue-500" />
              今日生成
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {reportList.filter(r => 
                new Date(r.generatedAt).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>レポート一覧</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="レポートを検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="種類で絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての種類</SelectItem>
                  <SelectItem value="stock_summary">在庫サマリー</SelectItem>
                  <SelectItem value="movement_history">入出庫履歴</SelectItem>
                  <SelectItem value="alert_history">アラート履歴</SelectItem>
                  <SelectItem value="stocktaking_summary">棚卸しサマリー</SelectItem>
                  <SelectItem value="user_activity">ユーザー活動</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状態で絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                  <SelectItem value="generating">生成中</SelectItem>
                  <SelectItem value="failed">失敗</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>レポート名</TableHead>
                <TableHead>種類</TableHead>
                <TableHead>期間</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>生成者</TableHead>
                <TableHead>生成日時</TableHead>
                <TableHead>ファイルサイズ</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map(report => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{report.name}</div>
                      {report.description && (
                        <div className="text-sm text-muted-foreground">{report.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getReportTypeColor(report.type)}>
                      {getReportTypeDisplayName(report.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {report.parameters?.dateRange && (
                      <div className="text-sm">
                        {new Date(report.parameters.dateRange.start).toLocaleDateString('ja-JP')}
                        <br />
                        ～ {new Date(report.parameters.dateRange.end).toLocaleDateString('ja-JP')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(report.status)}>
                      {getStatusIcon(report.status)}
                      {getStatusText(report.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.generatedByName}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(report.generatedAt).toLocaleDateString('ja-JP')}
                      <br />
                      {new Date(report.generatedAt).toLocaleTimeString('ja-JP', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.fileSize ? formatFileSize(report.fileSize) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {report.status === 'completed' && report.downloadUrl ? (
                      <Button
                        size="sm"
                        onClick={() => handleDownload(report)}
                        className="flex items-center gap-1"
                      >
                        {getFileIcon(report.downloadUrl)}
                        <Download className="w-3 h-3" />
                        {getFileExtension(report.downloadUrl)}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredReports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? '検索条件に一致するレポートが見つかりません'
                : 'レポートがまだ生成されていません'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}