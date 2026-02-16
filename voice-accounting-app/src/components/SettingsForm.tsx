'use client'

import { useState, useEffect } from 'react'
import RichTextEditor from './RichTextEditor'

interface Company {
  id: string
  name: string | null
  contactPerson: string | null
  contactPhone: string | null
  printFooter: string | null
}

interface SettingsFormProps {
  company: Company | null
  onSave: (data: { name: string; contactPerson: string; contactPhone: string; printFooter: string }) => void
  loading: boolean
}

export default function SettingsForm({ company, onSave, loading }: SettingsFormProps) {
  const [name, setName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [printFooter, setPrintFooter] = useState('')

  useEffect(() => {
    if (company) {
      setName(company.name || '')
      setContactPerson(company.contactPerson || '')
      setContactPhone(company.contactPhone || '')
      setPrintFooter(company.printFooter || '')
    }
  }, [company])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      contactPhone: contactPhone.trim(),
      printFooter
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">公司信息</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              公司名称
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              placeholder="请输入公司名称"
            />
          </div>

          <div>
            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
              联系人
            </label>
            <input
              type="text"
              id="contactPerson"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              placeholder="请输入联系人姓名"
            />
          </div>

          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
              联系电话
            </label>
            <input
              type="tel"
              id="contactPhone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              placeholder="请输入联系电话"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">打印设置</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="printFooter" className="block text-sm font-medium text-gray-700 mb-2">
              打印可选项
            </label>
            <p className="text-sm text-gray-500 mb-2">
              此内容将在打印账单时显示在账单表格下方。支持文字、图片、链接等富文本格式。
            </p>
            <div className="mb-4">
              <RichTextEditor
                value={printFooter}
                onChange={setPrintFooter}
                placeholder="请输入打印时显示的额外信息，如：注意事项、联系方式、网址等..."
                height={200}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}
