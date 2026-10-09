import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, JWTPayload, getUserById } from '@/lib/auth'
import { hasPermission, hasAnyPermission } from '@/lib/permissions'

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

/**
 * 已完成 requireAuth 后，基于数据库中的【最新】权限做校验。
 * 权限存于 DB 而非 JWT（JWT 权限在登录时固化、7 天过期），
 * 因此管理员关掉权限后立即生效，无需重新登录。
 *
 * 放行条件：user.isAdmin 为 true，或拥有
 * - 单个权限：hasPermission（含 system:admin 万能权限）
 * - 权限数组：hasAnyPermission（满足其一即可）
 *
 * 用法：
 *   const guard = await checkPermission(auth, PERMISSIONS.BILL_DELETE)
 *   if (guard instanceof NextResponse) return guard
 */
export async function checkPermission(
  auth: JWTPayload,
  required: string | string[]
): Promise<JWTPayload | NextResponse> {
  const user = await getUserById(auth.userId)
  if (!user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const granted = user.isAdmin
    || (Array.isArray(required)
      ? hasAnyPermission(user.permissions, required)
      : hasPermission(user.permissions, required))

  if (!granted) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 })
  }

  // 返回数据库中的最新权限，避免下游继续使用 JWT 中的陈旧值
  return { ...auth, permissions: user.permissions, isAdmin: user.isAdmin }
}

/**
 * requireAuth + checkPermission 二合一（需先读取请求体的场景请分两步调用）。
 *
 * 用法：
 *   const auth = await requirePermission(request, PERMISSIONS.BILL_DELETE)
 *   if (auth instanceof NextResponse) return auth
 */
export async function requirePermission(
  request: NextRequest,
  required: string | string[]
): Promise<JWTPayload | NextResponse> {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  return checkPermission(auth, required)
}

/**
 * 仅管理员（user.isAdmin）可用的端点门禁。
 * 与 checkPermission 同样读取数据库最新值，避免 JWT 中过期的 isAdmin
 * 在管理员被撤销后继续放行。错误串保持 `需要管理员权限`（接口文档已约定）。
 */
export async function requireAdmin(request: NextRequest): Promise<JWTPayload | NextResponse> {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const user = await getUserById(auth.userId)
  if (!user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
  }

  return { ...auth, permissions: user.permissions, isAdmin: user.isAdmin }
}
