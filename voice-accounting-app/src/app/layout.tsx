import type { Metadata } from "next";
import { headers } from 'next/headers'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

async function getCompanyTitle(): Promise<string> {
  const { prisma } = await import('@/lib/prisma')
  try {
    const company = await prisma.company.findFirst()
    return company?.name || '语音记账系统'
  } catch {
    return '语音记账系统'
  }
}

/**
 * 通过请求头区分真实浏览器访问和平台健康检查。
 *
 * 所有现代浏览器都会发送 sec-fetch-site 头部（Chrome 76+, Firefox 90+, Safari 15.4+），
 * 而 EdgeOne 等 serverless 平台的健康检查 ping 不会设置该头部。
 *
 * 只有检测到浏览器特征时才查询数据库获取公司名称，否则直接返回静态标题，
 * 避免健康检查请求触发不必要的数据库查询。
 */
export async function generateMetadata(): Promise<Metadata> {
  const h = await headers()
  const isRealBrowser = h.has('sec-fetch-site') || h.has('cookie')

  if (!isRealBrowser) {
    return {
      title: '语音记账系统',
      description: '基于语音识别的智能记账系统',
    }
  }

  const companyName = await getCompanyTitle()
  return {
    title: companyName,
    description: `基于语音识别的智能记账系统 - ${companyName}`,
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CompanyProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </CompanyProvider>
      </body>
    </html>
  );
}
