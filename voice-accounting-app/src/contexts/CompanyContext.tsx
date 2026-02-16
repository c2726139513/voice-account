'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Company {
  id: string
  name: string | null
  contactPerson: string | null
  contactPhone: string | null
  printFooter: string | null
}

interface CompanyContextType {
  company: Company | null
  loading: boolean
  refreshCompany: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCompany = async () => {
    try {
      const response = await fetch('/api/company')
      if (response.ok) {
        const data = await response.json()
        setCompany(data.company)
      }
    } catch (error) {
      console.error('获取公司信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompany()
  }, [])

  const refreshCompany = async () => {
    await fetchCompany()
  }

  return (
    <CompanyContext.Provider value={{ company, loading, refreshCompany }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}
