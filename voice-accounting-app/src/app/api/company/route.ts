import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 })
    }

    let company = await prisma.company.findFirst()

    if (!company) {
      company = await prisma.company.create({
        data: {}
      })
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('获取公司信息时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 })
    }

    const body = await request.json()
    const { name, contactPerson, contactPhone } = body

    let company = await prisma.company.findFirst()

    if (company) {
      company = await prisma.company.update({
        where: { id: company.id },
        data: {
          name: name || null,
          contactPerson: contactPerson || null,
          contactPhone: contactPhone || null
        }
      })
    } else {
      company = await prisma.company.create({
        data: {
          name: name || null,
          contactPerson: contactPerson || null,
          contactPhone: contactPhone || null
        }
      })
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('更新公司信息时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
