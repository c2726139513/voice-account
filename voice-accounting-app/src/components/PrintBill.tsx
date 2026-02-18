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
      // 动态导入 html2pdf.js 和 pdfjs-dist
      const html2pdfModule = await import('html2pdf.js')
      const html2pdf = html2pdfModule.default
      const pdfjsLib = await import('pdfjs-dist')
      const pdfjs = pdfjsLib.default

      // 配置 PDF 生成选项
      const opt = {
        margin: [10, 10, 10, 10], // 上、右、下、左边距（毫米）
        filename: `账单-${bill.title}-${formatDate(new Date())}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2, // 使用2倍缩放提高清晰度
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      }

      // 生成 PDF
      const pdf = await html2pdf().set(opt).from(printContent).output('blob')
      console.log('PDF 生成成功，大小:', pdf.size)

      // 创建 PDF URL
      const pdfUrl = URL.createObjectURL(pdf)
      console.log('PDF URL:', pdfUrl)

      // 关闭弹窗
      onClose()

      // 创建新窗口用于显示 PDF
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('请允许弹出窗口以进行打印')
        return
      }

      // 在新窗口中设置 PDF 查看器，使用 pdf.js 的打印功能
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>打印账单</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              width: 100%;
              height: 100%;
              overflow: hidden;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #f5f5f5;
            }
            #pdf-canvas {
              max-width: 100%;
              max-height: 100%;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            #loading {
              font-size: 16px;
              color: #666;
            }
            @media print {
              body {
                background: white;
              }
              #loading {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div id="loading">正在加载 PDF...</div>
          <canvas id="pdf-canvas"></canvas>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
          <script>
            const pdfUrl = '${pdfUrl}';
            const canvas = document.getElementById('pdf-canvas');
            const loading = document.getElementById('loading');

            pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            loadingTask.promise.then(function(pdf) {
              console.log('PDF 加载成功，页数:', pdf.numPages);

              const numPages = pdf.numPages;
              let currentPage = 1;
              let pages = [];

              // 预加载所有页面
              function loadAllPages() {
                const promises = [];
                for (let i = 1; i <= numPages; i++) {
                  promises.push(pdf.getPage(i));
                }
                return Promise.all(promises);
              }

              function renderPage(pageNumber) {
                const page = pages[pageNumber - 1];
                const viewport = page.getViewport({ scale: 1.5 });

                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                  canvasContext: context,
                  viewport: viewport
                };

                page.render(renderContext).promise.then(function() {
                  loading.style.display = 'none';

                  // 使用 pdf.js 的打印功能
                  setTimeout(function() {
                    // 创建隐藏的 iframe 用于打印
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    document.body.appendChild(iframe);

                    // 在 iframe 中加载 PDF
                    iframe.src = pdfUrl;

                    // 等待 iframe 加载完成后打印
                    iframe.onload = function() {
                      setTimeout(function() {
                        iframe.contentWindow.print();
                        // 打印完成后延迟 1000ms 关闭窗口
                        setTimeout(function() {
                          window.close();
                        }, 1000);
                      }, 500);
                    };
                  }, 500);
                });
              }

              loadAllPages().then(function(pagePromises) {
                pages = pagePromises;
                renderPage(currentPage);
              });
            }, function(reason) {
              console.error('PDF 加载失败:', reason);
              loading.textContent = 'PDF 加载失败: ' + reason;
            });
          </script>
        </body>
        </html>
      `)
      printWindow.document.close()

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
          <div id="print-content" style={{ width: '190mm', padding: '5mm', margin: '0 auto', background: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000000', paddingBottom: '20px' }}>
              {company?.name ? (
                <>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#000000' }}>{company.name}</div>
                  <div style={{ fontSize: '16px', color: '#333333' }}>
                    {company.contactPerson && `联系人：${company.contactPerson}`}
                    {company.contactPerson && company.contactPhone && '\u00A0\u00A0\u00A0\u00A0\u00A0'}
                    {company.contactPhone && `电话：${company.contactPhone}`}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#000000' }}>账单</div>
                  <div style={{ fontSize: '16px', color: '#333333' }}>{bill.title}</div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: '#000000' }}>
                <div><strong>客户：</strong>{bill.customer.name}</div>
                {bill.customer.phone && <div><strong>电话：</strong>{bill.customer.phone}</div>}
                {bill.customer.email && <div><strong>邮箱：</strong>{bill.customer.email}</div>}
              </div>
              <div style={{ fontSize: '14px', textAlign: 'right', color: '#000000' }}>
                <div><strong>创建时间：</strong>{formatDate(bill.createdAt)}</div>
                {bill.completedAt && (
                  <div><strong>结账时间：</strong>{formatDate(bill.completedAt)}</div>
                )}
                <div><strong>打印时间：</strong>{formatDate(new Date())}</div>
              </div>
            </div>

            {bill.invoices.length > 0 ? (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '11px', tableLayout: 'fixed', color: '#000000' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '12%', color: '#000000' }}>日期</th>
                      <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '38%', color: '#000000' }}>工作描述</th>
                      <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '10%', color: '#000000' }}>数量</th>
                      <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'right', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '20%', color: '#000000' }}>单价</th>
                      <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'right', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '20%', color: '#000000' }}>金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'left', wordWrap: 'break-word', color: '#000000' }}>{formatDate(invoice.workDate)}</td>
                        <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'left', wordWrap: 'break-word', color: '#000000' }}>{invoice.description}</td>
                        <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center', color: '#000000' }}>{invoice.quantity}</td>
                        <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'right', color: '#000000' }}>¥{invoice.unitPrice.toFixed(2)}</td>
                        <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'right', color: '#000000' }}>¥{invoice.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ textAlign: 'right', marginTop: '20px', fontSize: '16px', fontWeight: 'bold', clear: 'both', color: '#000000' }}>
                  <div>总计金额：¥{bill.totalAmount.toFixed(2)}</div>
                </div>

                {company?.printFooter && (
                  <div
                    style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #000000', fontSize: '14px', lineHeight: '1.6', color: '#000000' }}
                    dangerouslySetInnerHTML={{ __html: company.printFooter }}
                  />
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#333333' }}>
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
