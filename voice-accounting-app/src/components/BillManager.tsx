'use client'

import { useState, useEffect } from 'react'
import { Bill, Customer, Invoice } from '@prisma/client'

type BillWithInvoices = Bill & {
  customer: Customer
  invoices: (Invoice & {
    customer: Customer
  })[]
}

type InvoiceWithCustomer = Invoice & {
  customer: Customer
}

interface BillManagerProps {
  bill: BillWithInvoices
  onClose: () => void
  onUpdate: () => void
}

export default function BillManager({ bill, onClose, onUpdate }: BillManagerProps) {
  const [availableInvoices, setAvailableInvoices] = useState<InvoiceWithCustomer[]>([])
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'remove' | 'add' | 'edit'>('remove')
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithCustomer | null>(null)
  const [editForm, setEditForm] = useState({
    description: '',
    quantity: '',
    unitPrice: '',
    workDate: ''
  })

  useEffect(() => {
    fetchAvailableInvoices()
  }, [])

  const fetchAvailableInvoices = async () => {
    try {
      // 获取所有可用账单，不分页
      const response = await fetch('/api/invoices/list?status=ACTIVE&limit=1000')
      const data = await response.json()
      
      if (response.ok) {
        // 只显示同一客户的可用账单
        const customerInvoices = data.invoices.filter(
          (invoice: InvoiceWithCustomer) => invoice.customerId === bill.customerId
        )
        setAvailableInvoices(customerInvoices)
        console.log('获取到可用账单:', customerInvoices.length, '条')
      } else {
        console.error('API错误:', data.error)
      }
    } catch (error) {
      console.error('获取可用账单失败:', error)
    }
  }

  const handleRemoveInvoices = async () => {
    if (selectedInvoices.length === 0) {
      alert('请选择要移除的账单')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/bills/${bill.id}/invoices`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoiceIds: selectedInvoices
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`已移除 ${data.updatedCount} 条账单`)
        setSelectedInvoices([])
        onUpdate()
        onClose()
      } else {
        alert(`操作失败: ${data.error}`)
      }
    } catch (error) {
      console.error('移除账单失败:', error)
      alert('操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleAddInvoices = async () => {
    if (selectedInvoices.length === 0) {
      alert('请选择要添加的账单')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/bills/${bill.id}/invoices`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          invoiceIds: selectedInvoices
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`已添加 ${data.updatedCount} 条账单`)
        setSelectedInvoices([])
        onUpdate()
        onClose()
      } else {
        alert(`操作失败: ${data.error}`)
      }
    } catch (error) {
      console.error('添加账单失败:', error)
      alert('操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleEditInvoice = (invoice: InvoiceWithCustomer) => {
    setEditingInvoice(invoice)
    setEditForm({
      description: invoice.description,
      quantity: invoice.quantity.toString(),
      unitPrice: invoice.unitPrice.toString(),
      workDate: new Date(invoice.workDate).toISOString().split('T')[0]
    })
    setActiveTab('edit')
  }

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return

    try {
      setLoading(true)
      const response = await fetch(`/api/invoices/${editingInvoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: editForm.description,
          quantity: parseFloat(editForm.quantity),
          unitPrice: parseFloat(editForm.unitPrice),
          workDate: editForm.workDate
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('账单更新成功')
        setEditingInvoice(null)
        onUpdate()
        onClose()
      } else {
        alert(`更新失败: ${data.error}`)
      }
    } catch (error) {
      console.error('更新账单失败:', error)
      alert('更新失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const invoiceIds = activeTab === 'remove' 
        ? (bill.invoices || []).map(inv => inv.id)
        : (availableInvoices || []).map(inv => inv.id)
      setSelectedInvoices(invoiceIds)
    } else {
      setSelectedInvoices([])
    }
  }

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    )
  }

  const currentInvoices = activeTab === 'remove' ? (bill.invoices || []) : (availableInvoices || [])
  const isAllSelected = currentInvoices.length > 0 && selectedInvoices.length === currentInvoices.length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">管理账单表单</h2>
              <p className="text-sm text-gray-600 mt-1">
                表单：{bill.title} | 客户：{bill.customer?.name || '未知客户'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab('remove')
                setSelectedInvoices([])
              }}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'remove'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              移除账单 ({(bill.invoices || []).length})
            </button>
            <button
              onClick={() => {
                setActiveTab('add')
                setSelectedInvoices([])
              }}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'add'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              添加账单 ({(availableInvoices || []).length})
            </button>
            <button
              onClick={() => {
                setActiveTab('edit')
                setSelectedInvoices([])
              }}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'edit'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              编辑账单
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'remove' ? (
            <div>
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  选择要从此表单中移除的账单，移除后将回到总账单中
                </p>
              </div>
              
              {(bill.invoices || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  此表单中暂无账单
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-4 mb-4">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">全选</span>
                  </div>
                  
                  {(bill.invoices || []).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={() => handleSelectInvoice(invoice.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(invoice.workDate)} | {invoice.quantity} × ¥{invoice.unitPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-gray-900">
                          ¥{invoice.totalPrice.toFixed(2)}
                        </div>
                        <button
                          onClick={() => handleEditInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          编辑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'add' ? (
            <div>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  选择要添加到此表单中的账单（仅显示同一客户的可用账单）
                </p>
              </div>
              
              {(availableInvoices || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无可添加的账单
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-4 mb-4">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">全选</span>
                  </div>
                  
                  {(availableInvoices || []).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={() => handleSelectInvoice(invoice.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(invoice.workDate)} | {invoice.quantity} × ¥{invoice.unitPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-gray-900">
                          ¥{invoice.totalPrice.toFixed(2)}
                        </div>
                        <button
                          onClick={() => handleEditInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          编辑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {editingInvoice ? (
                <div className="space-y-4">
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      编辑账单信息
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      描述
                    </label>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        数量
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        单价
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.unitPrice}
                        onChange={(e) => setEditForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      工作日期
                    </label>
                    <input
                      type="date"
                      value={editForm.workDate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, workDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      总价: ¥{(parseFloat(editForm.quantity || '0') * parseFloat(editForm.unitPrice || '0')).toFixed(2)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  请从"移除账单"标签页中选择要编辑的账单
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          {activeTab === 'edit' && editingInvoice && (
            <button
              onClick={handleUpdateInvoice}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '更新中...' : '保存更改'}
            </button>
          )}
          {activeTab !== 'edit' && (
            <button
              onClick={activeTab === 'remove' ? handleRemoveInvoices : handleAddInvoices}
              disabled={loading || selectedInvoices.length === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '处理中...' : (activeTab === 'remove' ? '移除选中' : '添加选中')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}