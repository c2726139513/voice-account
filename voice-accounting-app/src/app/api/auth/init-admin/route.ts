import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PERMISSION_GROUPS } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    // 检查是否已有用户
    const existingUserCount = await prisma.user.count();
    if (existingUserCount > 0) {
      return NextResponse.json(
        { error: '系统已初始化，无法创建管理员账户' },
        { status: 403 }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少6位' },
        { status: 400 }
      );
    }

    // 创建管理员用户
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        permissions: PERMISSION_GROUPS.SUPER_ADMIN,
        isAdmin: true,
      }
    });

    // 生成token并自动登录
    const token = generateToken({
      userId: user.id,
      username: user.username,
      permissions: user.permissions,
      isAdmin: user.isAdmin,
    });

    const response = NextResponse.json({
      success: true,
      message: '管理员账户创建成功',
      user: {
        id: user.id,
        username: user.username,
        permissions: user.permissions,
        isAdmin: user.isAdmin,
      }
    });

    setAuthCookie(response, token);

    return response;
  } catch (error: any) {
    console.error('Init admin error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: '创建管理员账户失败' },
      { status: 500 }
    );
  }
}