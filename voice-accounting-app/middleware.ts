import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 不需要认证的路径
  const publicPaths = ['/login', '/init-admin'];
  const isPublicPath = publicPaths.includes(pathname);
  
  // API路径不需要中间件处理
  const isApiPath = pathname.startsWith('/api/');
  
  if (isApiPath) {
    return NextResponse.next();
  }

  // 获取token
  const token = request.cookies.get('token')?.value;

  // 如果是公共路径且已登录，重定向到首页
  if (isPublicPath && token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string } | null;
      if (payload) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      // Token无效，继续正常流程
    }
  }

  // 如果不是公共路径且未登录，重定向到登录页
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 验证token有效性（仅JWT签名验证，不查数据库）
  if (token && !isPublicPath) {
    try {
      jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
      // Token无效，清除cookie并重定向到登录页
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};