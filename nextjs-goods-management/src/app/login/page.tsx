'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!email || !password) {
      toast.error('メールアドレスとパスワードを入力してください');
      return;
    }

    if (password.length < 8) {
      toast.error('パスワードは8文字以上で入力してください');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // 仮の認証処理
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // デモ用の認証
      if (email === 'admin@example.com' && password === 'password123') {
        // セッション情報を保存（実際はJWTトークンなどを使用）
        localStorage.setItem('authToken', 'demo-token');
        localStorage.setItem('userEmail', email);
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        toast.success('ログインしました');
        router.push('/');
      } else {
        toast.error('メールアドレスまたはパスワードが正しくありません');
      }
    } catch (error) {
      toast.error('ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            IPグッズ在庫管理システム
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            アカウントにログインしてください
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@example.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8文字以上で入力"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900 cursor-pointer"
              >
                ログイン状態を保持する
              </Label>
            </div>

            <div className="text-sm">
              <Link
                href="/reset-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                パスワードを忘れた方はこちら
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>

          <div className="text-center text-sm text-gray-600">
            デモ用アカウント: admin@example.com / password123
          </div>
        </form>
      </div>
    </div>
  );
}