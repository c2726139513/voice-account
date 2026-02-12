import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (type === 'summary') {
      // 总体统计报告
      const totalInvoices = await prisma.invoice.count()
      const totalAmount = await prisma.invoice.aggregate({
        _sum: { totalPrice: true }
      })
      
      const activeInvoices = await prisma.invoice.count({
        where: { status: 'ACTIVE' }
      })
      
      // 计算在账单表单中的发票数量
      const invoicesInBills = await prisma.invoice.count({
        where: { billId: { not: null } }
      })
      
      const availableInvoices = activeInvoices - invoicesInBills

      const totalBills = await prisma.bill.count()
      const pendingBills = await prisma.bill.count({
        where: { status: 'PENDING' }
      })
      
      const completedBills = await prisma.bill.count({
        where: { status: 'COMPLETED' }
      })

      return NextResponse.json({
        summary: {
          totalInvoices,
          totalAmount: totalAmount._sum.totalPrice || 0,
          activeInvoices,
          availableInvoices,
          invoicesInBills,
          totalBills,
          pendingBills,
          completedBills
        }
      })
    } else if (type === 'customer') {
      // 客户报告
      const customerStats = await prisma.customer.findMany({
        include: {
          invoices: {
            where: startDate && endDate ? {
              workDate: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            } : undefined
          },
          bills: {
            where: startDate && endDate ? {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            } : undefined
          }
        }
      })

      const customerReports = customerStats.map(customer => {
        const invoiceTotal = customer.invoices.reduce((sum, invoice) => sum + invoice.totalPrice, 0)
        const billTotal = customer.bills.reduce((sum, bill) => sum + bill.totalAmount, 0)
        
        return {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          invoiceCount: customer.invoices.length,
          invoiceTotal,
          billCount: customer.bills.length,
          billTotal,
          totalAmount: invoiceTotal + billTotal
        }
      })

      return NextResponse.json({ customers: customerReports })
    } else if (type === 'monthly') {
      // 月度趋势报告
      const monthlyData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "workDate") as month,
          COUNT(*) as invoice_count,
          SUM("totalPrice") as total_amount
        FROM "Invoice" 
        WHERE "workDate" >= ${startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1)}
          AND "workDate" <= ${endDate ? new Date(endDate) : new Date()}
        GROUP BY DATE_TRUNC('month', "workDate")
        ORDER BY month DESC
      ` as Array<{
        month: Date
        invoice_count: number
        total_amount: number
      }>

      const formattedMonthlyData = monthlyData.map(item => ({
        month: new Date(item.month).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }),
        invoiceCount: parseInt(item.invoice_count.toString()),
        totalAmount: parseFloat(item.total_amount.toString())
      }))

      return NextResponse.json({ monthlyData: formattedMonthlyData })
    } else if (type === 'top-items') {
      // 热门项目报告
      const topItems = await prisma.invoice.groupBy({
        by: ['description'],
        where: startDate && endDate ? {
          workDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        } : undefined,
        _sum: {
          totalPrice: true,
          quantity: true
        },
        _count: {
          description: true
        },
        orderBy: {
          _sum: {
            totalPrice: 'desc'
          }
        },
        take: 10
      })

      const formattedTopItems = topItems.map(item => ({
        description: item.description,
        totalCount: item._count.description,
        totalQuantity: item._sum.quantity || 0,
        totalAmount: item._sum.totalPrice || 0
      }))

      return NextResponse.json({ topItems: formattedTopItems })
    }

    return NextResponse.json({ error: '无效的报告类型' }, { status: 400 })
  } catch (error) {
    console.error('生成报告时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}