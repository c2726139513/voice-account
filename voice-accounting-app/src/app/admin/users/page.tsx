'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import UserForm from '@/components/UserForm'
import UserList from '@/components/UserList'

interface User {
  id: string
  username: string
  permissions: string[]
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

export default function UsersPage() {
  const { user, logout, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        const result = await response.json()
        alert(`获取用户列表失败: ${result.error}`)
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      alert('获取用户列表失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      fetchUsers()
    }
  }, [authLoading, user])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">正在跳转到登录页...</div>
      </div>
    )
  }

  const handleCreateUser = async (data: { username: string; password: string; permissions: string[]; isAdmin: boolean }) => {
    setFormLoading(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        alert('用户创建成功')
        setShowForm(false)
        await fetchUsers()
      } else {
        const result = await response.json()
        alert(`创建失败: ${result.error}`)
      }
    } catch (error) {
      console.error('创建用户失败:', error)
      alert('创建失败，请重试')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateUser = async (data: { username: string; password: string; permissions: string[]; isAdmin: boolean }) => {
    if (!editingUser) return

    setFormLoading(true)
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        alert('用户更新成功')
        setEditingUser(null)
        setShowForm(false)
        await fetchUsers()
      } else {
        const result = await response.json()
        alert(`更新失败: ${result.error}`)
      }
    } catch (error) {
      console.error('更新用户失败:', error)
      alert('更新失败，请重试')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert(`用户"${username}"已删除`)
        await fetchUsers()
      } else {
        const result = await response.json()
        alert(`删除失败: ${result.error}`)
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      alert('删除失败，请重试')
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setEditingUser(null)
    setShowForm(false)
  }

  const handleSave = (data: { username: string; password: string; permissions: string[]; isAdmin: boolean }) => {
    if (editingUser) {
      handleUpdateUser(data)
    } else {
      handleCreateUser(data)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={logout} />

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    管理系统用户和权限设置
                  </p>
                </div>
                {!showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    创建用户
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {showForm ? (
                <UserForm
                  user={editingUser}
                  onSave={handleSave}
                  onCancel={handleCancelForm}
                  loading={formLoading}
                />
              ) : loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <UserList
                  users={users}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  currentUserId={user?.id}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
