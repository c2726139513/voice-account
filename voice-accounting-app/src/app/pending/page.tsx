'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import BillCard from '@/components/BillCard'
import BillManager from '@/components/BillManager'
import PrintBill from '@/components/PrintBill'
import FilterBar from '@/components/FilterBar'
import { Bill, Customer } from '@prisma/client'

type BillWithInvoices = Bill & {
  customer: Customer
  invoices: any[]
}

export default function PendingPage() {
  const { user, logout, hasPermission } = useAuth()
  const [bills, setBills] = useState<BillWithInvoices[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    customerId: '',
    startDate: '',
    endDate: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [managingBill, setManagingBill] = useState<BillWithInvoices | null>(null)
  const [printingBill, setPrintingBill] = useState<BillWithInvoices | null>(null)

const fetchBills = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      // 只添加有值的筛选条件
      if (filters.customerId && filters.customerId.trim()) params.append('customerId', filters.customerId.trim())
      if (filters.startDate && filters.startDate.trim()) params.append('startDate', filters.startDate.trim())
      if (filters.endDate && filters.endDate.trim()) params.append('endDate', filters.endDate.trim())
      
      const response = await fetch(`/api/bills/list?status=PENDING&${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch pending bills')
      
      const data = await response.json()
      setBills(data.bills || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch (error) {
      console.error('Error fetching pending bills:', error)
      alert('获取待收账单失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
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
    fetchBills()
    fetchCustomers()
  }, [currentPage, filters])

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleCustomerDeleted = (deletedCustomerId: string) => {
    // If the deleted customer was selected in filters, clear the filter
    if (filters.customerId === deletedCustomerId) {
      setFilters(prev => ({ ...prev, customerId: '' }))
      setCurrentPage(1)
    }
    // Refresh customers list
    fetchCustomers()
  }

  const handleConfirmBill = async (billId: string) => {
    try {
      const response = await fetch(`/api/bills/${billId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'COMPLETED'
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(`账单"${data.bill.title}"已确认结账`)
        fetchBills()
      } else {
        alert(`操作失败: ${data.error}`)
      }
    } catch (error) {
      console.error('确认结账失败:', error)
      alert('操作失败，请重试')
    }
  }

  const handleDeleteBill = async (billId: string) => {
    try {
      const response = await fetch(`/api/bills/${billId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(data.message)
        fetchBills()
      } else {
        alert(`操作失败: ${data.error}`)
      }
    } catch (error) {
      console.error('删除账单失败:', error)
      alert('操作失败，请重试')
    }
  }

  const handleManageBill = (bill: BillWithInvoices) => {
    setManagingBill(bill)
  }

  const handleCloseManager = () => {
    setManagingBill(null)
    fetchBills()
  }

  const handlePrintBill = (bill: BillWithInvoices) => {
    setPrintingBill(bill)
  }

  const handleClosePrint = () => {
    setPrintingBill(null)
  }

  const calculateTotal = () => {
    return bills.reduce((sum, bill) => sum + bill.totalAmount, 0)
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
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">待结账单</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    管理待结账的账单表单，可以确认结账或管理账单内容
                  </p>
                </div>
                <div className="text-right w-full sm:w-auto">
                  <p className="text-sm text-gray-500">总计金额</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    ¥{calculateTotal().toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    共 {bills.length} 个账单表单
                  </p>
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

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {bills.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      暂无待结账单
                    </div>
                  ) : (
                    bills.map((bill) => (
                      <BillCard
                        key={bill.id}
                        bill={bill}
                        onConfirm={handleConfirmBill}
                        onManage={handleManageBill}
                        onDelete={hasPermission('pending-bill:delete') ? handleDeleteBill : undefined}
                        onPrint={handlePrintBill}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {managingBill && (
          <BillManager
            bill={managingBill}
            onClose={handleCloseManager}
            onUpdate={handleCloseManager}
          />
        )}

        {printingBill && (
          <PrintBill
            bill={printingBill}
            onClose={handleClosePrint}
          />
        )}
      </div>
    </div>
  )
}
