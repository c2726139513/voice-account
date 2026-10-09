import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, 'bill:read')
  if (auth instanceof NextResponse) return auth
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = { status }

    if (customerId) {
      where.customerId = customerId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        // endDate 为纯日期（YYYY-MM-DD）时扩展到当天结束，避免漏掉当天创建的账单
        const end = /^\d{4}-\d{2}-\d{2}$/.test(endDate)
          ? new Date(`${endDate}T23:59:59.999Z`)
          : new Date(endDate)
        where.createdAt.lte = end
      }
    }

    const skip = (page - 1) * limit

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: {
          customer: true,
          invoices: {
            include: {
              customer: true
            },
            orderBy: {
              workDate: 'asc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.bill.count({ where })
    ])

    return NextResponse.json({
      bills,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取账单表单列表时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}