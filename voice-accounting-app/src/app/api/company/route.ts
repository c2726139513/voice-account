import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getUserById } from '@/lib/auth'
import { requirePermission } from '@/lib/api-auth'
import { hasAnyPermission, PERMISSIONS } from '@/lib/permissions'

const COMPANY_VIEW_PERMISSIONS = [
  PERMISSIONS.CUSTOMER_READ,
  PERMISSIONS.INVOICE_READ,
  PERMISSIONS.BILL_READ,
]

export async function GET(request: NextRequest) {
  try {
    let company = await prisma.company.findFirst()

    if (!company) {
      company = await prisma.company.create({
        data: {}
      })
    }

    const token = request.cookies.get('token')?.value
    const payload = token ? verifyToken(token) : null

    if (!payload) {
      const response = NextResponse.json({
        company: {
          id: company.id,
          name: company.name,
          contactPerson: null,
          contactPhone: null
        }
      })
      // 公司信息极少变更，允许 EdgeOne CDN 缓存 5 分钟
      response.headers.set('Cache-Control', 'public, s-maxage=300, max-age=60, stale-while-revalidate=600')
      return response
    }

    const user = await getUserById(payload.userId)
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const canViewFull = user.isAdmin || hasAnyPermission(user.permissions, COMPANY_VIEW_PERMISSIONS)
    if (!canViewFull) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const response = NextResponse.json({ company })
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
    const auth = await requirePermission(request, PERMISSIONS.SYSTEM_ADMIN)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()

    const data: {
      name?: string | null
      contactPerson?: string | null
      contactPhone?: string | null
      printFooter?: string | null
    } = {}
    if ('name' in body) data.name = body.name || null
    if ('contactPerson' in body) data.contactPerson = body.contactPerson || null
    if ('contactPhone' in body) data.contactPhone = body.contactPhone || null
    if ('printFooter' in body) data.printFooter = body.printFooter || null

    let company = await prisma.company.findFirst()

    if (company) {
      company = await prisma.company.update({
        where: { id: company.id },
        data
      })
    } else {
      company = await prisma.company.create({
        data
      })
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('更新公司信息时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
