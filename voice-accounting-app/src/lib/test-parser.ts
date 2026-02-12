// 测试增强解析器
import { EnhancedVoiceParser } from './enhancedVoiceParser'

const parser = new EnhancedVoiceParser()

async function testParser() {
  await parser.initialize()
  
  const testText = "昨天给中心小学焊支架，数量两个，单价一百元"
  const result = await parser.parseVoiceInput(testText)
  
  console.log('测试文本:', testText)
  console.log('解析结果:', result)
}

testParser().catch(console.error)