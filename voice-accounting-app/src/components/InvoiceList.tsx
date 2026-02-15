'use client'

import { useState } from 'react'
import { Invoice, Customer } from '@prisma/client'

type InvoiceWithCustomer = Invoice & {
  customer: Customer
}

interface InvoiceListProps {
  invoices: InvoiceWithCustomer[]
  loading: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onPrepareBill: (selectedIds: string[]) => void
  onDeleteInvoice?: (invoiceId: string) => void
  onEditInvoice: (invoice: InvoiceWithCustomer) => void
}

export default function InvoiceList({
  invoices,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onPrepareBill,
  onDeleteInvoice,
  onEditInvoice
}: InvoiceListProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedInvoices(invoices.map(invoice => invoice.id))
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

  const handlePrepareBill = () => {
    if (selectedInvoices.length === 0) {
      alert('请选择要准备结账的账单')
      return
    }
    
    onPrepareBill(selectedInvoices)
    setSelectedInvoices([])
  }

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm('确定要删除这条账单吗？此操作不可恢复。')) {
      onDeleteInvoice?.(invoiceId)
    }
  }

  const handleEditInvoice = (invoice: InvoiceWithCustomer) => {
    onEditInvoice(invoice)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const InvoiceCard = ({ invoice }: { invoice: InvoiceWithCustomer }) => (
    <div
      className={`bg-white border rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        selectedInvoices.includes(invoice.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
      onClick={() => handleSelectInvoice(invoice.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <input
            type="checkbox"
            checked={selectedInvoices.includes(invoice.id)}
            onChange={(e) => {
              e.stopPropagation()
              handleSelectInvoice(invoice.id)
            }}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-900">
                {invoice.customer.name}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(invoice.workDate)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {invoice.description}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>数量: {invoice.quantity}</span>
              <span>单价: ¥{invoice.unitPrice?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
        <div className="text-right ml-3">
          <p className="text-lg font-bold text-blue-600">
            ¥{invoice.totalPrice?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleEditInvoice(invoice)
          }}
          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          编辑
        </button>
        {onDeleteInvoice && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteInvoice(invoice.id)
            }}
            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            删除
          </button>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div>
      {selectedInvoices.length > 0 && (
        <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <span className="text-blue-700 text-sm sm:text-base">
            已选择 {selectedInvoices.length} 条账单
          </span>
          <button
            onClick={handlePrepareBill}
            className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm sm:text-base min-h-[44px]"
          >
            准备结账
          </button>
        </div>
      )}

      <div className="overflow-x-auto hidden sm:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                日期
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                客户
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                描述
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                数量
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                单价
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                总价
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={() => handleSelectInvoice(invoice.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(invoice.workDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {invoice.customer.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {invoice.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {invoice.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ¥{invoice.unitPrice ? invoice.unitPrice.toFixed(2) : '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ¥{invoice.totalPrice ? invoice.totalPrice.toFixed(2) : '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEditInvoice(invoice)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    编辑
                  </button>
                  {onDeleteInvoice && (
                    <button
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            暂无账单记录
          </div>
        )}
      </div>

      <div className="sm:hidden">
        {invoices.length > 0 && (
          <div className="mb-3 flex items-center justify-between px-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">全选</span>
            </label>
            <span className="text-xs text-gray-500">
              已选 {selectedInvoices.length} / {invoices.length}
            </span>
          </div>
        )}
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无账单记录
          </div>
        ) : (
          invoices.map((invoice) => <InvoiceCard key={invoice.id} invoice={invoice} />)
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
            >
              上一页
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-2 border rounded-md text-sm font-medium min-h-[44px] min-w-[44px] ${
                  currentPage === page
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
            >
              下一页
            </button>
          </nav>
        </div>
      )}
    </div>
  )
}