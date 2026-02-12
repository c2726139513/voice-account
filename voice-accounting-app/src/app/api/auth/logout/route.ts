import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: '已退出登录'
    });

    clearAuthCookie(response);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: '退出登录失败' },
      { status: 500 }
    );
  }
}