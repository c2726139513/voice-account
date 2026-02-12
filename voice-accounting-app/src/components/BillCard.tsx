'use client'

import { useState, useEffect } from 'react'
import { Bill, Customer, Invoice } from '@prisma/client'

type BillWithInvoices = Bill & {
  customer: Customer
  invoices: (Invoice & {
    customer: Customer
  })[]
  completedAt?: Date | null
}

interface BillCardProps {
  bill: BillWithInvoices
  onConfirm?: (billId: string) => void
  onManage?: (bill: BillWithInvoices) => void
  onDelete?: (billId: string) => void
  onRevert?: (billId: string) => void
  onPrint?: (bill: BillWithInvoices) => void
  showActions?: boolean
}

export default function BillCard({ bill, onConfirm, onManage, onDelete, onRevert, onPrint, showActions = true }: BillCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{bill.title}</h3>
            <p className="text-sm text-gray-600 mt-1">客户：{bill.customer.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              创建时间：{formatDateTime(bill.createdAt)}
            </p>
            {bill.completedAt && (
              <p className="text-xs text-green-600 mt-1">
                结账时间：{formatDateTime(bill.completedAt)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">账单金额</p>
            <p className="text-2xl font-bold text-blue-600">
              ¥{bill.totalAmount.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              包含 {bill.invoices.length} 条记录
            </p>
          </div>
        </div>

        {/* 账单条目列表 */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">账单明细</h4>
          <div className="space-y-2">
            {bill.invoices.map((invoice) => (
              <div key={invoice.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {formatDate(invoice.workDate)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {invoice.description}
                    </span>
                    <span className="text-sm text-gray-600">
                      {invoice.quantity} × ¥{invoice.unitPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  ¥{invoice.totalPrice.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

{/* 操作按钮 */}
        {showActions && (
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            {bill.status === 'PENDING' && onManage && (
              <button
                onClick={() => onManage(bill)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                管理账单
              </button>
            )}
            {bill.status === 'PENDING' && onDelete && (
              <button
                onClick={() => {
                  if (confirm(`确定要删除账单"${bill.title}"吗？\n里面的${bill.invoices.length}条明细将退回总账单。`)) {
                    onDelete(bill.id)
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                删除账单
              </button>
            )}
            {bill.status === 'PENDING' && onConfirm && (
              <button
                onClick={() => onConfirm(bill.id)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                确认结账
              </button>
            )}
            {bill.status === 'PENDING' && onPrint && (
              <button
                onClick={() => onPrint(bill)}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
              >
                打印账单
              </button>
            )}
            {bill.status === 'COMPLETED' && onRevert && (
              <button
                onClick={() => {
                  if (confirm(`确定要将账单"${bill.title}"退回到未结状态吗？`)) {
                    onRevert(bill.id)
                  }
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
              >
                退回未结
              </button>
            )}
            {bill.status === 'COMPLETED' && onPrint && (
              <button
                onClick={() => onPrint(bill)}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
              >
                打印账单
              </button>
            )}
            {bill.status === 'COMPLETED' && !onRevert && !onPrint && (
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-md">
                已结账
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}