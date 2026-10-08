import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            invoices: true
          }
        }
      }
    })

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('获取客户列表时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const { name, phone, email } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: '客户名称不能为空' }, { status: 400 })
    }

    // 检查客户是否已存在
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingCustomer) {
      return NextResponse.json({ error: '客户已存在' }, { status: 400 })
    }

    // 创建新客户
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null
      }
    })

    console.log('新客户创建成功:', customer)

    return NextResponse.json({ 
      success: true,
      customer 
    })
  } catch (error) {
    console.error('创建客户时出错:', error)
    return NextResponse.json({ 
      error: '创建客户失败: ' + (error as Error).message 
    }, { status: 500 })
  }
}