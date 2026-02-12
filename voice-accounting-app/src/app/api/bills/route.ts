import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { invoiceIds, title } = await request.json()

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: '账单ID列表不能为空' }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: '账单标题不能为空' }, { status: 400 })
    }

    // 获取选中的账单
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

    if (invoices.length === 0) {
      return NextResponse.json({ error: '未找到有效的账单' }, { status: 404 })
    }

    // 检查是否所有账单都属于同一客户
    const customerIds = [...new Set(invoices.map(inv => inv.customerId))]
    if (customerIds.length > 1) {
      return NextResponse.json({ error: '只能为同一客户的账单创建账单表单' }, { status: 400 })
    }

    const customerId = customerIds[0]
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalPrice, 0)

    // 创建账单表单
    const bill = await prisma.bill.create({
      data: {
        customerId,
        title,
        totalAmount,
        status: 'PENDING'
      },
      include: {
        customer: true
      }
    })

    // 将账单关联到账单表单
    await prisma.invoice.updateMany({
      where: {
        id: {
          in: invoiceIds
        }
      },
      data: {
        billId: bill.id,
        status: 'ACTIVE' // 保持ACTIVE状态，因为它们在账单表单中
      }
    })

    // 重新获取包含关联账单的账单表单
    const billWithInvoices = await prisma.bill.findUnique({
      where: { id: bill.id },
      include: {
        customer: true,
        invoices: {
          include: {
            customer: true
          },
          orderBy: {
            workDate: 'desc'
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      bill: billWithInvoices
    })
  } catch (error) {
    console.error('创建账单表单时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}