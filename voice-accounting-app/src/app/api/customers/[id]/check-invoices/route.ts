import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Checking invoices for customer:', id);

    // 检查客户是否有账单
    const invoiceCount = await prisma.invoice.count({
      where: {
        customerId: id
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