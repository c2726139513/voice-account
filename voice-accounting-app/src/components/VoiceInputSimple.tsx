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

    // 清理计时器
    return () => {
      clearSilenceTimer()
    }
  }, [isHttps, clearSilenceTimer])

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false)
      return
    }

    // 清除之前的错误信息
    setErrorMessage('')
    setFinalTranscript('')
    setInterimTranscript('')

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    // 优化语音识别配置
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'zh-CN'
    recognition.maxAlternatives = 1
    
    if ('grammars' in SpeechRecognition) {
      const SpeechGrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList
      const grammar = '#JSGF V1.0; grammar punctuation; public <punctuation> . , ; : ? ! ;'
      const speechRecognitionList = new SpeechGrammarList()
      speechRecognitionList.addFromString(grammar, 1)
      recognition.grammars = speechRecognitionList
    }

    recognition.onstart = () => {
      setIsRecording(true)
      setLastSpeechTime(Date.now())
      console.log('语音识别开始')
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
        console.log('发送识别结果:', combinedTranscript)
        onTranscript(combinedTranscript)
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
  }

  // 手动提交当前识别结果
  const submitTranscript = () => {
    const combinedTranscript = (finalTranscript + interimTranscript).trim()
    if (combinedTranscript) {
      onTranscript(combinedTranscript)
      clearTranscript()
    }
  }

  if (!isHttps) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 font-medium">需要HTTPS环境</p>
        <p className="text-yellow-600 text-sm mt-1">{errorMessage}</p>
        <button
          onClick={() => window.location.href = 'https://192.168.2.28:3000'}
          className="mt-3 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm"
        >
          切换到HTTPS
        </button>
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">您的浏览器不支持语音识别功能</p>
        <p className="text-red-500 text-sm mt-1">建议使用Chrome、Edge或Safari浏览器</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-green-600">HTTPS环境已启用，语音功能可用</span>
      </div>
      
      {/* 提示信息 */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 当前使用浏览器原生语音识别（需要网络连接）
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Whisper WASM 本地识别功能正在优化中...
        </p>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isRecording ? '停止录音' : '开始语音输入'}
        </button>
        
        {(finalTranscript || interimTranscript) && (
          <>
            <button
              onClick={submitTranscript}
              className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              使用此内容
            </button>
            <button
              onClick={clearTranscript}
              className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              清除
            </button>
          </>
        )}
      </div>
      
      {isRecording && (
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-gray-600">正在录音...</span>
          <span className="text-xs text-gray-500">(3秒无声音自动停止)</span>
        </div>
      )}
      
      {/* 显示识别内容 */}
      {(finalTranscript || interimTranscript) && (
        <div className="w-full max-w-2xl p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">识别内容：</div>
          <div className="min-h-[60px] text-gray-900">
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
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <div>💡 提示：说话时请保持正常语速，系统会自动识别停顿</div>
            <div>🎯 建议：说完一句话后稍作停顿，系统会自动分段识别</div>
            {isRecording && <div>⏱️ 静音检测：3秒后自动停止录音</div>}
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="w-full max-w-2xl p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-600">{errorMessage}</div>
        </div>
      )}
    </div>
  )
}