import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { getSystemConfig } from '@/lib/db';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSystemConfig();
  const siteName = config.siteConfig?.siteName || 'SanHub';
  const description = config.siteConfig?.siteDescription || '整合 Sora 视频/图像 + Gemini 图像生成服务';
  
  return {
    title: `${siteName} - AI 内容生成平台`,
    description,
    icons: {
      icon: '/favicon.ico',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
