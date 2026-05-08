'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { href: '/rooms', label: 'Xem phòng' },
  { href: '/#amenities', label: 'Tiện nghi' },
  { href: '/#location', label: 'Vị trí' },
  { href: '/#contact', label: 'Liên hệ' },
];

export function NavHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-slate-800 flex items-center gap-2">
          <span className="text-2xl">🏡</span>
          <span>Homestay</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Button size="sm" nativeButton={false} render={<Link href="/rooms" />}>
            Đặt phòng ngay
          </Button>
        </nav>

        {/* Mobile menu */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block text-sm text-slate-700 py-1"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Button size="sm" className="w-full" nativeButton={false} render={<Link href="/rooms" />}>
            Đặt phòng ngay
          </Button>
        </div>
      )}
    </header>
  );
}
