import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateToken, getUserByUsername, setAuthCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 生成JWT
    const token = generateToken({
      userId: user.id,
      username: user.username,
      permissions: user.permissions,
      isAdmin: user.isAdmin,
    });

    // 设置cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        permissions: user.permissions,
        isAdmin: user.isAdmin,
      }
    });

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}