import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, JWTPayload } from '@/lib/auth'

/**
 * API 统一鉴权：校验 httpOnly cookie 中的 JWT。
 * - 无 token / token 无效 → 返回 401 NextResponse（调用方直接 return）
 * - 有效 → 返回 JWTPayload
 *
 * 用法：
 *   const auth = requireAuth(request)
 *   if (auth instanceof NextResponse) return auth
 */
export function requireAuth(request: NextRequest): JWTPayload | NextResponse {
  const token = request.cookies.get('token')?.value
  if (!token) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  return payload
}
