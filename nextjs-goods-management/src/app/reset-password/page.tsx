'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('メールアドレスを入力してください');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // デモ用の処理
      toast.success('パスワードリセットメールを送信しました');
      setIsSubmitted(true);
    } catch (error) {
      toast.error('メールの送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        {!isSubmitted ? (
          <>
            <div>
              <Link
                href="/login"
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                ログイン画面に戻る
              </Link>
              <h1 className="mt-6 text-2xl font-bold text-gray-900">
                パスワードリセット
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                登録されているメールアドレスを入力してください。
                パスワードリセット用のリンクをお送りします。
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '送信中...' : 'リセットメールを送信'}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-medium text-gray-900">
              メールを送信しました
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {email}宛にパスワードリセット用のリンクを送信しました。
              メールをご確認ください。
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                ログイン画面に戻る
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}