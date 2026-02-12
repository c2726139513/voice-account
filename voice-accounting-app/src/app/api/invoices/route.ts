import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EnhancedVoiceParser, ParsedInvoice } from '@/lib/enhancedVoiceParser'

const enhancedVoiceParser = new EnhancedVoiceParser()

// 初始化增强解析器
enhancedVoiceParser.initialize().catch(console.error)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 判断是语音解析请求还是创建账单请求
    if (body.voiceText) {
      // 语音解析请求
      const { voiceText } = body

      if (!voiceText) {
        return NextResponse.json({ error: '语音文本不能为空' }, { status: 400 })
      }

    // 检查是否是错误信息
    if (voiceText.includes('错误') || voiceText.includes('失败') || voiceText.includes('无法') || voiceText.includes('未检测到') || voiceText.includes('转录失败')) {
      return NextResponse.json({ error: '语音识别失败，请重试' }, { status: 400 })
    }

    // 使用增强解析器
    const parsedInvoice = await enhancedVoiceParser.parseVoiceInput(voiceText)

    console.log('语音文本:', voiceText)
    console.log('解析结果:', parsedInvoice)
    if (parsedInvoice) {
      console.log('客户名称:', parsedInvoice.customerName)
      console.log('描述:', parsedInvoice.description)
      console.log('数量:', parsedInvoice.quantity)
      console.log('单价:', parsedInvoice.unitPrice)
      console.log('总价:', parsedInvoice.totalPrice)
    } else {
      console.log('解析结果为空')
    }

    if (!parsedInvoice) {
      return NextResponse.json({ error: '无法解析语音输入' }, { status: 400 })
    }

    if (parsedInvoice.confidence < 0.5) {
      return NextResponse.json({ 
        error: '解析置信度过低，请重新输入',
        parsedInvoice 
      }, { status: 400 })
    }

    // 查找现有客户，但不立即创建新客户
    let customer = await prisma.customer.findUnique({
      where: { name: parsedInvoice.customerName }
    })

    // 创建一个临时账单对象用于编辑，不保存到数据库
    const tempInvoice = {
      id: `temp-${Date.now()}`,
      customerId: customer?.id || null,
      customer: customer || null,
      customerName: parsedInvoice.customerName, // 保存解析出的客户名称
      description: parsedInvoice.description || '服务',
      quantity: parsedInvoice.quantity || 1,
      unitPrice: parsedInvoice.unitPrice || 0,
      totalPrice: parsedInvoice.totalPrice || 0,
      workDate: parsedInvoice.date || new Date(),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      billId: null
    }

    return NextResponse.json({
        success: true,
        invoice: tempInvoice,
        parsedInvoice
      })
    } else {
      // 创建账单请求
      const { customerId, description, quantity, unitPrice, totalPrice, workDate } = body
      
      if (!customerId || !description || !quantity || !unitPrice || !workDate) {
        return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
      }
      
      // 创建账单
      const invoice = await prisma.invoice.create({
        data: {
          customerId,
          description,
          quantity: parseFloat(quantity),
          unitPrice: parseFloat(unitPrice),
          totalPrice: parseFloat(totalPrice),
          workDate: new Date(workDate),
          status: 'ACTIVE'
        },
        include: {
          customer: true
        }
      })
      
      return NextResponse.json({
        success: true,
        invoice
      })
    }
  } catch (error) {
    console.error('处理请求时出错:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}