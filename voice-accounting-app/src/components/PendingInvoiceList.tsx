'use client'

import { useState } from 'react'
import { Invoice, Customer } from '@prisma/client'

type InvoiceWithCustomer = Invoice & {
  customer: Customer
}

interface PendingInvoiceListProps {
  invoices: InvoiceWithCustomer[]
  loading: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onReturnSelected: (selectedIds: string[]) => void
  onConfirmPayment: (selectedIds: string[]) => void
}

export default function PendingInvoiceList({
  invoices,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onReturnSelected,
  onConfirmPayment
}: PendingInvoiceListProps) {
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

  const handleReturnSelected = (invoiceIds?: string[]) => {
    const idsToReturn = invoiceIds || selectedInvoices
    
    if (idsToReturn.length === 0) {
      alert('请选择要回退的账单')
      return
    }
    
    onReturnSelected(idsToReturn)
    if (!invoiceIds) {
      setSelectedInvoices([])
    }
  }

  const handleConfirmPayment = (invoiceIds?: string[]) => {
    const idsToConfirm = invoiceIds || selectedInvoices
    
    if (idsToConfirm.length === 0) {
      alert('请选择要确认结账的账单')
      return
    }
    
    onConfirmPayment(idsToConfirm)
    if (!invoiceIds) {
      setSelectedInvoices([])
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

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
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
          <span className="text-blue-700">
            已选择 {selectedInvoices.length} 条账单
          </span>
          <div className="space-x-2">
            <button
              onClick={() => handleReturnSelected()}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              回退到总账单
            </button>
            <button
              onClick={() => handleConfirmPayment()}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              确认结账
            </button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
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
                  ¥{invoice.unitPrice.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ¥{invoice.totalPrice.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleReturnSelected([invoice.id])}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      回退
                    </button>
                    <button
                      onClick={() => handleConfirmPayment([invoice.id])}
                      className="text-green-600 hover:text-green-900"
                    >
                      确认结账
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {invoices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            暂无待结账单
          </div>
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-2 border rounded-md text-sm font-medium ${
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
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </nav>
        </div>
      )}
    </div>
  )
}