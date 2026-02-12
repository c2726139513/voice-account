// 中文数字转换工具 - 简化版本
export class ChineseNumberConverter {
  private static readonly chineseNumbers: { [key: string]: number } = {
    '零': 0, '〇': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '百': 100, '千': 1000,
    '万': 10000, '亿': 100000000, '两': 2, '壹': 1, '贰': 2, '叁': 3,
    '肆': 4, '伍': 5, '陆': 6, '柒': 7, '捌': 8, '玖': 9, '拾': 10,
    '佰': 100, '仟': 1000
  }

  private static readonly moneyUnits: { [key: string]: number } = {
    '元': 1, '块': 1, '圆': 1, '角': 0.1, '毛': 0.1, '分': 0.01,
    '厘': 0.001, '毫': 0.0001
  }

  // 转换中文数字为阿拉伯数字
  static convert(text: string): number {
    if (!text) return 0
    
    // 先检查是否直接包含阿拉伯数字
    const arabicMatch = text.match(/\d+(?:\.\d+)?/)
    if (arabicMatch) {
      return parseFloat(arabicMatch[0])
    }
    
    // 移除空格和标点
    const cleanText = text.replace(/[，。、！？；：""''\s]/g, '')
    
    // 处理特殊情况
    if (cleanText === '十') return 10
    if (cleanText === '百') return 100
    if (cleanText === '千') return 1000
    if (cleanText === '万') return 10000
    
    // 处理简单的个位数
    if (cleanText.length === 1 && this.chineseNumbers[cleanText]) {
      return this.chineseNumbers[cleanText]
    }
    
    // 处理复合数字
    return this.parseComplexNumber(cleanText)
  }

  // 转换中文金额
  static convertMoney(text: string): number {
    if (!text) return 0
    
    // 移除空格和标点
    const cleanText = text.replace(/[，。、！？；：""''\s]/g, '')
    
    // 查找金额模式
    const moneyPatterns = [
      /(.+?)(元|块|圆)/,
      /(.+?)(角|毛)/,
      /(.+?)(分)/
    ]
    
    let totalAmount = 0
    
    for (const pattern of moneyPatterns) {
      const match = cleanText.match(pattern)
      if (match) {
        const numberText = match[1]
        const unit = match[2]
        const number = this.convert(numberText)
        totalAmount += number * (this.moneyUnits[unit] || 1)
      }
    }
    
    return totalAmount
  }

  // 解析复合数字
  private static parseComplexNumber(text: string): number {
    let result = 0
    let temp = 0
    let i = 0
    
    while (i < text.length) {
      const char = text[i]
      const num = this.chineseNumbers[char]
      
      if (num === undefined) {
        i++
        continue
      }
      
      if (num >= 10000) {
        // 万、亿等大单位
        if (temp === 0) temp = 1
        result += temp * num
        temp = 0
      } else if (num >= 100) {
        // 百、千等单位
        if (temp === 0) temp = 1
        temp = temp * num
      } else if (num === 10) {
        // 十的特殊处理
        if (temp === 0) {
          // "十"或"十x"的情况
          temp = 10
        } else {
          // "x十"的情况
          temp = temp * 10
        }
      } else {
        // 数字（1-9）
        if (temp === 0) {
          temp = num
        } else {
          temp = temp * 10 + num
        }
      }
      
      i++
    }
    
    return result + temp
  }

  // 智能提取文本中的所有数字
  static extractNumbers(text: string): number[] {
    const numbers: number[] = []
    
    // 提取阿拉伯数字
    const arabicMatches = text.match(/\d+(?:\.\d+)?/g)
    if (arabicMatches) {
      numbers.push(...arabicMatches.map(n => parseFloat(n)))
    }
    
    // 提取中文数字
    const chinesePatterns = [
      /[零一二三四五六七八九十百千万亿两壹贰叁肆伍陆柒捌玖拾佰仟]+/g,
      /(?:单价|价格|总价|合计|总共)\s*[零一二三四五六七八九十百千万亿两壹贰叁肆伍陆柒捌玖拾佰仟]+/g
    ]
    
    for (const pattern of chinesePatterns) {
      const matches = text.match(pattern)
      if (matches) {
        for (const match of matches) {
          const cleanMatch = match.replace(/(?:单价|价格|总价|合计|总共)\s*/, '')
          const number = this.convert(cleanMatch)
          if (number > 0) {
            numbers.push(number)
          }
        }
      }
    }
    
    return numbers
  }

  // 智能提取金额
  static extractAmounts(text: string): { amount: number; context: string }[] {
    const results: { amount: number; context: string }[] = []
    
    // 提取阿拉伯数字金额
    const arabicPatterns = [
      /(\d+(?:\.\d+)?)\s*(元|块|圆|角|毛|分)/g,
      /(?:单价|价格|总价|合计|总共)\s*(\d+(?:\.\d+)?)\s*(元|块|圆)?/g
    ]
    
    for (const pattern of arabicPatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const amount = parseFloat(match[1])
        const unit = match[2] || '元'
        const context = text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10)
        results.push({
          amount: amount * (this.moneyUnits[unit] || 1),
          context: context.trim()
        })
      }
    }
    
    // 提取中文数字金额
    const chinesePatterns = [
      /([零一二三四五六七八九十百千万亿两壹贰叁肆伍陆柒捌玖拾佰仟]+)\s*(元|块|圆|角|毛|分)/g,
      /(?:单价|价格|总价|合计|总共)\s*([零一二三四五六七八九十百千万亿两壹贰叁肆伍陆柒捌玖拾佰仟]+)\s*(元|块|圆)?/g
    ]
    
    for (const pattern of chinesePatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const amount = this.convert(match[1])
        const unit = match[2] || '元'
        const context = text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10)
        results.push({
          amount: amount * (this.moneyUnits[unit] || 1),
          context: context.trim()
        })
      }
    }
    
    return results
  }
}