import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { prisma } from "@/lib/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const company = await prisma.company.findFirst()
    const companyName = company?.name || '语音记账系统'

    return {
      title: companyName,
      description: `基于语音识别的智能记账系统 - ${companyName}`,
    }
  } catch (error) {
    return {
      title: "语音记账系统",
      description: "基于语音识别的智能记账系统",
    }
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
