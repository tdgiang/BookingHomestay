import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const SITE_NAME = 'Homestay Đà Lạt';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Đặt phòng trực tiếp`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Homestay tại Đà Lạt — đặt phòng trực tiếp, giá tốt nhất, không qua trung gian. Phòng riêng tư, tiện nghi đầy đủ, vị trí đẹp.',
  keywords: ['homestay đà lạt', 'đặt phòng đà lạt', 'phòng trọ đà lạt', 'du lịch đà lạt'],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Đặt phòng trực tiếp`,
    description:
      'Homestay tại Đà Lạt — đặt phòng trực tiếp, giá tốt nhất, không qua trung gian.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Đặt phòng trực tiếp`,
    description:
      'Homestay tại Đà Lạt — đặt phòng trực tiếp, giá tốt nhất, không qua trung gian.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
