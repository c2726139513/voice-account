import { ChineseNumberConverter } from './chineseNumberConverter'

export interface ParsedInvoice {
  date: Date
  customerName: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  confidence: number
}

declare global {
  interface Window {
    jieba: any
    nzh: any
  }
}

export class EnhancedVoiceParser {
  private chineseNumbers: { [key: string]: number } = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '壹': 1, '贰': 2, '叁': 3, '肆': 4, '伍': 5,
    '陆': 6, '柒': 7, '捌': 8, '玖': 9, '拾': 10,
    '两': 2, '佰': 100, '仟': 1000, '万': 10000, '亿': 100000000
  }

  private moneyUnits: { [key: string]: number } = {
    '元': 1, '块': 1, '圆': 1, '角': 0.1, '毛': 0.1, 
    '分': 0.01, '厘': 0.001, '毫': 0.0001
  }

  private quantityUnits: { [key: string]: number } = {
    '个': 1, '件': 1, '台': 1, '套': 1, '只': 1, '支': 1,
    '瓶': 1, '盒': 1, '箱': 1, '斤': 0.5, '公斤': 1, '千克': 1,
    '克': 0.001, '吨': 1000, '米': 1, '厘米': 0.01,
    '分米': 0.1, '千米': 1000, '升': 1, '毫升': 0.001,
    '平方米': 1, '立方米': 1
  }

  async initialize(): Promise<void> {
    // 动态加载jieba和nzh库
    try {
      // 这里可以动态加载CDN或本地库
      console.log('增强语音解析器已初始化')
    } catch (error) {
      console.warn('NLP库加载失败，使用基础解析功能:', error)
    }
  }

  async parseVoiceInput(text: string): Promise<ParsedInvoice | null> {
    try {
      const cleanedText = this.preprocessText(text)
      const segments = this.segmentText(cleanedText)
      
      const date = this.extractDate(segments)
      const customerName = this.extractCustomerName(segments)
      const description = this.extractDescription(segments)
      const quantity = this.extractQuantity(segments)
      const unitPrice = this.extractUnitPrice(segments)
      const totalPrice = this.extractTotalPrice(segments)

      // 智能计算和验证
      const result = this.calculateAndValidate(date, customerName, description, quantity, unitPrice, totalPrice)
      
      return result
    } catch (error) {
      console.error('增强语音解析出错:', error)
      return null
    }
  }

  private preprocessText(text: string): string {
    return text
      .replace(/[，。！？；：""''\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private segmentText(text: string): string[] {
    // 如果有jieba库，使用中文分词
    if (typeof window !== 'undefined' && window.jieba) {
      try {
        return window.jieba.cut(text)
      } catch (error) {
        console.warn('分词失败，使用简单分割:', error)
      }
    }
    
    // 简单分词逻辑
    return text.split(/\s+/).filter(word => word.length > 0)
  }

  private extractDate(segments: string[]): Date {
    const text = segments.join(' ')
    const now = new Date()
    
    // 相对日期
    if (text.includes('今天') || text.includes('今日')) return now
    if (text.includes('昨天') || text.includes('昨日')) {
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }
    if (text.includes('前天')) {
      return new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    }
    
    // 具体日期模式
    const datePatterns = [
      /(\d{4})年(\d{1,2})月(\d{1,2})日/,
      /(\d{2})年(\d{1,2})月(\d{1,2})日/,
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      /(\d{1,2})月(\d{1,2})日/
    ]
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern)
      if (match) {
        let year = parseInt(match[1])
        if (year < 100) year += 2000
        const month = parseInt(match[2]) - 1
        const day = parseInt(match[3])
        return new Date(year, month, day)
      }
    }
    
    return now
  }

  private extractCustomerName(segments: string[]): string {
    const text = segments.join(' ')
    
    // 客户名称模式 - 添加更多常见模式
    const customerPatterns = [
      // 模式1: 给 + 客户名 + 动词
      /给\s*(.+?)(?=\s*(?:做|干|搞|提供|服务|焊|安装|维修|施工|购买|买了|要))/,
      // 模式2: 客户名 + 购买/买了
      /(.+?)(?:购买|买了)(?=\s*\d)/,
      // 模式3: 客户名 + 要了
      /(.+?)(?:要了|要)(?=\s*\d)/,
      // 模式4: 客户 + 客户名
      /客户\s*(.+?)(?:\s|，|。|$)/,
      // 模式5: 包含公司/厂/店等后缀
      /(.+?)(?:公司|厂|店|馆|中心|小学|中学|大学|医院)/,
      // 模式6: 简单的人名模式 - 2-3个中文字符后跟动词
      /([\u4e00-\u9fa5]{2,3})(?=\s*(?:购买|买了|要了|要|做|干|搞|焊|安装|维修|施工))/
    ]
    
    for (const pattern of customerPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        let customerName = match[1].trim()
        // 清理常见的连接词
        customerName = customerName.replace(/^(的|一个|一个|了|是)/, '')
        if (customerName && customerName.length > 0) {
          return customerName
        }
      }
    }
    
    // 从分词结果中查找可能的客户名称
    for (let i = 0; i < segments.length; i++) {
      const word = segments[i]
      // 查找常见的人名模式（2-3个中文字符）
      if (/^[\u4e00-\u9fa5]{2,3}$/.test(word)) {
        // 检查后面是否跟着购买等动词
        if (i + 1 < segments.length && 
            ['购买', '买了', '要了', '要', '做', '干', '搞'].includes(segments[i + 1])) {
          return word
        }
      }
      if (word.includes('给') && i + 1 < segments.length) {
        return segments[i + 1]
      }
    }
    
    return '未知客户'
  }

  private extractDescription(segments: string[]): string {
    const text = segments.join(' ')
    
    // 服务描述模式 - 更精确的模式
    const servicePatterns = [
      /(?:焊|安装|维修|施工|做|干|搞)\s*(.+?)(?=\s*(?:数量|单价|价格|总价|合计|总共|$))/,
      /(?:焊|安装|维修|施工|做|干|搞)(?:了|了)?\s*(.+?)(?=\s*(?:数量|单价|价格|总价|合计|总共|$))/,
      /(.+?)(?:\s|，|。|$)(?:焊|安装|维修|施工|做|干|搞)/
    ]
    
    for (const pattern of servicePatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        let description = match[1].trim()
        // 清理常见的连接词
        description = description.replace(/^(的|一个|一个|了|了)/, '')
        return description
      }
    }
    
    // 从分词结果中查找服务关键词
    const serviceKeywords = ['焊', '安装', '维修', '施工', '做', '干', '搞']
    for (const keyword of serviceKeywords) {
      const index = segments.indexOf(keyword)
      if (index !== -1 && index + 1 < segments.length) {
        let description = segments[index + 1]
        // 清理常见的连接词
        description = description.replace(/^(的|一个|一个|了|了)/, '')
        if (description && description.length > 0) {
          return description
        }
      }
    }
    
    return '服务'
  }

  private extractQuantity(segments: string[]): number {
    const text = segments.join(' ')
    
    // 数量模式 - 优先匹配阿拉伯数字
    const quantityPatterns = [
      /数量\s*(\d+(?:\.\d+)?)/,
      /(\d+(?:\.\d+)?)\s*(个|件|台|套|只|支|瓶|盒|箱|斤|公斤|千克|克|吨|米|厘米|分米|千米|升|毫升)/
    ]
    
    for (const pattern of quantityPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        const quantity = parseFloat(match[1])
        const unit = match[2]
        return unit && this.quantityUnits[unit] ? quantity * this.quantityUnits[unit] : quantity
      }
    }
    
    // 中文数字数量模式
    const chineseQuantityPatterns = [
      /数量\s*([零一二三四五六七八九十百千万亿两壹贰叁肆伍陆柒捌玖拾佰仟]+)(?:\s*(个|件|台|套|只|支|瓶|盒|箱|斤|公斤|千克|克|吨|米|厘米|分米|千米|升|毫升))?/,
      /([零一二三四五六七八九十百千万亿两壹贰叁肆伍陆柒捌玖拾佰仟]+)\s*(个|件|台|套|只|支|瓶|盒|箱|斤|公斤|千克|克|吨|米|厘米|分米|千米|升|毫升)/
    ]
    
    for (const pattern of chineseQuantityPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        const quantityText = match[1]
        const unit = match[2]
        const quantity = this.extractChineseNumber(quantityText)
        if (quantity > 0) {
          return unit && this.quantityUnits[unit] ? quantity * this.quantityUnits[unit] : quantity
        }
      }
    }
    
    // 查找单独的中文数字
    const chineseNumbers = ChineseNumberConverter.extractNumbers(text)
    if (chineseNumbers.length > 0) {
      // 优先选择较小的数字作为数量（通常数量不会太大）
      return Math.min(...chineseNumbers.filter(n => n < 1000))
    }
    
    return 1
  }

  private extractUnitPrice(segments: string[]): number {
    const text = segments.join(' ')
    
    // 单价模式 - 优先匹配阿拉伯数字
    const pricePatterns = [
      /单价\s*(\d+(?:\.\d+)?)\s*(元|块|圆)/,
      /价格\s*(\d+(?:\.\d+)?)\s*(元|块|圆)/,
      /(\d+(?:\.\d+)?)\s*(元|块|圆)\s*(每|个|件|台|套)/
    ]
    
    for (const pattern of pricePatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return parseFloat(match[1])
      }
    }
    
    // 中文单价模式
    const chinesePricePatterns = [
      /单价\s*([零一二三四五六七八九十百千万亿两壹贰叁肆伍陆柒捌玖拾佰仟]+)\s*(元|块|圆)/,
      /价格\s*([零一二三四五六七八九十百千万亿两壹贰叁肆伍陆柒捌玖拾佰仟]+)\s*(元|块|圆)/,
      /([零一二三四五六七八九十百千万亿两壹贰叁肆伍陆柒捌玖拾佰仟]+)\s*(元|块|圆)\s*(每|个|件|台|套)/
    ]
    
    for (const pattern of chinesePricePatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        const priceText = match[1]
        const unit = match[2]
        const price = this.extractChineseNumber(priceText)
        if (price > 0) {
          return price
        }
      }
    }
    
    // 使用金额提取工具
    const amounts = ChineseNumberConverter.extractAmounts(text)
    if (amounts.length > 0) {
      // 选择合理的单价（通常不会太大）
      const reasonablePrices = amounts.filter(a => a.amount > 0 && a.amount < 10000)
      if (reasonablePrices.length > 0) {
        return reasonablePrices[0].amount
      }
    }
    
    return 0
  }

  private extractTotalPrice(segments: string[]): number {
    const text = segments.join(' ')
    
    // 总价模式
    const totalPatterns = [
      /总价\s*(\d+(?:\.\d+)?)\s*(元|块|圆)/,
      /合计\s*(\d+(?:\.\d+)?)\s*(元|块|圆)/,
      /总共\s*(\d+(?:\.\d+)?)\s*(元|块|圆)/,
      /(\d+(?:\.\d+)?)\s*(元|块|圆)\s*(总|合计|共)/
    ]
    
    for (const pattern of totalPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return parseFloat(match[1])
      }
    }
    
    return 0
  }

  private extractChineseNumber(text: string): number {
    return ChineseNumberConverter.convert(text)
  }

  private extractChineseMoney(text: string): number {
    return ChineseNumberConverter.convertMoney(text)
  }

  private calculateAndValidate(
    date: Date,
    customerName: string,
    description: string,
    quantity: number,
    unitPrice: number,
    totalPrice: number
  ): ParsedInvoice {
    // 智能计算缺失值
    let finalQuantity = quantity
    let finalUnitPrice = unitPrice
    let finalTotalPrice = totalPrice
    
    if (finalTotalPrice === 0 && finalQuantity > 0 && finalUnitPrice > 0) {
      finalTotalPrice = finalQuantity * finalUnitPrice
    } else if (finalQuantity === 0 && finalTotalPrice > 0 && finalUnitPrice > 0) {
      finalQuantity = finalTotalPrice / finalUnitPrice
    } else if (finalUnitPrice === 0 && finalQuantity > 0 && finalTotalPrice > 0) {
      finalUnitPrice = finalTotalPrice / finalQuantity
    }
    
    // 计算置信度
    const confidence = this.calculateConfidence(
      date, customerName, description, finalQuantity, finalUnitPrice, finalTotalPrice
    )
    
    return {
      date,
      customerName: customerName || '未知客户',
      description: description || '服务',
      quantity: finalQuantity || 1,
      unitPrice: finalUnitPrice || 0,
      totalPrice: finalTotalPrice || 0,
      confidence
    }
  }

  private calculateConfidence(
    date: Date,
    customerName: string,
    description: string,
    quantity: number,
    unitPrice: number,
    totalPrice: number
  ): number {
    let confidence = 0.5
    
    if (customerName !== '未知客户') confidence += 0.15
    if (description !== '服务') confidence += 0.1
    if (quantity > 0) confidence += 0.1
    if (unitPrice > 0) confidence += 0.15
    if (totalPrice > 0) confidence += 0.15
    
    // 检查计算一致性
    if (quantity > 0 && unitPrice > 0 && totalPrice > 0) {
      const calculated = quantity * unitPrice
      if (Math.abs(calculated - totalPrice) < 0.01) {
        confidence += 0.15
      }
    }
    
    return Math.min(confidence, 1.0)
  }
}