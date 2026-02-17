'use client'

import { Bill, Customer, Invoice } from '@prisma/client'
import { useCompany } from '@/contexts/CompanyContext'
import { useState, useEffect } from 'react'

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
  const { company } = useCompany()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const handlePrint = async () => {
    const printContent = document.getElementById('print-content')
    if (!printContent) return

    try {
      // 动态导入 html2pdf.js
      const html2pdfModule = await import('html2pdf.js')
      const html2pdf = html2pdfModule.default

      // 配置 PDF 生成选项
      const opt = {
        margin: [15, 15, 15, 15], // 上、右、下、左边距（毫米）
        filename: `账单-${bill.title}-${formatDate(new Date())}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2, // 提高清晰度
          useCORS: true,
          logging: false,
          letterRendering: true,
          width: 180 * 2, // 180mm * 2 (scale)
          windowWidth: 180 * 2
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      }

      // 生成 PDF
      await html2pdf().set(opt).from(printContent).save()

      // 关闭弹窗
      onClose()
    } catch (error) {
      console.error('生成 PDF 失败:', error)
      alert('生成 PDF 失败，请重试')
    }
  }

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="p-6 flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    )
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
          <div id="print-content" style={{ width: '180mm', minHeight: '297mm', padding: '10mm', margin: '0 auto', background: 'white', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
              {company?.name ? (
                <>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>{company.name}</div>
                  <div style={{ fontSize: '16px', color: '#666' }}>
                    {company.contactPerson && `联系人：${company.contactPerson}`}
                    {company.contactPerson && company.contactPhone && '\u00A0\u00A0\u00A0\u00A0\u00A0'}
                    {company.contactPhone && `电话：${company.contactPhone}`}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>账单</div>
                  <div style={{ fontSize: '16px', color: '#666' }}>{bill.title}</div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px' }}>
                <div><strong>客户：</strong>{bill.customer.name}</div>
                {bill.customer.phone && <div><strong>电话：</strong>{bill.customer.phone}</div>}
                {bill.customer.email && <div><strong>邮箱：</strong>{bill.customer.email}</div>}
              </div>
              <div style={{ fontSize: '14px', textAlign: 'right' }}>
                <div><strong>创建时间：</strong>{formatDate(bill.createdAt)}</div>
                {bill.completedAt && (
                  <div><strong>结账时间：</strong>{formatDate(bill.completedAt)}</div>
                )}
                <div><strong>打印时间：</strong>{formatDate(new Date())}</div>
              </div>
            </div>

            {bill.invoices.length > 0 ? (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '11px', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '15%' }}>日期</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '35%' }}>工作描述</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '10%' }}>数量</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '20%' }}>单价</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '20%' }}>金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', wordWrap: 'break-word' }}>{formatDate(invoice.workDate)}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', wordWrap: 'break-word' }}>{invoice.description}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{invoice.quantity}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>¥{invoice.unitPrice.toFixed(2)}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>¥{invoice.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ textAlign: 'right', marginTop: '20px', fontSize: '16px', fontWeight: 'bold', clear: 'both' }}>
                  <div>总计金额：¥{bill.totalAmount.toFixed(2)}</div>
                </div>

                {company?.printFooter && (
                  <div
                    style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ddd', fontSize: '14px', lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ __html: company.printFooter }}
                  />
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                此账单暂无明细项目
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
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
            生成 PDF 并打印
          </button>
        </div>
      </div>
    </div>
  )
}
