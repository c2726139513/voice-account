import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ACTIVE'
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = { status }

    // 只显示未加入账单表单的账单（billId为null）
    where.billId = null

    if (customerId) {
      where.customerId = customerId
    }

    if (startDate || endDate) {
      where.workDate = {}
      if (startDate) {
        where.workDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.workDate.lte = new Date(endDate)
      }
    }

    const skip = (page - 1) * limit

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.invoice.count({ where })
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取账单列表时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}