import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * 惰性 PrismaClient - import 时不创建 client，首次使用时才初始化。
 *
 * 在 EdgeOne serverless 环境下，SSR 函数冷启动会 bundle 所有路由模块。
 * 如果 prisma 在模块加载时就创建 client，每次冷启动都会建立数据库连接，
 * 导致健康检查 ping 等非用户请求也产生数据库流量。
 *
 * 使用 Proxy 代理 prisma 的所有属性访问，第一次访问任何属性时
 *（如 prisma.user、prisma.invoice）才真正创建 PrismaClient 及连接。
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!globalForPrisma.prisma) {
      const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL,
      })
      globalForPrisma.prisma = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query'] : [],
      })
    }
    return (globalForPrisma.prisma as unknown as Record<string | symbol, unknown>)[prop]
  },
})