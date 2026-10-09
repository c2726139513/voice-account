import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, ['bill:read', 'invoice:read'])
  if (auth instanceof NextResponse) return auth
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (startDate && Number.isNaN(new Date(startDate).getTime())) {
      return NextResponse.json({ error: '无效的日期格式: startDate' }, { status: 400 })
    }
    if (endDate && Number.isNaN(new Date(endDate).getTime())) {
      return NextResponse.json({ error: '无效的日期格式: endDate' }, { status: 400 })
    }

    // 单边日期按开区间生效：只传 startDate = 起始至今，只传 endDate = 历史至该日
    const startInstant = startDate ? new Date(startDate) : undefined
    const invoiceEndInstant = endDate ? new Date(endDate) : undefined
    const billEndInstant = endDate
      ? (/^\d{4}-\d{2}-\d{2}$/.test(endDate)
        ? new Date(`${endDate}T23:59:59.999Z`)
        : new Date(endDate))
      : undefined

    const invoiceWhere: Prisma.InvoiceWhereInput = {
      ...(startInstant || invoiceEndInstant
        ? {
            workDate: {
              ...(startInstant ? { gte: startInstant } : {}),
              ...(invoiceEndInstant ? { lte: invoiceEndInstant } : {})
            }
          }
        : {}),
      ...(customerId ? { customerId } : {})
    }
    const billWhere: Prisma.BillWhereInput = {
      ...(startInstant || billEndInstant
        ? {
            createdAt: {
              ...(startInstant ? { gte: startInstant } : {}),
              ...(billEndInstant ? { lte: billEndInstant } : {})
            }
          }
        : {}),
      ...(customerId ? { customerId } : {})
    }

    if (type === 'summary') {
      // 总体统计报告
      const totalInvoices = await prisma.invoice.count({
        where: invoiceWhere
      })
      const totalAmount = await prisma.invoice.aggregate({
        where: invoiceWhere,
        _sum: { totalPrice: true }
      })
      
      const activeInvoices = await prisma.invoice.count({
        where: { ...invoiceWhere, status: 'ACTIVE' }
      })
      
      // 计算在账单表单中的发票数量
      const invoicesInBills = await prisma.invoice.count({
        where: { ...invoiceWhere, billId: { not: null } }
      })
      
      const availableInvoices = activeInvoices - invoicesInBills

      const totalBills = await prisma.bill.count({ where: billWhere })
      const pendingBills = await prisma.bill.count({
        where: { ...billWhere, status: 'PENDING' }
      })
      
      const completedBills = await prisma.bill.count({
        where: { ...billWhere, status: 'COMPLETED' }
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
        where: customerId ? { id: customerId } : undefined,
        include: {
          invoices: {
            where: startInstant || invoiceEndInstant ? {
              workDate: {
                ...(startInstant ? { gte: startInstant } : {}),
                ...(invoiceEndInstant ? { lte: invoiceEndInstant } : {})
              }
            } : undefined
          },
          bills: {
            where: startInstant || billEndInstant ? {
              createdAt: {
                ...(startInstant ? { gte: startInstant } : {}),
                ...(billEndInstant ? { lte: billEndInstant } : {})
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
          totalAmount: invoiceTotal
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
        FROM "invoices" 
        WHERE "workDate" >= ${startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1)}
          AND "workDate" <= ${endDate ? new Date(`${endDate}T23:59:59.999Z`) : new Date()}
          ${customerId ? Prisma.sql`AND "customerId" = ${customerId}` : Prisma.empty}
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
        where: invoiceWhere,
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