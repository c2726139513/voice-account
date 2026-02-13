'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'
import Navigation from '@/components/Navigation'
import SettingsForm from '@/components/SettingsForm'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { company, refreshCompany } = useCompany()
  const [loading, setLoading] = useState(false)

  const handleSave = async (data: { name: string; contactPerson: string; contactPhone: string }) => {
    setLoading(true)
    try {
      const response = await fetch('/api/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        alert('公司信息保存成功')
        await refreshCompany()
      } else {
        const result = await response.json()
        alert(`保存失败: ${result.error}`)
      }
    } catch (error) {
      console.error('保存公司信息失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={logout} />

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">系统管理</h1>
              <p className="mt-1 text-sm text-gray-600">
                管理公司基本信息和系统设置
              </p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <SettingsForm
                  company={company}
                  onSave={handleSave}
                  loading={loading}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
