'use client'

import { useState } from 'react'
import { Customer } from '@prisma/client'
import CustomerInput from './CustomerInput'

interface ManualInvoiceFormProps {
  customers: Customer[]
  onSubmit: (invoiceData: any) => void
  onCancel: () => void
  onCustomerCreated?: (customer: Customer) => void
}

export default function ManualInvoiceForm({ customers, onSubmit, onCancel, onCustomerCreated }: ManualInvoiceFormProps) {
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    description: '',
    quantity: '',
    unitPrice: '',
    totalPrice: '',
    workDate: new Date().toISOString().split('T')[0]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [creatingCustomer, setCreatingCustomer] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleCustomerChange = (customerId: string, customerName: string) => {
    setFormData(prev => ({
      ...prev,
      customerId,
      customerName
    }))

    // 清除客户相关错误
    if (errors.customerId) {
      setErrors(prev => ({
        ...prev,
        customerId: ''
      }))
    }
  }

  const handleCreateCustomer = async (customerName: string) => {
    setCreatingCustomer(true)
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: customerName })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(`客户"${customerName}"创建成功`)
        if (onCustomerCreated) {
          onCustomerCreated(data.customer)
        }
        // 自动选择新创建的客户
        setFormData(prev => ({
          ...prev,
          customerId: data.customer.id,
          customerName: data.customer.name
        }))
      } else {
        alert(`创建客户失败: ${data.error}`)
      }
    } catch (error) {
      console.error('创建客户失败:', error)
      alert('创建客户失败，请重试')
    } finally {
      setCreatingCustomer(false)
    }
  }

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0
    const unitPrice = parseFloat(formData.unitPrice) || 0
    const total = quantity * unitPrice
    
    setFormData(prev => ({
      ...prev,
      totalPrice: total.toString()
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.customerId) {
      newErrors.customerId = '请选择或创建客户'
    }
    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = '请输入工作描述'
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = '请输入有效的数量'
    }
    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
      newErrors.unitPrice = '请输入有效的单价'
    }
    if (!formData.workDate) {
      newErrors.workDate = '请选择工作日期'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">手动录入账单</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="workDate" className="block text-sm font-medium text-gray-700 mb-1">
              工作日期 *
            </label>
            <input
              type="date"
              id="workDate"
              name="workDate"
              value={formData.workDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                errors.workDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.workDate && (
              <p className="mt-1 text-sm text-red-600">{errors.workDate}</p>
            )}
          </div>

          <div>
            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
              客户 *
            </label>
            <CustomerInput
              customers={customers}
              value={formData.customerId}
              onChange={handleCustomerChange}
              onNewCustomer={handleCreateCustomer}
              placeholder="输入客户名称或选择已有客户"
              error={errors.customerId}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              工作描述 *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="请描述所做的工作..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                数量 *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                onBlur={calculateTotal}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 mb-1">
                单价 (元) *
              </label>
              <input
                type="number"
                id="unitPrice"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                onBlur={calculateTotal}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                  errors.unitPrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.unitPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="totalPrice" className="block text-sm font-medium text-gray-700 mb-1">
              总价 (元)
            </label>
            <input
              type="number"
              id="totalPrice"
              name="totalPrice"
              value={formData.totalPrice}
              readOnly
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 min-h-[44px]"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500">自动计算：单价 × 数量</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={creatingCustomer}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {creatingCustomer ? '创建中...' : '创建账单'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}