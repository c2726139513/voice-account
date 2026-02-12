'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface VoiceInputProps {
  onTranscript: (transcript: string) => void
}

export default function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [isHttps, setIsHttps] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null)
  const [lastSpeechTime, setLastSpeechTime] = useState<number>(Date.now())
  const [showFloatingPanel, setShowFloatingPanel] = useState(false)
  
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 清除静音计时器
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimer) {
      clearTimeout(silenceTimer)
      setSilenceTimer(null)
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
  }, [silenceTimer])

  // 设置静音检测计时器
  const setSilenceDetection = useCallback(() => {
    clearSilenceTimer()
    
    // 如果3秒内没有新的语音输入，自动停止录音
    const timer = setTimeout(() => {
      if (isRecording) {
        console.log('检测到静音，自动停止录音')
        stopRecording()
      }
    }, 3000)
    
    setSilenceTimer(timer)
    silenceTimeoutRef.current = timer
  }, [isRecording, clearSilenceTimer])

  useEffect(() => {
    // 检查是否为HTTPS环境
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol
      setIsHttps(protocol === 'https:' || protocol === 'file:')
      
      if (!isHttps) {
        setErrorMessage('语音识别需要HTTPS环境，请使用 https://192.168.2.28:3000 访问')
      }
    }

    // 检查浏览器支持
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        setIsSupported(false)
      }
    }

    // 清理计时器
    return () => {
      clearSilenceTimer()
    }
  }, [isHttps, clearSilenceTimer])

  const startRecording = () => {
    // 清除之前的错误信息
    setErrorMessage('')
    setFinalTranscript('')
    setInterimTranscript('')
    setShowFloatingPanel(true)

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setErrorMessage('您的浏览器不支持语音识别功能')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'zh-CN'

    recognition.onstart = () => {
      setIsRecording(true)
      setLastSpeechTime(Date.now())
      setSilenceDetection()
      console.log('语音识别已启动')
    }

    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      // 更新最后语音时间
      setLastSpeechTime(Date.now())

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        
        if (result.isFinal) {
          finalTranscript += transcript + ' '
          console.log('最终结果:', transcript)
        } else {
          interimTranscript += transcript
          console.log('临时结果:', transcript)
        }
      }

      setFinalTranscript(prev => prev + finalTranscript)
      setInterimTranscript(interimTranscript)
      
      // 重置静音检测计时器
      setSilenceDetection()
    }

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error)
      setIsRecording(false)
      clearSilenceTimer()
      
      switch (event.error) {
        case 'no-speech':
          setErrorMessage('未检测到语音，请重试')
          break
        case 'audio-capture':
          setErrorMessage('无法访问麦克风，请检查麦克风权限')
          break
        case 'not-allowed':
          setErrorMessage('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问')
          break
        case 'network':
          setErrorMessage('网络错误，请检查网络连接')
          break
        case 'service-not-allowed':
          setErrorMessage('语音识别服务不可用，请稍后重试')
          break
        default:
          setErrorMessage(`语音识别错误: ${event.error}`)
      }
    }

    recognition.onend = () => {
      setIsRecording(false)
      clearSilenceTimer()
      console.log('语音识别结束')
      
      // 如果有最终结果，发送给父组件
      const combinedTranscript = (finalTranscript + interimTranscript).trim()
      if (combinedTranscript) {
        // 检查是否是错误信息
        if (combinedTranscript.includes('错误') || combinedTranscript.includes('失败') || combinedTranscript.includes('无法') || combinedTranscript.includes('未检测到')) {
          setErrorMessage('语音识别失败，请重试')
          setFinalTranscript('')
          setInterimTranscript('')
          return
        }
        
        console.log('发送识别结果:', combinedTranscript)
        onTranscript(combinedTranscript)
        clearTranscript()
        setTimeout(() => setShowFloatingPanel(false), 1000)
      }
    }

    recognitionRef.current = recognition
    
    try {
      recognition.start()
      console.log('语音识别已启动')
    } catch (error) {
      console.error('启动语音识别失败:', error)
      setErrorMessage('启动语音识别失败，请重试')
    }
  }

  const stopRecording = () => {
    clearSilenceTimer()
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        console.log('手动停止录音')
      } catch (error) {
        console.error('停止录音失败:', error)
      }
    }
  }

  const clearTranscript = () => {
    setFinalTranscript('')
    setInterimTranscript('')
    setErrorMessage('')
    clearSilenceTimer()
    setShowFloatingPanel(false)
  }

  // 手动提交当前识别结果
  const submitTranscript = () => {
    const combinedTranscript = (finalTranscript + interimTranscript).trim()
    if (combinedTranscript) {
      onTranscript(combinedTranscript)
      clearTranscript()
    }
  }

  if (!isHttps || !isSupported) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded-md font-medium transition-all flex items-center space-x-2 ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <span>{isRecording ? '停止录音' : '语音输入'}</span>
      </button>
      
      {/* 录音状态指示器 */}
      {isRecording && (
        <div className="absolute -top-2 -right-2">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
          <div className="w-4 h-4 bg-red-500 rounded-full animate-ping animation-delay-200"></div>
        </div>
      )}
      
      {/* 悬浮面板 */}
      {showFloatingPanel && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[300px]">
            {/* 三角形指示器 */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
            
            {isRecording && (
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600 text-sm">正在录音...</span>
                <span className="text-xs text-gray-500">(3秒无声音自动停止)</span>
              </div>
            )}
            
            {/* 显示识别内容 */}
            {(finalTranscript || interimTranscript) && (
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-2">识别内容：</div>
                <div className="min-h-[60px] p-3 bg-gray-50 rounded-md text-sm">
                  {finalTranscript && (
                    <div className="font-medium text-gray-900">{finalTranscript}</div>
                  )}
                  {interimTranscript && (
                    <div className="text-gray-500 italic">
                      {finalTranscript && ' '}
                      {interimTranscript}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 操作按钮 */}
            <div className="flex justify-end space-x-2">
              {(finalTranscript || interimTranscript) && (
                <>
                  <button
                    onClick={submitTranscript}
                    className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                  >
                    使用此内容
                  </button>
                  <button
                    onClick={clearTranscript}
                    className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                  >
                    清除
                  </button>
                </>
              )}
              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                >
                  停止录音
                </button>
              )}
            </div>
            
            {/* 错误信息 */}
            {errorMessage && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                <div className="text-sm text-red-600">{errorMessage}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}