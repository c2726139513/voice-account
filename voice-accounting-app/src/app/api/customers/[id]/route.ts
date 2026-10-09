import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;

    // 发票与账单表单都随客户级联删除（schema onDelete: Cascade），存在任一关联即拒绝
    const [invoiceCount, billCount] = await Promise.all([
      prisma.invoice.count({ where: { customerId: id } }),
      prisma.bill.count({ where: { customerId: id } })
    ]);

    if (invoiceCount > 0) {
      return NextResponse.json(
        { error: `无法删除客户：该客户有 ${invoiceCount} 张账单记录` },
        { status: 400 }
      );
    }

    if (billCount > 0) {
      return NextResponse.json(
        { error: `无法删除客户：该客户有 ${billCount} 个账单表单` },
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