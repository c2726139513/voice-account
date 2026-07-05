import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    let company = await prisma.company.findFirst()

    if (!company) {
      company = await prisma.company.create({
        data: {}
      })
    }

    const token = request.cookies.get('token')?.value
    const isAuthenticated = token && verifyToken(token)

    const response = NextResponse.json(
      isAuthenticated
        ? { company }
        : {
            company: {
              id: company.id,
              name: company.name,
              contactPerson: null,
              contactPhone: null
            }
          }
    )
    // 公司信息极少变更，允许 EdgeOne CDN 缓存 5 分钟
    response.headers.set('Cache-Control', 'public, s-maxage=300, max-age=60, stale-while-revalidate=600')
    return response
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
    const { name, contactPerson, contactPhone, printFooter } = body

    let company = await prisma.company.findFirst()

    if (company) {
      company = await prisma.company.update({
        where: { id: company.id },
        data: {
          name: name || null,
          contactPerson: contactPerson || null,
          contactPhone: contactPhone || null,
          printFooter: printFooter || null
        }
      })
    } else {
      company = await prisma.company.create({
        data: {
          name: name || null,
          contactPerson: contactPerson || null,
          contactPhone: contactPhone || null,
          printFooter: printFooter || null
        }
      })
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('更新公司信息时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
