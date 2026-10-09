import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, 'customer:read');
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    console.log('Checking invoices for customer:', id);

    const [invoiceCount, billCount] = await Promise.all([
      prisma.invoice.count({ where: { customerId: id } }),
      prisma.bill.count({ where: { customerId: id } })
    ]);

    console.log('Invoice count result:', invoiceCount, 'Bill count result:', billCount);

    return NextResponse.json({
      hasInvoices: invoiceCount > 0,
      invoiceCount,
      hasBills: billCount > 0,
      billCount
    });
  } catch (error) {
    console.error('Check customer invoices error:', error);
    return NextResponse.json(
      { error: '检查客户账单失败' },
      { status: 500 }
    );
  }
}