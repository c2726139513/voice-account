import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { invoiceIds } = await request.json()

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: '账单ID列表不能为空' }, { status: 400 })
    }

    // 检查账单表单是否存在
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        customer: true
      }
    })

    if (!bill) {
      return NextResponse.json({ error: '账单表单不存在' }, { status: 404 })
    }

    // 获取要添加的账单
    const invoices = await prisma.invoice.findMany({
      where: {
        id: {
          in: invoiceIds
        }
      },
      include: {
        customer: true
      }
    })

    // 检查是否所有账单都属于同一客户
    const invalidInvoices = invoices.filter(inv => inv.customerId !== bill.customerId)
    if (invalidInvoices.length > 0) {
      return NextResponse.json({ 
        error: '只能添加同一客户的账单到此账单表单',
        invalidCustomers: invalidInvoices.map(inv => inv.customer.name)
      }, { status: 400 })
    }

    // 将账单关联到账单表单
    const updatedInvoices = await prisma.invoice.updateMany({
      where: {
        id: {
          in: invoiceIds
        }
      },
      data: {
        billId: id
      }
    })

    // 重新计算账单表单总金额
    const allInvoices = await prisma.invoice.findMany({
      where: { billId: id }
    })

    const totalAmount = allInvoices.reduce((sum, inv) => sum + inv.totalPrice, 0)

    await prisma.bill.update({
      where: { id },
      data: { totalAmount }
    })

    return NextResponse.json({
      success: true,
      updatedCount: updatedInvoices.count,
      totalAmount
    })
  } catch (error) {
    console.error('添加账单到表单时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { invoiceIds } = await request.json()

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: '账单ID列表不能为空' }, { status: 400 })
    }

    // 将账单从账单表单中移除（回到总账单）
    const updatedInvoices = await prisma.invoice.updateMany({
      where: {
        id: {
          in: invoiceIds
        }
      },
      data: {
        billId: null
      }
    })

    // 重新计算账单表单总金额
    const remainingInvoices = await prisma.invoice.findMany({
      where: { billId: id }
    })

    const totalAmount = remainingInvoices.reduce((sum, inv) => sum + inv.totalPrice, 0)

    await prisma.bill.update({
      where: { id },
      data: { totalAmount }
    })

    return NextResponse.json({
      success: true,
      updatedCount: updatedInvoices.count,
      totalAmount
    })
  } catch (error) {
    console.error('从表单移除账单时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}