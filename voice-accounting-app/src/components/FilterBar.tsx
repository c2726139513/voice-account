'use client'

import { useState, useRef, useEffect } from 'react'
import { Customer } from '@prisma/client'

interface FilterBarProps {
  customers: Customer[]
  filters: {
    customerId: string
    startDate: string
    endDate: string
  }
  onFilterChange: (filters: {
    customerId: string
    startDate: string
    endDate: string
  }) => void
  onCustomerDeleted?: (deletedCustomerId: string) => void
}

export default function FilterBar({ customers, filters, onFilterChange, onCustomerDeleted }: FilterBarProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleCustomerChange = (customerId: string) => {
    onFilterChange({
      ...filters,
      customerId
    })
    setShowDropdown(false)
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      startDate: e.target.value
    })
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      endDate: e.target.value
    })
  }

  const handleClearFilters = () => {
    onFilterChange({
      customerId: '',
      startDate: '',
      endDate: ''
    })
  }

  const handleDeleteCustomer = async (e: React.MouseEvent, customerId: string) => {
    e.stopPropagation()
    
    // 先检查客户是否有账单
    try {
      const response = await fetch(`/api/customers/${customerId}/check-invoices`)
      const data = await response.json()
      
      if (response.ok) {
        if (data.hasInvoices) {
          alert(`无法删除客户：该客户有 ${data.invoiceCount} 张账单记录`)
          return
        }
      } else {
        alert('检查客户账单失败')
        return
      }
    } catch (error) {
      console.error('检查客户账单失败:', error)
      alert('检查客户账单失败')
      return
    }

    // 确认删除
    if (!confirm('确定要删除这个客户吗？')) {
      return
    }

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert('客户删除成功')
        // 如果删除的是当前筛选的客户，清空筛选
        if (filters.customerId === customerId) {
          onFilterChange({
            ...filters,
            customerId: ''
          })
        }
        // 通知父组件刷新客户列表
        if (onCustomerDeleted) {
          onCustomerDeleted(customerId)
        }
      } else {
        alert(`删除客户失败: ${data.error}`)
      }
    } catch (error) {
      console.error('删除客户失败:', error)
      alert('删除客户失败，请重试')
    }
  }

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 过滤客户
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 获取当前选中的客户名称
  const selectedCustomer = customers.find(c => c.id === filters.customerId)

  return (
    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
      <div className="sm:hidden mb-3">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md flex items-center justify-between text-gray-700 hover:bg-gray-50 min-h-[44px]"
        >
          <span className="font-medium">筛选条件</span>
          <svg
            className={`w-5 h-5 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 ${showMobileFilters ? 'block' : 'hidden md:grid'}`}>
        <div>
          <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
            客户
          </label>
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white flex justify-between items-center min-h-[44px]"
            >
              <span className={selectedCustomer ? 'text-gray-900' : 'text-gray-500'}>
                {selectedCustomer ? selectedCustomer.name : '所有客户'}
              </span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div
                  onClick={() => handleCustomerChange('')}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 border-b"
                >
                  所有客户
                </div>
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => handleCustomerChange(customer.id)}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center group"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      {customer.phone && (
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteCustomer(e, customer.id)}
                      className="ml-2 p-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="删除客户"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                {filteredCustomers.length === 0 && (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    没有找到匹配的客户
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            开始日期
          </label>
          <input
            type="date"
            id="startDate"
            value={filters.startDate}
            onChange={handleStartDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            结束日期
          </label>
          <input
            type="date"
            id="endDate"
            value={filters.endDate}
            onChange={handleEndDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleClearFilters}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors min-h-[44px]"
          >
            清除筛选
          </button>
        </div>
      </div>
    </div>
  )
}