import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 从URL获取ID，因为动态路由可能有问题
    const url = new URL(request.url);
    const customerId = url.pathname.split('/').pop();
    console.log('Checking invoices for customer:', customerId);
    console.log('Full params object:', JSON.stringify(params));

    // 检查客户是否有账单
    const invoiceCount = await prisma.invoice.count({
      where: {
        customerId: customerId
      }
    });

    console.log('Invoice count result:', invoiceCount);

    return NextResponse.json({
      hasInvoices: invoiceCount > 0,
      invoiceCount
    });
  } catch (error) {
    console.error('Check customer invoices error:', error);
    return NextResponse.json(
      { error: '检查客户账单失败' },
      { status: 500 }
    );
  }
}