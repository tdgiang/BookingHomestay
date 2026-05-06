'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  Users,
  BadgeDollarSign,
  BookOpen,
} from 'lucide-react';

const NAV = [
  { href: '/cms', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/cms/rooms', label: 'Quản lý phòng', icon: BedDouble },
  { href: '/cms/calendar', label: 'Lịch đặt phòng', icon: CalendarDays },
  { href: '/cms/bookings', label: 'Đặt phòng', icon: BookOpen },
  { href: '/cms/pricing', label: 'Bảng giá', icon: BadgeDollarSign },
  { href: '/cms/guests', label: 'Khách hàng', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-200 flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-slate-700">
        <span className="font-bold text-lg text-white">🏡 Homestay Admin</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
