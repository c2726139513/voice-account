import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { invoiceIds, status } = await request.json()

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: '账单ID列表不能为空' }, { status: 400 })
    }

    if (!['PENDING', 'COMPLETED'].includes(status)) {
      return NextResponse.json({ error: '无效的状态' }, { status: 400 })
    }

    const result = await prisma.invoice.updateMany({
      where: {
        id: {
          in: invoiceIds
        }
      },
      data: {
        status
      }
    })

    return NextResponse.json({ 
      success: true,
      updatedCount: result.count 
    })
  } catch (error) {
    console.error('批量更新账单状态时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}