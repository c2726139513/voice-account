# 语音记账系统 — AI Agent API 操作手册

本文档面向 AI Agent，说明如何通过 REST API 完成记账、查询、结账、打印等操作。
所有字段名均与后端 Prisma 模型一一对应，可直接用于构造请求/解析响应。

---

## 1. 基本约定

- 所有接口路径以 `/api/` 开头，请求体为 JSON（`Content-Type: application/json`）
- **响应约定**：
  - 成功：HTTP 200，部分端点带 `{"success": true, ...}`，部分直接返回实体（如 `{"invoice": {...}}`）
  - 失败：HTTP 4xx/5xx，统一为 `{"error": "中文错误信息"}`
  - **判断成败以 HTTP 状态码为准**，不要假设一定有 `success` 字段
- **日期参数**：`startDate` / `endDate` 为 ISO 字符串（如 `2026-07-06`），**闭区间**（gte/lte）
- **金额**：`Float` 类型，单位人民币元

---

## 2. 认证

### 登录

```bash
curl -c cookies.txt -X POST /api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username": "admin", "password": "你的密码"}'
```

成功响应：`{"success": true, "user": {"id", "username", "permissions": string[], "isAdmin": bool}}`，同时设置 httpOnly cookie `token`（有效期 7 天）。

后续所有请求携带 cookie：`curl -b cookies.txt ...`

### 其他认证端点

| 端点 | 方法 | 说明 |
|---|---|---|
| `/api/auth/logout` | POST | 清除 cookie，`{"success":true,"message":"已退出登录"}` |
| `/api/auth/me` | GET | 返回当前用户 `{"success":true,"user":{id,username,permissions,isAdmin,createdAt}}`；401=未登录/过期，404=用户已被删除 |
| `/api/auth/check-users` | GET | 公开，`{"hasUsers":bool,"userCount":number}` |
| `/api/auth/init-admin` | POST | 一次性初始化管理员（仅当系统无用户时可用），body `{username, password(≥6位)}` |

### 重要：认证边界（务必了解）

- **所有业务端点强制鉴权**（客户/账单/发票/报表）：无 token 或 token 无效 → 401 `{"error":"未授权"}`。首次调用前必须先 `POST /api/auth/login` 拿 cookie（`curl -c cookies.txt`），后续请求 `curl -b cookies.txt`
- **公开端点（无需登录）**：`POST /api/auth/login`、`POST /api/auth/logout`、`GET /api/auth/check-users`、`POST /api/auth/init-admin`、`GET /api/auth/me`（未登录时自返 401）、`GET /api/company`（未登录返回脱敏数据，隐藏联系人与打印页脚）
- 鉴权实现在各路由处理器内（`requireAuth` 统一校验 cookie 中的 JWT），Next 中间件只负责页面跳转，对 `/api/*` 直接放行
- **服务端不做 RBAC**：`hasPermission` 只在前端 UI 使用；例外是 `/api/users*` 需 `isAdmin`（否则 403 `需要管理员权限`）

---

## 3. 核心数据模型

### Customer（客户）

```
{ id, name(唯一), phone?, email?, createdAt, updatedAt }
```

### Invoice（账单明细）—— 状态恒为 ACTIVE

```
{ id, customerId, description, quantity, unitPrice, totalPrice,
  workDate,          // 业务日期（查询/统计用它，不叫 date）
  status,            // 枚举只有 'ACTIVE' 一个合法值
  billId,            // string|null；null = 未进任何账单表单（挂在总账单上）
  createdAt, updatedAt, customer? }
```

- `totalPrice = quantity * unitPrice`
- **是否已进账单表单只看 `billId`，不看 status**
- `GET /api/invoices/list` **固定只返回 `billId=null` 的发票**（即未进表单的池子）

### Bill（账单表单，待结账/已结账）

```
{ id, customerId, title, totalAmount,
  status,            // 'PENDING' 待结账 | 'COMPLETED' 已结账
  completedAt,       // 结账时间，PENDING 时为 null
  createdAt, updatedAt, customer?, invoices?[] }
```

### 状态机

```
Invoice.status:  只有 'ACTIVE'（无其他合法值，写入其他值会被数据库拒绝）
Bill.status:     创建 → PENDING --结账--> COMPLETED --退回--> PENDING
```

### 权限字符串（17 个，仅供理解用户角色）

`customer:create|read|update|delete`、`invoice:create|read|update|delete`、
`bill:create|read|update|delete|complete`、`user:create|read|update|delete`、`system:admin`

分组：BASIC(3) ⊂ OPERATOR(10) ⊂ ADMIN(15) ⊂ SUPER_ADMIN(17)。`isAdmin: true` 为全局旁路。

---

## 4. API 端点速查

### 客户

| 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|
| GET | `/api/customers` | 无参（返回全部，按名称排序） | `{"customers":[{...,"_count":{"invoices":n}}]}` |
| POST | `/api/customers` | `{name(必填), phone?, email?}` | `{"success":true,"customer":{...}}` |
| DELETE | `/api/customers/{id}` | 无 | `{"success":true,"message":"客户删除成功"}`；400=该客户有账单记录不可删 |

- 客户名查重**大小写不敏感**，重复返回 400 `客户已存在`
- 查某客户有多少条账单：用 `GET /api/customers` 里的 `_count.invoices`

### 发票（记账明细）

| 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|
| POST | `/api/invoices/manual` | `{customerId, description, quantity, unitPrice, totalPrice, workDate}` 全部必填 | `{"success":true,"invoice":{...含customer}}` |
| GET | `/api/invoices/list` | `?status=ACTIVE&customerId=&startDate=&endDate=&page=1&limit=10` | `{"invoices":[...],"pagination":{page,limit,total,pages}}` |
| PUT | `/api/invoices/{id}` | `{customerId, description, quantity, unitPrice, workDate}`（**不接受 totalPrice**，服务端重算） | `{"invoice":{...}}` |
| DELETE | `/api/invoices/{id}` | 无 | `{"invoice":{...已删除}}` |

注意：
- **必须自己算 `totalPrice = quantity × unitPrice`**（创建端点不重算）
- `workDate` 传日期字符串
- `GET /api/invoices/list` 只返回未进表单的发票（`billId=null`），可用 `customerId`、`startDate`、`endDate` 过滤

### 账单表单（结账流程）

| 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|
| POST | `/api/bills` | `{invoiceIds: string[], title: string}` | `{"success":true,"bill":{...含customer和invoices}}` |
| GET | `/api/bills/list` | `?status=PENDING(默认)\|COMPLETED&customerId=&page=1&limit=10` | `{"bills":[...],"pagination":{...}}` |
| GET | `/api/bills/{id}` | 无 | `{"bill":{...含customer、invoices按workDate升序}}` |
| PATCH | `/api/bills/{id}` | `{"status":"PENDING"\|"COMPLETED"}` | `{"bill":{...}}` |
| DELETE | `/api/bills/{id}` | 无 | `{"success":true,"message":"账单\"X\"已删除，N条明细已退回总账单"}` |
| POST | `/api/bills/{id}/invoices` | `{invoiceIds: string[]}` | `{"success":true,"updatedCount":n,"totalAmount":x}` |
| DELETE | `/api/bills/{id}/invoices` | `{invoiceIds: string[]}`（**DELETE 带 JSON body**） | 同上 |

规则：
- 创建/挂载的发票**必须同属一个客户**，否则 400（挂载时响应含 `invalidCustomers: [客户名]`）
- `totalAmount = Σ 发票 totalPrice`，在创建/挂载/卸载/发票PUT时自动重算
- `PATCH` 是**唯一**的状态变更端点：COMPLETED 时写 `completedAt=now`，退回 PENDING 时置 null
- `GET /api/bills/list` 支持 `startDate`/`endDate`（按 `createdAt` 过滤，纯日期 `endDate` 自动扩展到当天 23:59:59.999Z），其余参数为 status/customerId/page/limit

### 报表统计

| 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|
| GET | `/api/reports` | `?type=summary\|customer\|monthly\|top-items&startDate=&endDate=` | 见下 |

- `type=summary`（默认）→ `{"summary":{totalInvoices, totalAmount, activeInvoices, availableInvoices, invoicesInBills, totalBills, pendingBills, completedBills}}`；`totalAmount`/`totalInvoices` 受 `startDate`/`endDate` 约束（发票按 `workDate`，账单按 `createdAt`），并支持 `customerId`
- `type=customer` → `{"customers":[{id,name,phone,email,invoiceCount,invoiceTotal,billCount,billTotal,totalAmount}]}`；日期过滤需**同时传** startDate 和 endDate（按 `workDate` 过滤发票）；`totalAmount === invoiceTotal`（已修复重复计算，两者任取其一）
- `type=monthly` → `{"monthlyData":[{month:"2026年1月",invoiceCount,totalAmount}]}`；不传日期时默认今年年初至今
- `type=top-items` → `{"topItems":[{description,totalCount,totalQuantity,totalAmount}]}` 按金额 Top10；日期需成对传入

### 公司信息（打印抬头/页脚）

| 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|
| GET | `/api/company` | 无 | `{"company":{id,name,contactPerson,contactPhone,printFooter,...}}`；⚠️ 未登录时 contactPerson/contactPhone 为 null 且无 printFooter |
| PUT | `/api/company` | `{name?,contactPerson?,contactPhone?,printFooter?}` 需登录 | `{"company":{...}}`；⚠️ **省略的字段会被置 null**，必须传全 |

### 用户管理（仅管理员）

| 方法 | 路径 | 请求 | 认证 |
|---|---|---|---|
| GET | `/api/users` | 无 | cookie + `isAdmin=true` |
| POST | `/api/users` | `{username, password, permissions?: string[], isAdmin?: bool}` | 同上 |
| PUT | `/api/users/{id}` | `{username, password?, permissions?, isAdmin?}` | 同上；⚠️ 省略 permissions/isAdmin 会被重置为 `[]`/false |
| DELETE | `/api/users/{id}` | 无 | 同上 |

非管理员调用 → 403 `需要管理员权限`；无/无效 token → 401。

---

## 5. 标准工作流

### 5.1 记账："记个张三维修3次每次100元的账"

```bash
curl -b cookies.txt -X POST /api/invoices/manual \
  -H 'Content-Type: application/json' \
  -d '{"customerId":"<客户id>","description":"维修","quantity":3,"unitPrice":100,"totalPrice":300,"workDate":"2026-07-06"}'
```

**客户不存在时先建客户**：

```bash
curl -b cookies.txt -X POST /api/customers \
  -H 'Content-Type: application/json' \
  -d '{"name":"张三","phone":"13800000000"}'
```

注意：
- 客户已存在会返回 400 `客户已存在` —— 此时改用已有客户，先 `GET /api/customers` 按 `name` 匹配取 `id`
- **必须自己算 `totalPrice = quantity × unitPrice`**（创建端点不重算）
- `workDate` 传 ISO 日期字符串

### 5.2 查询："张三现在总账单金额多少"

```bash
curl -b cookies.txt "/api/reports?type=customer"
```

在返回的 `customers[]` 中按 `name` 匹配，读 **`invoiceTotal`**（该客户全部发票金额合计）。

- 需要限定时间：追加 `&startDate=2026-01-01&endDate=2026-07-06`（**两个必须同时传**才生效）
- `totalAmount` 与 `invoiceTotal` 相等（已修复重复计算），读任一即可
- 仅想看挂在总账单上（未进表单）的发票：`GET /api/invoices/list?customerId={id}&limit=1000` 后自行求和（注意 `pagination.total` 可能大于返回条数，需翻页）

### 5.3 时间范围查询："2026-06-01 至 2026-06-30 的账单金额"

```bash
curl -b cookies.txt "/api/reports?type=customer&startDate=2026-06-01&endDate=2026-06-30"
```

- 对返回的 `invoiceTotal` 求和 = 该区间全客户发票总额
- 按月趋势：`type=monthly`（可配合 startDate/endDate）
- 按客户看区间明细也可用 `GET /api/invoices/list?customerId=&startDate=&endDate=&limit=1000` 后汇总（该端点返回的发票带 `workDate`）
- ⚠️ `type=summary` 的 `totalAmount` 现受 `startDate`/`endDate` 约束（区间查询可用）

### 5.4 待结账单与结账

```bash
# 1. 查张三的待结账单
curl -b cookies.txt -X POST /api/customers -H 'Content-Type: application/json' -d '{"name":"张三"}'  # 拿 id（已存在则 GET 查询）
curl -b cookies.txt "/api/bills/list?status=PENDING&customerId=<id>&limit=1000"
# → {"bills":[{id,title,totalAmount,status,completedAt,customer,invoices[]}], "pagination":{...}}
```

```bash
# 2. 结账（PATCH 是唯一状态变更端点）
curl -b cookies.txt -X PATCH /api/bills/<billId> \
  -H 'Content-Type: application/json' -d '{"status":"COMPLETED"}'
# → {"bill":{...,"completedAt":"2026-07-06T..."}}

# 2b. 退回（重新变回待结账）
# -d '{"status":"PENDING"}'   → completedAt 置 null
```

```bash
# （可选）从零创建一张待结账单：先取该客户未进表单的发票
curl -b cookies.txt "/api/invoices/list?customerId=<id>&status=ACTIVE&limit=1000"
# 再组单
curl -b cookies.txt -X POST /api/bills \
  -H 'Content-Type: application/json' \
  -d '{"invoiceIds":["<id1>","<id2>"],"title":"张三的账单 - 2026/07/06"}'
# → {"success":true,"bill":{status:"PENDING",...}}
```

查看已结账单：`GET /api/bills/list?status=COMPLETED`。

### 5.5 打印输出 PDF

**系统没有 PDF 生成 API** —— 打印是 Web UI 的客户端功能（`PrintBill` 组件：html2pdf.js 渲染 `#print-content` 节点 → pdf.js → `window.print()`）。

Agent 实现打印的两种方式：

**方式 1（推荐）：取数后自行渲染 PDF**

```bash
# 取打印所需的全部数据（bill + customer + invoices 按 workDate 升序）
curl -b cookies.txt "/api/bills/<billId>"
# 取公司抬头/页脚（必须带 cookie，否则页脚字段缺失）
curl -b cookies.txt "/api/company"
```

渲染 PDF 所需字段清单：

| 区域 | 字段 |
|---|---|
| 表头 | `company.name`、`company.contactPerson`、`company.contactPhone` |
| 账单 | `bill.title`、`bill.createdAt`、`bill.completedAt`、`bill.totalAmount` |
| 客户 | `bill.customer.name`、`.phone`、`.email` |
| 明细行 | `invoices[].workDate`、`.description`、`.quantity`、`.unitPrice`、`.totalPrice`、`.id` |
| 页脚 | `company.printFooter` |

**方式 2**：驱动浏览器打开 Web UI（待结账单页 → 打印按钮 → `PrintBill` 组件），需要浏览器自动化能力与弹窗权限。

---

## 6. 已知问题与陷阱（必须遵守）

> **部署状态**：第 1–7 条的修复已部署上线并验证（7/7）。第 10 条（业务端点强制鉴权）为最新变更，
> **EdgeOne 重新部署前线上仍是旧行为**（无 cookie 也能查数据）。重新部署后本节即为最终事实。

1. **`GET /api/customers/{id}/check-invoices` 可用**（已修复 ID 解析）—— 返回 `{ hasInvoices, invoiceCount }`。
2. **`DELETE /api/invoices/{id}` 现在会重算所属账单 `totalAmount`**（已修复）—— 删除已进表单的发票后账单总额自动回正，可直接删除，无需先卸载。
3. **`GET /api/bills/list` 支持 `startDate`/`endDate`**（已修复）—— 过滤 `createdAt`；纯日期 `endDate` 自动扩展到当天 23:59:59.999Z。
4. **`/api/reports?type=summary` 支持日期过滤** —— `totalAmount`/`totalInvoices` 均受 `startDate`/`endDate` 约束（发票按 `workDate`，账单按 `createdAt`），同时支持 `customerId`。
5. **`type=customer` 的 `totalAmount` 不再翻倍**（已修复）—— `totalAmount === invoiceTotal`（账单金额是发票金额的分组，二者相加必然重复）；`customerId` 参数现在生效（修复前被忽略）。
6. **`type=monthly` 可用**（已修复 SQL 表名，修复前 500）—— 未传 `startDate` 时默认从当年 1 月 1 日起；支持 `customerId`。
7. **PUT/更新类端点省略字段会清空**：`PUT /api/company`、`PUT /api/users/{id}` 省略的可选字段会被置 `null`/`[]`/`false` —— 必须传全量字段。
8. **发票状态只有一个合法值 `ACTIVE`**，任何写入 `PENDING`/`COMPLETED` 到发票的请求都会失败。
9. **报错信息是中文**，统一先判 HTTP 状态码再读 `error` 字段。
10. **所有业务端点强制鉴权**（最新）—— 客户/账单/发票/报表端点无 cookie 或 token 无效 → 401 `{"error":"未授权"}`；首次调用前必须 `POST /api/auth/login` 拿 cookie。公开端点仅：`auth/login`、`auth/logout`、`auth/check-users`、`auth/init-admin`、`auth/me`（自返 401）、`GET /api/company`（脱敏数据）。

---

## 7. 快速决策表

| 用户意图 | 调用 |
|---|---|
| 记一笔账 | `POST /api/customers`（如需）→ `POST /api/invoices/manual` |
| 客户当前总金额 | `GET /api/reports?type=customer` → 读匹配客户的 `invoiceTotal`（`totalAmount` 与之相等，任取其一） |
| 时间段金额 | `GET /api/reports?type=summary&startDate=&endDate=` → 读 `summary.totalAmount` |
| 按客户过滤的时间段金额 | `GET /api/reports?type=customer&customerId=&startDate=&endDate=` → 汇总 `invoiceTotal` |
| 按月金额 | `GET /api/reports?type=monthly&startDate=&endDate=`（缺省从当年 1 月起） |
| 某客户待结账单 | `GET /api/bills/list?status=PENDING&customerId=` |
| 按日期过滤账单列表 | `GET /api/bills/list?status=&startDate=&endDate=`（过滤 `createdAt`） |
| 确认结账 | `PATCH /api/bills/{id}` `{"status":"COMPLETED"}` |
| 退回结账 | `PATCH /api/bills/{id}` `{"status":"PENDING"}` |
| 查看已结账单 | `GET /api/bills/list?status=COMPLETED` |
| 账单明细（打印用） | `GET /api/bills/{id}` + `GET /api/company` |
| 改一条账单 | `PUT /api/invoices/{id}`（totalPrice 自动重算，账单总额联动） |
| 删一条账单 | `DELETE /api/invoices/{id}`（账单总额自动重算，无需先卸载） |
| 新建客户 | `POST /api/customers` |
| 客户有几条账单 | `GET /api/customers` → `_count.invoices`，或 `GET /api/customers/{id}/check-invoices` → `invoiceCount` |
