import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 認証が不要なパス
const publicPaths = ['/login', '/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 公開パスはそのまま通す
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // 認証トークンの確認（クライアントサイドのlocalStorageは使えないので、cookieを使用する実装に変更が必要）
  // TODO: 実際の実装では、JWTトークンをhttpOnlyクッキーで管理する
  const token = request.cookies.get('authToken')?.value;

  // トークンがない場合はログインページへリダイレクト
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};