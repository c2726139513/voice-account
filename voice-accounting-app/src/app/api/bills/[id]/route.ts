import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const bill = await prisma.bill.findUnique({
      where: { id },
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
      }
    })

    if (!bill) {
      return NextResponse.json({ error: '账单不存在' }, { status: 404 })
    }

    return NextResponse.json({ bill })
  } catch (error) {
    console.error('获取账单详情时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 首先获取账单信息，包括关联的发票
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        invoices: true
      }
    })

    if (!bill) {
      return NextResponse.json({ error: '账单不存在' }, { status: 404 })
    }

    // 将账单中的所有发票的billId设置为null，退回到总账单
    await prisma.invoice.updateMany({
      where: {
        billId: id
      },
      data: {
        billId: null
      }
    })

    // 删除账单
    await prisma.bill.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true,
      message: `账单"${bill.title}"已删除，${bill.invoices.length}条明细已退回总账单`
    })
  } catch (error) {
    console.error('删除账单时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!['PENDING', 'COMPLETED'].includes(status)) {
      return NextResponse.json({ error: '无效的状态' }, { status: 400 })
    }

    // 如果状态变为COMPLETED，设置结账日期
    const updateData: any = { status }
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date()
    } else {
      updateData.completedAt = null
    }

    const bill = await prisma.bill.update({
      where: { id },
      data: updateData,
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
      }
    })

    return NextResponse.json({ bill })
  } catch (error) {
    console.error('更新账单状态时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}