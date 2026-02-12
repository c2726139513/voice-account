'use client'

import { useState, useEffect } from 'react'
import { Customer } from '@prisma/client'

interface ReportData {
  summary?: {
    totalInvoices: number
    totalAmount: number
    activeInvoices: number
    availableInvoices: number
    invoicesInBills: number
    totalBills: number
    pendingBills: number
    completedBills: number
  }
  customers?: Array<{
    id: string
    name: string
    phone: string
    email: string
    invoiceCount: number
    invoiceTotal: number
    billCount: number
    billTotal: number
    totalAmount: number
  }>
  monthlyData?: Array<{
    month: string
    invoiceCount: number
    totalAmount: number
  }>
  topItems?: Array<{
    description: string
    totalCount: number
    totalQuantity: number
    totalAmount: number
  }>
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'summary' | 'customer' | 'monthly' | 'top-items'>('summary')
  const [reportData, setReportData] = useState<ReportData>({})
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filters, setFilters] = useState({
    customerId: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchCustomers()
    fetchReportData()
  }, [reportType, filters])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      if (response.ok) {
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('获取客户列表失败:', error)
    }
  }

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: reportType,
        ...(filters.customerId && { customerId: filters.customerId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })

      const response = await fetch(`/api/reports?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setReportData(data)
      } else {
        console.error('获取报告数据失败:', data.error)
      }
    } catch (error) {
      console.error('获取报告数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `¥${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const exportToCSV = () => {
    let csvContent = ''
    
    if (reportType === 'customer' && reportData.customers) {
      csvContent = '客户名称,电话,邮箱,账单数量,账单金额,表单数量,表单金额,总金额\n'
      reportData.customers.forEach(customer => {
        csvContent += `${customer.name},${customer.phone},${customer.email},${customer.invoiceCount},${formatCurrency(customer.invoiceTotal)},${customer.billCount},${formatCurrency(customer.billTotal)},${formatCurrency(customer.totalAmount)}\n`
      })
    } else if (reportType === 'monthly' && reportData.monthlyData) {
      csvContent = '月份,账单数量,总金额\n'
      reportData.monthlyData.forEach(month => {
        csvContent += `${month.month},${month.invoiceCount},${formatCurrency(month.totalAmount)}\n`
      })
    } else if (reportType === 'top-items' && reportData.topItems) {
      csvContent = '项目描述,总次数,总数量,总金额\n'
      reportData.topItems.forEach(item => {
        csvContent += `${item.description},${item.totalCount},${item.totalQuantity},${formatCurrency(item.totalAmount)}\n`
      })
    }

    if (csvContent) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">数据分析报告</h1>
          <p className="mt-2 text-gray-600">查看和分析您的账单数据</p>
        </div>

        {/* 报告类型选择 */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">报告类型</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setReportType('summary')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  reportType === 'summary'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                总体统计
              </button>
              <button
                onClick={() => setReportType('customer')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  reportType === 'customer'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                客户分析
              </button>
              <button
                onClick={() => setReportType('monthly')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  reportType === 'monthly'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                月度趋势
              </button>
              <button
                onClick={() => setReportType('top-items')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  reportType === 'top-items'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                热门项目
              </button>
            </div>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">筛选条件</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  客户
                </label>
                <select
                  value={filters.customerId}
                  onChange={(e) => setFilters(prev => ({ ...prev, customerId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部客户</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始日期
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束日期
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 报告内容 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {reportType === 'summary' && '总体统计'}
              {reportType === 'customer' && '客户分析'}
              {reportType === 'monthly' && '月度趋势'}
              {reportType === 'top-items' && '热门项目'}
            </h2>
            {reportType !== 'summary' && (
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                导出CSV
              </button>
            )}
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">加载中...</p>
              </div>
            ) : (
              <>
                {reportType === 'summary' && reportData.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {reportData.summary.totalInvoices}
                      </div>
                      <div className="text-sm text-blue-800 mt-1">总账单数</div>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(reportData.summary.totalAmount)}
                      </div>
                      <div className="text-sm text-green-800 mt-1">总金额</div>
                    </div>
                    <div className="bg-yellow-50 p-6 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {reportData.summary.availableInvoices}
                      </div>
                      <div className="text-sm text-yellow-800 mt-1">可用账单</div>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {reportData.summary.pendingBills}
                      </div>
                      <div className="text-sm text-purple-800 mt-1">待结账单</div>
                    </div>
                  </div>
                )}

                {reportType === 'customer' && reportData.customers && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            客户名称
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            联系方式
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            账单数量
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            账单金额
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            总金额
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.customers.map((customer) => (
                          <tr key={customer.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {customer.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {customer.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {customer.invoiceCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(customer.invoiceTotal)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(customer.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {reportType === 'monthly' && reportData.monthlyData && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            月份
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            账单数量
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            总金额
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.monthlyData.map((month, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {month.month}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {month.invoiceCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(month.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {reportType === 'top-items' && reportData.topItems && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            项目描述
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            总次数
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            总数量
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            总金额
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.topItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.totalCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.totalQuantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(item.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}