'use client'

import { useState, useEffect, useRef } from 'react'
import { Customer } from '@prisma/client'

interface CustomerInputProps {
  customers: Customer[]
  value: string
  onChange: (customerId: string, customerName: string) => void
  onNewCustomer?: (customerName: string) => void
  placeholder?: string
  error?: string
}

export default function CustomerInput({ 
  customers, 
  value, 
  onChange, 
  onNewCustomer, 
  placeholder = "输入或选择客户",
  error 
}: CustomerInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // 如果有选中的客户ID，设置对应的客户名称
    if (value && value !== '') {
      const customer = customers.find(c => c.id === value)
      if (customer) {
        setInputValue(customer.name)
      }
    } else {
      setInputValue('')
    }
  }, [value, customers])

  useEffect(() => {
    // 过滤客户列表
    if (inputValue === '') {
      setFilteredCustomers(customers.slice(0, 5)) // 显示前5个客户
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(inputValue.toLowerCase())
      )
      setFilteredCustomers(filtered.slice(0, 5))
    }
  }, [inputValue, customers])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setShowSuggestions(true)
    
    // 如果输入为空，清空选择
    if (newValue.trim() === '') {
      onChange('', '')
    } else {
      // 检查是否匹配现有客户
      const customer = customers.find(c => c.name.toLowerCase() === newValue.toLowerCase())
      if (customer) {
        onChange(customer.id, customer.name)
      } else {
        onChange('', newValue)
      }
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    setInputValue(customer.name)
    setShowSuggestions(false)
    onChange(customer.id, customer.name)
  }

  const handleCreateNewCustomer = () => {
    if (!inputValue.trim()) return
    
    setShowSuggestions(false)
    if (onNewCustomer) {
      onNewCustomer(inputValue)
    }
  }

  const handleInputFocus = () => {
    setShowSuggestions(true)
  }

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredCustomers.length > 0 ? (
            <>
              {filteredCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className={`px-3 py-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
                    index === 0 ? 'border-t' : ''
                  }`}
                >
                  <div>
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    {customer.phone && (
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    已有客户
                  </div>
                </div>
              ))}
            </>
          ) : null}
          
          {value && customers.find(c => c.id === value) && (
            <div className="px-3 py-2 text-sm text-gray-600">
              已选择: {customers.find(c => c.id === value)?.name}
            </div>
          )}
          
          {inputValue.trim() && !customers.find(c => c.name.toLowerCase() === inputValue.toLowerCase()) && (
            <div
              onClick={handleCreateNewCustomer}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-blue-600"
            >
              <div>
                <div className="font-medium">创建新客户: "{inputValue}"</div>
              </div>
              <div className="text-xs">
                新建 +
              </div>
            </div>
          )}
          
          {filteredCustomers.length === 0 && inputValue.trim() && !customers.find(c => c.name.toLowerCase().includes(inputValue.toLowerCase())) && (
            <div className="px-3 py-4 text-center text-gray-500 text-sm">
              没有找到匹配的客户
            </div>
          )}
        </div>
      )}
    </div>
  )
}