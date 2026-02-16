'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const ReactSimpleWysiwyg = dynamic(() => import('react-simple-wysiwyg'), { ssr: false })

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容...',
  height = 200
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (e: any) => {
    onChange(e.target.value)
  }

  if (!mounted) {
    return (
      <div className="rich-text-editor" style={{ height: `${height}px` }}>
        <div className="border border-gray-300 rounded-md p-4 text-gray-500">
          加载编辑器...
        </div>
      </div>
    )
  }

  return (
    <div className="rich-text-editor">
      <ReactSimpleWysiwyg
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        containerProps={{ style: { height: `${height}px`, minHeight: `${height}px` } }}
      />
    </div>
  )
}
