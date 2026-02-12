import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      hasUsers: userCount > 0,
      userCount
    });
  } catch (error) {
    console.error('Check users error:', error);
    return NextResponse.json(
      { error: '检查用户失败' },
      { status: 500 }
    );
  }
}