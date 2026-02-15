'use client'

import { useState } from 'react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await onLogout()
    router.push('/login')
  }

  const navItems = [
    { href: '/', label: '总账单', icon: '📋', active: pathname === '/' },
    { href: '/pending', label: '待结账单', icon: '⏳', active: pathname === '/pending' },
    { href: '/completed', label: '已结账单', icon: '✅', active: pathname === '/completed' },
    { href: '/admin/users', label: '用户管理', icon: '👥', active: pathname === '/admin/users', adminOnly: true },
    { href: '/admin/settings', label: '系统管理', icon: '⚙️', active: pathname === '/admin/settings', adminOnly: true }
  ].filter(item => {
    // 根据权限过滤导航项
    if (item.href === '/' && !hasPermission('invoice:read')) return false
    if (item.href === '/pending' && !hasPermission('bill:read')) return false
    if (item.href === '/completed' && !hasPermission('bill:read')) return false
    if ((item as any).adminOnly && !user?.isAdmin) return false
    return true
  })

  return (
    <>
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
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
            <div className="hidden sm:flex items-center space-x-4">
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
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">打开菜单</span>
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200">
            <div className="pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    item.active
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-4 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user?.username || '用户'}
                  </div>
                  {user?.isAdmin && (
                    <div className="text-sm text-gray-500">管理员</div>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  退出登录
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full ${
                item.active ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="sm:hidden h-16"></div>
    </>
  )
}