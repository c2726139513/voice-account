'use client'

import { useState } from 'react'

interface User {
  id: string
  username: string
  permissions: string[]
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

interface UserListProps {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (userId: string, username: string) => void
  currentUserId?: string
}

export default function UserList({ users, onEdit, onDelete, currentUserId }: UserListProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const getPermissionLabels = (permissions: string[], isAdmin: boolean) => {
    if (isAdmin) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">管理员</span>
    }

    const labels: string[] = []
    if (permissions.includes('bill:delete')) labels.push('账单删除')
    if (permissions.includes('pending-bill:delete')) labels.push('待结账单删除')
    if (permissions.includes('pending-bill:revert')) labels.push('待结账单回退')
    if (permissions.includes('completed-bill:revert')) labels.push('已结账单回退')

    if (labels.length === 0) {
      return <span className="text-sm text-gray-500">无特殊权限</span>
    }

    return labels.map((label, index) => (
      <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mr-1">
        {label}
      </span>
    ))
  }

  return (
    <div className="space-y-4">
      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无用户
        </div>
      ) : (
        users.map((user) => (
          <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900">{user.username}</h3>
                  {getPermissionLabels(user.permissions, user.isAdmin)}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  创建时间：{formatDate(user.createdAt)}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(user)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                >
                  编辑
                </button>
                {user.id !== currentUserId && (
                  <button
                    onClick={() => {
                      if (confirm(`确定要删除用户"${user.username}"吗？`)) {
                        onDelete(user.id, user.username)
                      }
                    }}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
