'use client'

import { useState, useEffect } from 'react'
import { Customer, Invoice } from '@prisma/client'
import CustomerInput from './CustomerInput'

interface EditInvoiceFormProps {
  invoice: Invoice & { customer?: Customer | null, customerName?: string }
  customers: Customer[]
  onSubmit: (invoiceData: any) => void
  onCancel: () => void
  onCustomerCreated?: (customer: Customer) => void
}

export default function EditInvoiceForm({ 
  invoice, 
  customers, 
  onSubmit, 
  onCancel, 
  onCustomerCreated 
}: EditInvoiceFormProps) {
  const [formData, setFormData] = useState({
    customerId: invoice.customerId || '',
    customerName: invoice.customer?.name || invoice.customerName || '',
    description: invoice.description || '',
    quantity: invoice.quantity?.toString() || '',
    unitPrice: invoice.unitPrice?.toString() || '',
    totalPrice: invoice.totalPrice?.toString() || '',
    workDate: invoice.workDate ? new Date(invoice.workDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [creatingCustomer, setCreatingCustomer] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

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

    if (errors.customerId) {
      setErrors(prev => ({
        ...prev,
        customerId: ''
      }))
    }
  }

  const handleCreateCustomer = async (customerName: string) => {
    try {
      setCreatingCustomer(true)
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: customerName,
          phone: '',
          email: ''
        })
      })

      const data = await response.json()

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          customerId: data.customer.id,
          customerName: data.customer.name
        }))
        
        if (onCustomerCreated) {
          onCustomerCreated(data.customer)
        }
        
        alert(`客户"${customerName}"创建成功`)
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
      newErrors.customerId = '请选择或输入客户'
    }
    if (!formData.description.trim()) {
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
      const submitData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
        totalPrice: parseFloat(formData.totalPrice)
      }
      
      // 如果是临时账单（ID以temp-开头），则创建新账单
      if (invoice.id.startsWith('temp-')) {
        onSubmit({
          ...submitData,
          isNew: true
        })
      } else {
        onSubmit(submitData)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
        {invoice.id?.startsWith('temp-') ? '新建账单' : '编辑账单'}
      </h2>
        
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500">自动计算：单价 × 数量</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              更新
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}