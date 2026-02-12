import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

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
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production') as any;
      if (payload) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      // Token无效，继续正常流程
    }
  }

  // 如果不是公共路径且未登录，重定向到登录页
  if (!isPublicPath && !token) {
    console.log('Redirecting to login, pathname:', pathname);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 如果有token，验证是否有效
  if (token && !isPublicPath) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production') as any;
      if (!payload) {
        // token无效，清除cookie并重定向到登录页
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('token');
        return response;
      }

      // 验证用户是否仍然存在
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true }
        });
        
        if (!user) {
          const response = NextResponse.redirect(new URL('/login', request.url));
          response.cookies.delete('token');
          return response;
        }
      } catch (error) {
        console.error('Middleware error:', error);
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('token');
        return response;
      }
    } catch (error) {
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