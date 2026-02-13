import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 先检查客户是否有账单
    const invoices = await prisma.invoice.findMany({
      where: {
        customerId: id
      },
      select: { id: true }
    });

    if (invoices.length > 0) {
      return NextResponse.json(
        { error: `无法删除客户：该客户有 ${invoices.length} 张账单记录` },
        { status: 400 }
      );
    }

    // 删除客户
    await prisma.customer.delete({
      where: {
        id
      }
    });

    return NextResponse.json({
      success: true,
      message: '客户删除成功'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    
    // 检查是否是客户不存在的错误
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: '客户不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: '删除客户失败' },
      { status: 500 }
    );
  }
}