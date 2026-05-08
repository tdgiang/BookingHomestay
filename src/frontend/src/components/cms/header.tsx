'use client';

import { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Bell, BedDouble } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface BookingNotification {
  id: string;
  bookingCode: string;
  guestName: string;
  roomName: string;
  checkIn: string;
  at: string;
  read: boolean;
}

export function Header({ title }: { title?: string }) {
  const { data: session } = useSession();
  const initials = session?.user?.email?.slice(0, 2).toUpperCase() ?? 'AD';

  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const socket = io(`${apiUrl}/notifications`, {
      transports: ['websocket'],
      reconnectionAttempts: 3,
    });
    socketRef.current = socket;

    socket.on('new_booking', (data: Omit<BookingNotification, 'id' | 'read'>) => {
      setNotifications((prev) =>
        [{ ...data, id: Date.now().toString(), read: false }, ...prev].slice(0, 15),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0">
      <h1 className="font-semibold text-slate-800 text-base">{title ?? 'Admin Dashboard'}</h1>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <DropdownMenu open={notifOpen} onOpenChange={(open) => {
          setNotifOpen(open);
          if (open) markAllRead();
        }}>
          <DropdownMenuTrigger className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors outline-none">
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-700">Thông báo</span>
              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Chưa có thông báo</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-slate-50 last:border-0 ${
                      !n.read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                        <BedDouble size={13} className="text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 leading-snug">
                          Đặt phòng mới — <span className="font-mono">{n.bookingCode}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {n.guestName} · {n.roomName}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
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
      </div>
    </header>
  );
}
