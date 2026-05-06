'use client';

import { signOut, useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';

export function Header({ title }: { title?: string }) {
  const { data: session } = useSession();
  const initials = session?.user?.email?.slice(0, 2).toUpperCase() ?? 'AD';

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0">
      <h1 className="font-semibold text-slate-800 text-base">{title ?? 'Admin Dashboard'}</h1>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition-colors outline-none">
          <span className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
            {initials}
          </span>
          <span className="hidden sm:block">{session?.user?.email}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-red-600 cursor-pointer"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut size={14} className="mr-2" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
