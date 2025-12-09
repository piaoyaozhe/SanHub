'use client';

import { useState, useEffect } from 'react';
import { User, Eye, Ban, Check, Search, Edit2, Key, Coins, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SafeUser, Generation } from '@/types';
import { formatBalance, formatDate } from '@/lib/utils';

export default function UsersPage() {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [userGenerations, setUserGenerations] = useState<Generation[]>([]);
  const [editMode, setEditMode] = useState<'password' | 'balance' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('加载用户失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectUser = async (user: SafeUser) => {
    setSelectedUser(user);
    setEditMode(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserGenerations(data.generations || []);
      }
    } catch (err) {
      console.error('加载用户详情失败:', err);
    }
  };

  const updateUser = async (updates: Record<string, unknown>) => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setSelectedUser({ ...selectedUser, ...updatedUser });
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...updatedUser } : u));
        setEditMode(null);
        setEditValue('');
      }
    } catch (err) {
      console.error('更新失败:', err);
    }
  };

  const toggleDisabled = () => {
    if (!selectedUser) return;
    updateUser({ disabled: !selectedUser.disabled });
  };

  const savePassword = () => {
    if (!editValue.trim() || editValue.length < 6) {
      alert('密码至少 6 个字符');
      return;
    }
    updateUser({ password: editValue });
  };

  const saveBalance = () => {
    const balance = parseInt(editValue);
    if (isNaN(balance) || balance < 0) {
      alert('请输入有效的积分数值');
      return;
    }
    updateUser({ balance });
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-1/4"></div>
          <div className="h-64 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">用户管理</h1>
        <p className="text-muted-foreground">管理用户账号、余额和权限</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 用户列表 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索用户..."
              className="pl-9"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredUsers.map(user => (
              <Card 
                key={user.id}
                className={`cursor-pointer transition-colors ${
                  selectedUser?.id === user.id ? 'border-foreground' : 'hover:bg-secondary/50'
                } ${user.disabled ? 'opacity-50' : ''}`}
                onClick={() => selectUser(user)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatBalance(user.balance)}</p>
                      {user.disabled && (
                        <span className="text-xs text-destructive">已禁用</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 用户详情 */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="space-y-4">
              {/* 基本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>用户信息</span>
                    <Button
                      variant={selectedUser.disabled ? 'default' : 'destructive'}
                      size="sm"
                      onClick={toggleDisabled}
                    >
                      {selectedUser.disabled ? (
                        <><Check className="w-4 h-4 mr-1" /> 启用</>
                      ) : (
                        <><Ban className="w-4 h-4 mr-1" /> 禁用</>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">邮箱</Label>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">昵称</Label>
                      <p className="font-medium">{selectedUser.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">角色</Label>
                      <p className="font-medium">{selectedUser.role === 'admin' ? '管理员' : '用户'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">注册时间</Label>
                      <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 修改密码 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    修改密码
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editMode === 'password' ? (
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="输入新密码（至少6位）"
                      />
                      <Button onClick={savePassword}>保存</Button>
                      <Button variant="outline" onClick={() => { setEditMode(null); setEditValue(''); }}>取消</Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => { setEditMode('password'); setEditValue(''); }}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      重置密码
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* 修改余额 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    积分余额: {formatBalance(selectedUser.balance)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editMode === 'balance' ? (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="输入新余额"
                      />
                      <Button onClick={saveBalance}>保存</Button>
                      <Button variant="outline" onClick={() => { setEditMode(null); setEditValue(''); }}>取消</Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => { setEditMode('balance'); setEditValue(String(selectedUser.balance)); }}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      修改余额
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* 生成记录 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    生成记录 ({userGenerations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userGenerations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">暂无生成记录</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {userGenerations.map(gen => (
                        <div key={gen.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{gen.prompt || '无提示词'}</p>
                            <p className="text-xs text-muted-foreground">
                              {gen.type} · {formatDate(gen.createdAt)} · -{gen.cost} 积分
                            </p>
                          </div>
                          {gen.resultUrl && (
                            <a href={gen.resultUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>选择一个用户查看详情</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
