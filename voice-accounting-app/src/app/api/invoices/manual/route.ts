import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const {
      customerId,
      description,
      quantity,
      unitPrice,
      totalPrice,
      workDate
    } = await request.json()

    if (!customerId || !description || !quantity || !unitPrice || !totalPrice || !workDate) {
      return NextResponse.json({ error: '所有字段都是必填的' }, { status: 400 })
    }

    const invoice = await prisma.invoice.create({
      data: {
        customerId,
        description,
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice),
        totalPrice: parseFloat(totalPrice),
        workDate: new Date(workDate),
        status: 'ACTIVE'
      },
      include: {
        customer: true
      }
    })

    return NextResponse.json({
      success: true,
      invoice
    })
  } catch (error) {
    console.error('手动创建账单时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}