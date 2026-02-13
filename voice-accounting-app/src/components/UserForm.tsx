'use client'

import { useState, useEffect } from 'react'
import { PERMISSION_GROUPS } from '@/lib/permissions'

interface User {
  id: string
  username: string
  permissions: string[]
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

interface UserFormProps {
  user?: User | null
  onSave: (data: { username: string; password: string; permissions: string[]; isAdmin: boolean }) => void
  onCancel: () => void
  loading: boolean
}

export default function UserForm({ user, onSave, onCancel, loading }: UserFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [permissions, setPermissions] = useState({
    invoiceDelete: false,
    pendingBillDelete: false,
    pendingBillRevert: false,
    completedBillRevert: false
  })

  useEffect(() => {
    if (user) {
      setUsername(user.username)
      setIsAdmin(user.isAdmin)
      setPermissions({
        invoiceDelete: user.permissions.includes('invoice:delete'),
        pendingBillDelete: user.permissions.includes('pending-bill:delete'),
        pendingBillRevert: user.permissions.includes('pending-bill:revert'),
        completedBillRevert: user.permissions.includes('completed-bill:revert')
      })
    }
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 所有用户默认拥有操作员权限（包括创建、更新等）
    const permissionList: string[] = [...PERMISSION_GROUPS.OPERATOR]

    // 添加额外权限（删除和回退权限）
    if (permissions.invoiceDelete) permissionList.push('invoice:delete')
    if (permissions.pendingBillDelete) permissionList.push('pending-bill:delete')
    if (permissions.pendingBillRevert) permissionList.push('pending-bill:revert')
    if (permissions.completedBillRevert) permissionList.push('completed-bill:revert')

    onSave({
      username: username.trim(),
      password: password.trim(),
      permissions: permissionList,
      isAdmin
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {user ? '编辑用户' : '创建用户'}
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              用户名
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              密码{user ? '（留空则不修改）' : ''}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              placeholder={user ? '留空则不修改密码' : '请输入密码'}
              required={!user}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAdmin"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-900">
              管理员（拥有所有权限）
            </label>
          </div>

          {!isAdmin && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">权限设置</h4>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="invoiceDelete"
                  checked={permissions.invoiceDelete}
                  onChange={(e) => setPermissions({ ...permissions, invoiceDelete: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="invoiceDelete" className="ml-2 block text-sm text-gray-900">
                  总账单删除权限
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pendingBillDelete"
                  checked={permissions.pendingBillDelete}
                  onChange={(e) => setPermissions({ ...permissions, pendingBillDelete: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="pendingBillDelete" className="ml-2 block text-sm text-gray-900">
                  待结账单删除权限
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pendingBillRevert"
                  checked={permissions.pendingBillRevert}
                  onChange={(e) => setPermissions({ ...permissions, pendingBillRevert: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="pendingBillRevert" className="ml-2 block text-sm text-gray-900">
                  待结账单回退权限
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="completedBillRevert"
                  checked={permissions.completedBillRevert}
                  onChange={(e) => setPermissions({ ...permissions, completedBillRevert: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="completedBillRevert" className="ml-2 block text-sm text-gray-900">
                  已结账单回退权限
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}
