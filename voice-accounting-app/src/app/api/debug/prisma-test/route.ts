import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const customerId = 'cmljhs2gz0000on7uv7squlgx';
    
    console.log('Testing Prisma queries for customer:', customerId);
    
    // 1. 检查客户是否存在
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true }
    });
    console.log('Customer found:', customer);
    
    // 2. 使用count查询
    const invoiceCount = await prisma.invoice.count({
      where: { customerId: customerId }
    });
    console.log('Invoice count (count):', invoiceCount);
    
    // 3. 使用findMany查询
    const invoices = await prisma.invoice.findMany({
      where: { customerId: customerId },
      select: { id: true, description: true }
    });
    console.log('Invoices found (findMany):', invoices);
    
    // 4. 使用原始SQL验证
    const rawResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM invoices WHERE "customerId" = ${customerId}`;
    console.log('Raw SQL result:', rawResult);
    
    return Response.json({
      customer,
      invoiceCount,
      invoicesCount: invoices.length,
      rawCount: rawResult[0]?.count || 0
    });
  } catch (error) {
    console.error('Debug error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}