# EdgeOne Pages 部署指南

本分支使用外部 PostgreSQL 数据库（如 Supabase、Neon、Railway 等）在 EdgeOne Pages 上进行部署。

## 部署步骤

### 1. 准备工作

确保你已经：
- 将代码推送到 GitHub
- 拥有腾讯云 EdgeOne Pages 账户
- 拥有外部 PostgreSQL 数据库

### 2. 创建外部数据库

推荐使用以下云数据库服务：

#### Supabase
1. 访问 [supabase.com](https://supabase.com) 并注册
2. 创建新项目
3. 在项目设置中获取数据库连接字符串
4. 连接字符串格式：`postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

#### Neon
1. 访问 [neon.tech](https://neon.tech) 并注册
2. 创建新项目
3. 获取连接字符串
4. 连接字符串格式：`postgresql://[USER]:[PASSWORD]@[HOST].neon.tech/[DATABASE]?sslmode=require`

#### Railway
1. 访问 [railway.app](https://railway.app) 并注册
2. 创建 PostgreSQL 数据库
3. 获取连接字符串

### 3. 连接 EdgeOne Pages 到 GitHub

1. 访问 [EdgeOne Pages 控制台](https://console.tencentcloud.com/edgeone/pages) 并登录
2. 点击 "创建项目" 或 "导入 Git 仓库"
3. 导入你的 GitHub 仓库
4. 选择 `edgeone-page` 分支

### 4. 配置构建设置

EdgeOne Pages 会自动检测 Next.js 项目，默认配置如下：

- **构建命令**：`npm run build`
- **输出目录**：`.next`

**重要说明**：
- 本项目的 `package.json` 已将 `build` 脚本修改为 `"next build --webpack"`
- 这确保 Prisma Client 在 Next.js 构建之前生成，避免运行时错误
- `edgeone.json` 配置文件已包含 `buildCommand` 设置

如果需要自定义配置，可以修改 `edgeone.json` 文件（见下文）。

### 5. 配置环境变量

在 EdgeOne Pages 项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres` |
| `JWT_SECRET` | JWT 签名密钥 | 使用 `openssl rand -base64 32` 生成 |

**生成安全的 JWT_SECRET**：

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 6. 部署

点击 "部署" 按钮，EdgeOne Pages 会：
1. 安装依赖
2. 运行 `postinstall` 脚本（自动执行数据库迁移）
3. 构建应用
4. 部署到生产环境

## 数据库迁移

本分支使用 `postinstall` 脚本自动运行数据库迁移：

```javascript
// scripts/migrate.js
const { execSync } = require('child_process');

console.log('Running Prisma migrations for EdgeOne Pages deployment...');

try {
  console.log('Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('Pushing schema to external database...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('✅ Migrations completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
```

## EdgeOne Pages 配置文件

项目根目录的 `edgeone.json` 文件配置如下：

```json
{
  "_comment": "EdgeOne Pages 配置文件",
  "_note": "确保 Prisma Client 在构建前生成",
  "_docs": "https://pages.edgeone.ai/zh/document/edgeone.json",
  "version": 2,
  "buildCommand": "npm run build",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

## 环境变量

| 变量名 | 说明 | 来源 |
|--------|------|------|
| `DATABASE_URL` | 数据库连接 URL | 手动添加（从外部数据库获取） |
| `JWT_SECRET` | JWT 签名密钥 | 手动添加 |

## 数据库连接字符串格式

### Supabase
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Neon
```
postgresql://[USER]:[PASSWORD]@[HOST].neon.tech/[DATABASE]?sslmode=require
```

### Railway
```
postgresql://[USER]:[PASSWORD]@[HOST].railway.app:[PORT]/[DATABASE]
```

## EdgeOne Pages 对 Next.js 的支持

EdgeOne Pages 完全支持 Next.js 13.5+、14、15、16 版本，包括：

| Next.js 功能 | 支持状态 |
|-------------|---------|
| App Router | ✅ |
| Pages Router | ✅ |
| 服务器端渲染 (SSR) | ✅ |
| 静态站点生成 (SSG) | ✅ |
| 增量静态再生成 (ISR) | ✅ |
| React 服务器组件 | ✅ |
| 流式响应 | ✅ |
| 路由处理程序 (API Routes) | ✅ |

**重要说明**：
- Next.js API Routes（`src/app/api/**/route.ts`）在 EdgeOne Pages 上**完全支持**
- **不需要**将 API 迁移到 `node-functions` 目录
- Prisma 可以在 Next.js API Routes 中正常运行

## 优势

- ✅ 使用外部数据库，数据独立于 EdgeOne Pages
- ✅ 可以选择不同的数据库提供商
- ✅ 更灵活的数据库配置
- ✅ 可以在不同环境间共享数据库
- ✅ EdgeOne Pages 提供全球加速，国内访问速度更快
- ✅ 无需域名备案即可部署
- ✅ HTTPS 证书自动签发

## 注意事项

1. 确保数据库允许 EdgeOne Pages 的 IP 地址访问
2. 使用 SSL 连接（大多数云数据库默认启用）
3. 定期备份数据库
4. 监控数据库连接数和性能
5. EdgeOne Pages 的 Node.js 版本默认为 v20.x

## 本地开发

要在本地使用外部数据库，需要：

1. 复制环境变量：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，添加外部数据库的连接字符串：
   ```env
   DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
   JWT_SECRET="your-jwt-secret"
   ```

3. 运行开发服务器：
   ```bash
   npm run dev
   ```

## 创建管理员用户

部署后，访问 `/init-admin` 页面创建管理员用户。

## 故障排除

### 迁移失败

如果迁移失败，检查：
1. `DATABASE_URL` 环境变量是否正确
2. 数据库是否可访问
3. 数据库用户是否有足够权限
4. 网络连接是否正常

### 连接错误

如果出现连接错误：
1. 验证数据库连接字符串
2. 检查数据库是否允许外部连接
3. 确认 SSL 配置
4. 查看部署日志

### 权限错误

如果出现权限错误：
1. 确保数据库用户有 CREATE TABLE 权限
2. 检查数据库用户角色
3. 联系数据库提供商支持

## 数据库备份

### Supabase
```bash
# 使用 pg_dump
pg_dump $DATABASE_URL > backup.sql

# 恢复
psql $DATABASE_URL < backup.sql
```

### Neon
```bash
# Neon 提供自动备份
# 也可以使用 pg_dump 手动备份
```

### Railway
```bash
# Railway 提供自动备份
# 也可以使用 pg_dump 手动备份
```

## 性能优化

1. **连接池**：Prisma 默认使用连接池，无需额外配置
2. **查询优化**：使用 Prisma 的 `select` 和 `include` 优化查询
3. **索引**：在 Prisma schema 中定义索引
4. **缓存**：考虑使用 Redis 缓存频繁查询的数据

## 监控

- EdgeOne Pages 控制台：查看应用性能和错误
- 数据提供商 Dashboard：监控数据库性能
- Prisma Studio：可视化管理数据

## 相关文档

- [EdgeOne Pages 文档](https://pages.edgeone.ai/zh/document/product-introduction)
- [EdgeOne Pages Next.js 框架指南](https://pages.edgeone.ai/zh/document/framework-nextjs)
- [EdgeOne Pages Node Functions 文档](https://pages.edgeone.ai/zh/document/node-functions)
- [Prisma 文档](https://www.prisma.io/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Neon 文档](https://neon.tech/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
