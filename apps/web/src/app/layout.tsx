import './globals.css';
import type { Metadata, Viewport } from 'next';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';

export const metadata: Metadata = {
  title: 'BrewLite - Đặt món & Cà phê SGU',
  description: 'Hệ thống gọi món trực tuyến nhanh chóng, tinh gọn cho chuỗi cà phê và trà',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#874921',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased min-h-screen text-stone-900 bg-stone-100/50">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
