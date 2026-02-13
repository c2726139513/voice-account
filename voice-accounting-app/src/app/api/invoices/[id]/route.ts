import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const { customerId, description, quantity, unitPrice, workDate } = body

    // 验证必填字段
    if (!customerId || !description || !quantity || !unitPrice || !workDate) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 验证数值字段
    if (isNaN(quantity) || isNaN(unitPrice) || quantity <= 0 || unitPrice <= 0) {
      return NextResponse.json({ error: '数量和单价必须为正数' }, { status: 400 })
    }

    // 验证客户是否存在
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })
    
    if (!customer) {
      return NextResponse.json({ error: '客户不存在' }, { status: 400 })
    }

    // 计算总价
    const totalPrice = quantity * unitPrice

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        customerId,
        description,
        quantity,
        unitPrice,
        totalPrice,
        workDate: new Date(workDate)
      },
      include: {
        customer: true
      }
    })

    // 如果发票属于某个账单，更新账单的总金额
    if (invoice.billId) {
      const billInvoices = await prisma.invoice.findMany({
        where: { billId: invoice.billId }
      })

      const totalAmount = billInvoices.reduce((sum, inv) => sum + inv.totalPrice, 0)

      await prisma.bill.update({
        where: { id: invoice.billId },
        data: { totalAmount }
      })

      console.log('账单总金额已更新:', {
        billId: invoice.billId,
        totalAmount
      })
    }

    console.log('账单更新成功:', {
      id: invoice.id,
      customerId: invoice.customerId,
      customerName: invoice.customer.name
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('更新账单时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const invoice = await prisma.invoice.delete({
      where: { id },
      include: {
        customer: true
      }
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('删除账单时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}