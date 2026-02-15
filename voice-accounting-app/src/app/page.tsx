'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import VoiceInput from '@/components/VoiceInput'
import InvoiceList from '@/components/InvoiceList'
import ManualInvoiceForm from '@/components/ManualInvoiceForm'
import EditInvoiceForm from '@/components/EditInvoiceForm'
import FilterBar from '@/components/FilterBar'
import { Invoice, Customer } from '@prisma/client'
import { useAuth } from '@/contexts/AuthContext'
import { PERMISSIONS } from '@/lib/permissions'

type InvoiceWithCustomer = Invoice & {
  customer: Customer
}

export default function Home() {
  const { user, loading: authLoading, logout, hasPermission } = useAuth()
  const [invoices, setInvoices] = useState<InvoiceWithCustomer[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    customerId: '',
    startDate: '',
    endDate: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showManualForm, setShowManualForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithCustomer | null>(null)

  const fetchInvoices = async () => {
    if (!hasPermission(PERMISSIONS.INVOICE_READ)) return
    
    try {
      setLoading(true)
      
      // 构建查询参数，确保日期格式正确
      const searchParams = new URLSearchParams()
      searchParams.set('status', 'ACTIVE')
      searchParams.set('page', currentPage.toString())
      
      // 只添加非空的筛选条件
      if (filters.customerId) {
        searchParams.set('customerId', filters.customerId)
      }
      if (filters.startDate) {
        searchParams.set('startDate', filters.startDate)
      }
      if (filters.endDate) {
        searchParams.set('endDate', filters.endDate)
      }
      
      const response = await fetch(`/api/invoices/list?${searchParams}`)
      const data = await response.json()
      
      if (response.ok) {
        setInvoices(data.invoices)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('获取账单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    if (!hasPermission(PERMISSIONS.CUSTOMER_READ)) return
    
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      
      if (response.ok) {
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error('获取客户失败:', error)
    }
  }

  useEffect(() => {
    // 只有在认证加载完成后才获取数据
    if (!authLoading && hasPermission(PERMISSIONS.INVOICE_READ)) {
      fetchInvoices()
    }
    if (!authLoading && hasPermission(PERMISSIONS.CUSTOMER_READ)) {
      fetchCustomers()
    }
  }, [currentPage, filters, authLoading, hasPermission])

  const handleVoiceTranscript = async (transcript: string) => {
    if (!hasPermission(PERMISSIONS.INVOICE_CREATE)) {
      alert('您没有创建账单的权限')
      return
    }
    
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ voiceText: transcript })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // 将解析的数据设置为编辑状态，打开编辑框
        setEditingInvoice(data.invoice)
      } else {
        alert(`解析失败: ${data.error}`)
      }
    } catch (error) {
      console.error('语音解析失败:', error)
      alert('语音解析失败，请重试')
    }
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleCustomerDeleted = () => {
    // 重新获取客户列表
    fetchCustomers()
  }

  const handlePrepareBill = async (selectedIds: string[]) => {
    try {
      // 获取选中账单的信息以生成默认标题
      const invoicesResponse = await fetch(`/api/invoices/list?status=ACTIVE`)
      const invoicesData = await invoicesResponse.json()
      const selectedInvoices = invoicesData.invoices.filter((inv: any) => selectedIds.includes(inv.id))
      
      if (selectedInvoices.length === 0) {
        alert('请选择要准备结账的账单')
        return
      }

      // 检查是否所有账单都属于同一客户
      const customerIds = [...new Set(selectedInvoices.map((inv: any) => inv.customerId))]
      if (customerIds.length > 1) {
        alert('只能为同一客户的账单创建账单表单')
        return
      }

      const customerName = selectedInvoices[0].customer.name
      const defaultTitle = `${customerName}的账单 - ${new Date().toLocaleDateString('zh-CN')}`
      
      const title = prompt('请输入账单标题:', defaultTitle)
      if (!title) {
        return
      }

      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoiceIds: selectedIds,
          title
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(`账单表单"${data.bill.title}"创建成功，包含 ${data.bill.invoices.length} 条账单`)
        fetchInvoices()
      } else {
        alert(`创建失败: ${data.error}`)
      }
    } catch (error) {
      console.error('创建账单表单失败:', error)
      alert('操作失败，请重试')
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!hasPermission(PERMISSIONS.INVOICE_DELETE)) {
      alert('您没有删除账单的权限')
      return
    }
    
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert('账单删除成功')
        fetchInvoices()
      } else {
        alert(`删除失败: ${data.error}`)
      }
    } catch (error) {
      console.error('删除账单失败:', error)
      alert('删除失败，请重试')
    }
  }

  const handleManualSubmit = async (invoiceData: any) => {
    if (!hasPermission(PERMISSIONS.INVOICE_CREATE)) {
      alert('您没有创建账单的权限')
      return
    }
    
    try {
      const response = await fetch('/api/invoices/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert('账单创建成功！')
        setShowManualForm(false)
        fetchInvoices()
      } else {
        alert(`创建失败: ${data.error}`)
      }
    } catch (error) {
      console.error('手动创建账单失败:', error)
      alert('创建账单失败，请重试')
    }
  }

  const handleCustomerCreated = (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer])
  }

  const handleEditInvoice = (invoice: InvoiceWithCustomer) => {
    setEditingInvoice(invoice)
  }

  const handleCloseEdit = () => {
    setEditingInvoice(null)
  }

  const handleUpdateInvoice = async (invoiceData: any) => {
    const requiredPermission = invoiceData.isNew ? PERMISSIONS.INVOICE_CREATE : PERMISSIONS.INVOICE_UPDATE
    if (!hasPermission(requiredPermission)) {
      alert(`您没有${invoiceData.isNew ? '创建' : '更新'}账单的权限`)
      return
    }
    
    try {
      let response, data
      
      // 如果是临时账单，则创建新账单
      if (invoiceData.isNew) {
        response = await fetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            customerId: invoiceData.customerId,
            description: invoiceData.description,
            quantity: invoiceData.quantity,
            unitPrice: invoiceData.unitPrice,
            totalPrice: invoiceData.totalPrice,
            workDate: invoiceData.workDate
          })
        })
      } else {
        // 更新现有账单
        response = await fetch(`/api/invoices/${editingInvoice!.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(invoiceData)
        })
      }
      
      data = await response.json()
      
      if (response.ok) {
        alert(invoiceData.isNew ? '账单创建成功！' : '账单更新成功！')
        setEditingInvoice(null)
        fetchInvoices()
      } else {
        alert(`${invoiceData.isNew ? '创建' : '更新'}失败: ${data.error}`)
      }
    } catch (error) {
      console.error(`${invoiceData.isNew ? '创建' : '更新'}账单失败:`, error)
      alert(`${invoiceData.isNew ? '创建' : '更新'}账单失败，请重试`)
    }
  }

  const [hasUsers, setHasUsers] = useState<boolean | null>(null)
  const [checkingUsers, setCheckingUsers] = useState(true)

  // 检查系统是否有用户
  useEffect(() => {
    const checkIfUsersExist = async () => {
      try {
        const response = await fetch('/api/auth/check-users')
        const data = await response.json()
        if (response.ok) {
          setHasUsers(data.hasUsers)
        }
      } catch (error) {
        console.error('检查用户失败:', error)
      } finally {
        setCheckingUsers(false)
      }
    }

    checkIfUsersExist()
  }, [])

  if (authLoading || checkingUsers || hasUsers === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  // 如果没有用户，跳转到初始化页面
  if (!hasUsers) {
    if (typeof window !== 'undefined') {
      window.location.href = '/init-admin'
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">正在跳转到初始化页面...</div>
      </div>
    )
  }

  // 如果有用户但未登录，跳转到登录页
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

  // 确保user存在才渲染
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载用户信息...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <Navigation user={user} onLogout={logout} />

      <div className="py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">总账单</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    使用语音输入或手动录入记录账单信息
                  </p>
                </div>
                <div className="flex space-x-2 w-full sm:w-auto">
                  <VoiceInput onTranscript={handleVoiceTranscript} />
                  <button
                    onClick={() => setShowManualForm(true)}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 min-h-[44px]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="hidden sm:inline">手动录入</span>
                    <span className="sm:hidden">录入</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <FilterBar
                  customers={customers}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onCustomerDeleted={handleCustomerDeleted}
                />
              </div>

              <InvoiceList
                invoices={invoices}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onPrepareBill={handlePrepareBill}
                onDeleteInvoice={hasPermission(PERMISSIONS.INVOICE_DELETE) ? handleDeleteInvoice : undefined}
                onEditInvoice={handleEditInvoice}
              />
            </div>
          </div>
        </div>
      </div>

      {showManualForm && (
        <ManualInvoiceForm
          customers={customers}
          onSubmit={handleManualSubmit}
          onCancel={() => setShowManualForm(false)}
          onCustomerCreated={handleCustomerCreated}
        />
      )}

      {editingInvoice && (
        <EditInvoiceForm
          invoice={editingInvoice}
          customers={customers}
          onSubmit={handleUpdateInvoice}
          onCancel={handleCloseEdit}
          onCustomerCreated={handleCustomerCreated}
        />
      )}
    </div>
  )
}