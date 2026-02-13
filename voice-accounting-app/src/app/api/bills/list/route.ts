import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const customerId = searchParams.get('customerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = { status }

    if (customerId) {
      where.customerId = customerId
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