# Voice Accounting App - AI Agent 指南

## 项目概述
Next.js 16 + TypeScript + Prisma + PostgreSQL 的语音记账应用，支持语音输入解析账单信息。

## 构建与开发命令

```bash
# 开发模式 (HTTP)
npm run dev

# 开发模式 (HTTPS - 语音识别需要)
npm run dev:https

# 生产构建
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint
```

## 代码风格指南

### 导入规范
- 使用路径别名 `@/` 导入项目内部模块
```typescript
import { prisma } from '@/lib/prisma'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
```
- 外部库直接导入
```typescript
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'
```

### 命名约定
- **组件**: PascalCase (如 `VoiceInput`, `Navigation`, `InvoiceList`)
- **函数/变量**: camelCase (如 `fetchInvoices`, `handleVoiceTranscript`)
- **常量**: UPPER_SNAKE_CASE (如 `PERMISSIONS`, `JWT_SECRET`, `JWT_EXPIRES_IN`)
- **类型/接口**: PascalCase (如 `User`, `InvoiceWithCustomer`, `AuthContextType`)
- **API 路由**: RESTful 风格，使用动态路由 `[id]`

### TypeScript 配置
- 严格模式已启用 (`strict: true`)
- 路径别名: `@/*` 映射到 `./src/*`
- 目标: ES2017
- 模块解析: bundler

### 错误处理
- **API 路由**: 使用 try-catch，返回 NextResponse.json with status codes
```typescript
try {
  // 业务逻辑
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error('操作失败:', error)
  return NextResponse.json({ error: '错误描述' }, { status: 500 })
}
```
- **前端**: 使用 alert 显示错误信息，console.error 记录日志

### 认证与权限
- 使用 JWT 进行身份验证，存储在 httpOnly cookie 中
- 基于权限的访问控制 (RBAC)
- 权限常量定义在 `@/lib/permissions.ts`
- 使用 `AuthContext` 管理认证状态
- 中间件处理路由保护 (middleware.ts)
- 公共路径: `/login`, `/init-admin`

### 数据库操作
- 使用 Prisma ORM
- 单例模式导出 prisma 客户端 (`@/lib/prisma.ts`)
- 模型定义: `prisma/schema.prisma`
- 迁移文件: `prisma/migrations/`

### 组件规范
- 客户端组件: 文件顶部添加 `'use client'`
- 使用 TypeScript 接口定义 props
- 使用 Tailwind CSS 进行样式
- 状态管理: React hooks (useState, useEffect, useCallback)

### API 路由规范
- 路径: `src/app/api/[resource]/route.ts`
- 方法: GET, POST, PUT, DELETE
- 认证: 从 cookie 获取 token，使用 `verifyToken` 验证
- 权限检查: 使用 `hasPermission` 函数

### 语音识别
- 需要 HTTPS 环境 (或 localhost)
- 使用 Web Speech API
- 组件: `VoiceInput.tsx`
- 解析器: `@/lib/enhancedVoiceParser.ts`

### 环境变量
- `DATABASE_URL`: PostgreSQL 连接字符串
- `JWT_SECRET`: JWT 签名密钥
- `.env` 文件不应提交到版本控制

### 代码组织
```
src/
├── app/              # Next.js App Router
│   ├── api/         # API 路由
│   └── [pages]/     # 页面组件
├── components/      # React 组件
├── contexts/        # React Context
├── lib/            # 工具函数和配置
└── types/          # TypeScript 类型定义 (如有)
```

### 注意事项
- 语音识别功能需要 HTTPS，开发时使用 `npm run dev:https`
- 所有 API 路由都应进行权限检查
- 使用中文错误消息面向用户
- 日志使用中文便于调试
- 避免使用 `as any` 类型断言
- 遵循 Next.js 16 App Router 约定
