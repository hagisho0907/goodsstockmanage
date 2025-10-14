'use client';

import { useState } from 'react';
import { users, userRoles, storageLocations } from '../lib/mockData';
import { User, UserRole } from '../types';
import { AuthGuard } from './AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  ShieldCheck, 
  Settings, 
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Unlock
} from 'lucide-react';

interface UserManagementProps {
  onNavigate: (page: string, id?: string) => void;
}

export function UserManagement({ onNavigate }: UserManagementProps) {
  const [userList, setUserList] = useState<User[]>(users);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'viewer' as User['role'],
    department: '',
    storageLocationAccess: [] as string[],
    isActive: true,
  });
  const [editUser, setEditUser] = useState<User | null>(null);

  const filteredUsers = userList.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleDisplayName = (role: User['role']) => {
    const roleData = userRoles.find(r => r.name === role);
    return roleData?.displayName || role;
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'inventory_manager': return 'bg-blue-100 text-blue-800';
      case 'warehouse_worker': return 'bg-green-100 text-green-800';
      case 'sales': return 'bg-yellow-100 text-yellow-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateUser = () => {
    if (!newUser.username.trim() || !newUser.email.trim() || !newUser.fullName.trim()) {
      toast.error('必須項目を入力してください');
      return;
    }

    if (userList.some(u => u.username === newUser.username)) {
      toast.error('このユーザー名は既に使用されています');
      return;
    }

    if (userList.some(u => u.email === newUser.email)) {
      toast.error('このメールアドレスは既に使用されています');
      return;
    }

    const createdUser: User = {
      id: Date.now().toString(),
      ...newUser,
      lastLoginAt: undefined,
      createdBy: 'current_user',
      createdByName: '現在のユーザー',
      createdAt: new Date().toISOString(),
    };

    setUserList([...userList, createdUser]);
    setShowCreateDialog(false);
    setNewUser({
      username: '',
      email: '',
      fullName: '',
      role: 'viewer',
      department: '',
      storageLocationAccess: [],
      isActive: true,
    });
    toast.success('ユーザーを作成しました');
  };

  const handleEditUser = () => {
    if (!editUser) return;

    if (!editUser.username.trim() || !editUser.email.trim() || !editUser.fullName.trim()) {
      toast.error('必須項目を入力してください');
      return;
    }

    const existingUser = userList.find(u => u.username === editUser.username && u.id !== editUser.id);
    if (existingUser) {
      toast.error('このユーザー名は既に使用されています');
      return;
    }

    const existingEmail = userList.find(u => u.email === editUser.email && u.id !== editUser.id);
    if (existingEmail) {
      toast.error('このメールアドレスは既に使用されています');
      return;
    }

    const updatedUser: User = {
      ...editUser,
      updatedBy: 'current_user',
      updatedByName: '現在のユーザー',
      updatedAt: new Date().toISOString(),
    };

    setUserList(userList.map(u => u.id === editUser.id ? updatedUser : u));
    setShowEditDialog(false);
    setEditUser(null);
    toast.success('ユーザー情報を更新しました');
  };

  const handleDeleteUser = (userId: string) => {
    setUserList(userList.filter(u => u.id !== userId));
    toast.success('ユーザーを削除しました');
  };

  const handleToggleUserStatus = (userId: string) => {
    const user = userList.find(u => u.id === userId);
    if (!user) return;

    const updatedUser: User = {
      ...user,
      isActive: !user.isActive,
      updatedBy: 'current_user',
      updatedByName: '現在のユーザー',
      updatedAt: new Date().toISOString(),
    };

    setUserList(userList.map(u => u.id === userId ? updatedUser : u));
    toast.success(`ユーザーを${updatedUser.isActive ? '有効' : '無効'}にしました`);
  };

  const handleStorageLocationToggle = (locationId: string, isEdit = false) => {
    const target = isEdit ? editUser : newUser;
    const setter = isEdit ? setEditUser : setNewUser;
    
    if (!target) return;

    const currentAccess = target.storageLocationAccess || [];
    const newAccess = currentAccess.includes(locationId)
      ? currentAccess.filter(id => id !== locationId)
      : [...currentAccess, locationId];

    if (isEdit && editUser) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setter({ ...editUser, storageLocationAccess: newAccess } as any);
    } else {
      setter(prev => ({ ...prev, storageLocationAccess: newAccess }));
    }
  };

  return (
    <AuthGuard requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            ユーザー管理
          </h1>
          <p className="text-muted-foreground mt-1">システムユーザーの作成・編集・権限管理を行います</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              新規ユーザー
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>新規ユーザー作成</DialogTitle>
              <DialogDescription>
                新しいユーザーアカウントを作成します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ユーザー名 *</label>
                  <Input
                    value={newUser.username}
                    onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="user123"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">メールアドレス *</label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@company.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">氏名 *</label>
                <Input
                  value={newUser.fullName}
                  onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="田中 太郎"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">権限ロール *</label>
                  <Select value={newUser.role} onValueChange={(value: User['role']) => setNewUser(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map(role => (
                        <SelectItem key={role.id} value={role.name}>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>{role.displayName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">部署</label>
                  <Input
                    value={newUser.department}
                    onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="在庫管理部"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">アクセス可能な保管場所</label>
                <div className="grid grid-cols-2 gap-2 border rounded-lg p-3">
                  {storageLocations.map(location => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`new-location-${location.id}`}
                        checked={newUser.storageLocationAccess.includes(location.id)}
                        onCheckedChange={() => handleStorageLocationToggle(location.id)}
                      />
                      <label htmlFor={`new-location-${location.id}`} className="text-sm">
                        {location.name} ({location.code})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newUser.isActive}
                  onCheckedChange={(checked) => setNewUser(prev => ({ ...prev, isActive: checked }))}
                />
                <label className="text-sm font-medium">アカウントを有効にする</label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleCreateUser}>
                  作成
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userList.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              アクティブ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {userList.filter(u => u.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-500" />
              非アクティブ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {userList.filter(u => !u.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              管理者
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {userList.filter(u => u.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ユーザー一覧</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ユーザーを検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="権限で絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての権限</SelectItem>
                  {userRoles.map(role => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状態で絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="active">アクティブ</SelectItem>
                  <SelectItem value="inactive">非アクティブ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ユーザー情報</TableHead>
                  <TableHead>権限</TableHead>
                  <TableHead>部署</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>最終ログイン</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-sm text-muted-foreground">{user.username}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            アクティブ
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            非アクティブ
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt ? (
                        <div className="text-sm">
                          {new Date(user.lastLoginAt).toLocaleDateString('ja-JP')}
                          <br />
                          {new Date(user.lastLoginAt).toLocaleTimeString('ja-JP', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">未ログイン</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleUserStatus(user.id)}
                          title={user.isActive ? 'ユーザーを無効化' : 'ユーザーを有効化'}
                        >
                          {user.isActive ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </Button>
                        <Dialog open={showEditDialog && editUser?.id === user.id} onOpenChange={(open) => {
                          setShowEditDialog(open);
                          if (!open) setEditUser(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditUser(user);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>ユーザー編集</DialogTitle>
                              <DialogDescription>
                                ユーザー情報を編集します
                              </DialogDescription>
                            </DialogHeader>
                            {editUser && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">ユーザー名 *</label>
                                    <Input
                                      value={editUser.username}
                                      onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">メールアドレス *</label>
                                    <Input
                                      type="email"
                                      value={editUser.email}
                                      onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">氏名 *</label>
                                  <Input
                                    value={editUser.fullName}
                                    onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">権限ロール *</label>
                                    <Select value={editUser.role} onValueChange={(value: User['role']) => setEditUser({ ...editUser, role: value })}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {userRoles.map(role => (
                                          <SelectItem key={role.id} value={role.name}>
                                            <div className="flex items-center gap-2">
                                              <Shield className="w-4 h-4" />
                                              <span>{role.displayName}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">部署</label>
                                    <Input
                                      value={editUser.department || ''}
                                      onChange={(e) => setEditUser({ ...editUser, department: e.target.value })}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">アクセス可能な保管場所</label>
                                  <div className="grid grid-cols-2 gap-2 border rounded-lg p-3">
                                    {storageLocations.map(location => (
                                      <div key={location.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`edit-location-${location.id}`}
                                          checked={editUser.storageLocationAccess.includes(location.id)}
                                          onCheckedChange={() => handleStorageLocationToggle(location.id, true)}
                                        />
                                        <label htmlFor={`edit-location-${location.id}`} className="text-sm">
                                          {location.name} ({location.code})
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={editUser.isActive}
                                    onCheckedChange={(checked) => setEditUser({ ...editUser, isActive: checked })}
                                  />
                                  <label className="text-sm font-medium">アカウントを有効にする</label>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                    キャンセル
                                  </Button>
                                  <Button onClick={handleEditUser}>
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
                              <AlertDialogTitle>ユーザーを削除しますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                この操作は取り消せません。ユーザー「{user.fullName}」を完全に削除します。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDeleteUser(user.id)}
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
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                ? '検索条件に一致するユーザーが見つかりません'
                : 'ユーザーがまだ作成されていません'}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </AuthGuard>
  );
}