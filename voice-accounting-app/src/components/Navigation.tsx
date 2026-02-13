'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'

interface NavigationProps {
  user: any
  onLogout: () => void
}

export default function Navigation({ user, onLogout }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { hasPermission } = useAuth()
  const { company } = useCompany()

  const handleLogout = async () => {
    await onLogout()
    router.push('/login')
  }

  const navItems = [
    { href: '/', label: '总账单', active: pathname === '/' },
    { href: '/pending', label: '待结账单', active: pathname === '/pending' },
    { href: '/completed', label: '已结账单', active: pathname === '/completed' },
    { href: '/admin/users', label: '用户管理', active: pathname === '/admin/users', adminOnly: true },
    { href: '/admin/settings', label: '系统管理', active: pathname === '/admin/settings', adminOnly: true }
  ].filter(item => {
    // 根据权限过滤导航项
    if (item.href === '/' && !hasPermission('invoice:read')) return false
    if (item.href === '/pending' && !hasPermission('bill:read')) return false
    if (item.href === '/completed' && !hasPermission('bill:read')) return false
    if ((item as any).adminOnly && !user?.isAdmin) return false
    return true
  })

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                {company?.name || '语音记账系统'}
              </h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    item.active
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              欢迎，{user?.username || '用户'}
              {user?.isAdmin && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">管理员</span>
              )}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}