'use client'

import { Bill, Customer, Invoice } from '@prisma/client'

type BillWithInvoices = Bill & {
  customer: Customer
  invoices: (Invoice & {
    customer: Customer
  })[]
}

interface PrintBillProps {
  bill: BillWithInvoices
  onClose: () => void
}

export default function PrintBill({ bill, onClose }: PrintBillProps) {
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

  const handlePrint = () => {
    const printContent = document.getElementById('print-content')
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('无法打开打印窗口，请检查浏览器设置')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>账单打印 - ${bill.title}</title>
          <style>
            body {
              font-family: 'Microsoft YaHei', Arial, sans-serif;
              margin: 0;
              padding: 20px;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .customer-info, .date-info {
              font-size: 14px;
            }
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .invoice-table th,
            .invoice-table td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            .invoice-table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .invoice-table .text-right {
              text-align: right;
            }
            .total-section {
              text-align: right;
              margin-top: 20px;
              font-size: 18px;
              font-weight: bold;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">打印账单</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div id="print-content">
            {/* 打印内容 */}
            <div className="header">
              <div className="title">账单</div>
              <div className="subtitle">{bill.title}</div>
            </div>

            <div className="info">
              <div className="customer-info">
                <div><strong>客户：</strong>{bill.customer.name}</div>
                {bill.customer.phone && <div><strong>电话：</strong>{bill.customer.phone}</div>}
                {bill.customer.email && <div><strong>邮箱：</strong>{bill.customer.email}</div>}
              </div>
              <div className="date-info">
                <div><strong>创建时间：</strong>{formatDateTime(bill.createdAt)}</div>
                {bill.completedAt && (
                  <div><strong>结账时间：</strong>{formatDateTime(bill.completedAt)}</div>
                )}
                <div><strong>打印时间：</strong>{formatDateTime(new Date())}</div>
              </div>
            </div>

            {bill.invoices.length > 0 ? (
              <>
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>工作描述</th>
                      <th>数量</th>
                      <th>单价</th>
                      <th>金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{formatDate(invoice.workDate)}</td>
                        <td>{invoice.description}</td>
                        <td>{invoice.quantity}</td>
                        <td>¥{invoice.unitPrice.toFixed(2)}</td>
                        <td className="text-right">¥{invoice.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="total-section">
                  <div>总计金额：¥{bill.totalAmount.toFixed(2)}</div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                此账单暂无明细项目
              </div>
            )}

            <div className="footer">
              <div>语音记账系统 - 账单打印</div>
              <div>此账单由系统自动生成</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            打印账单
          </button>
        </div>
      </div>
    </div>
  )
}