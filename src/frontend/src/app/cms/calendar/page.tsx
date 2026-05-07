'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/cms/header';
import { Button } from '@/components/ui/button';
import { dashboardApi, CalendarEvent } from '@/lib/dashboard';
import { adminBookingsApi } from '@/lib/admin-api';
import { useSession } from 'next-auth/react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-orange-300 border-orange-400',
  CONFIRMED: 'bg-green-400 border-green-500',
  CHECKED_IN: 'bg-blue-400 border-blue-500',
  CHECKED_OUT: 'bg-slate-300 border-slate-400',
  CANCELLED: 'bg-red-200 border-red-300',
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function CalendarContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const now = new Date();
  const [year, setYear] = useState(Number(sp.get('year') ?? now.getFullYear()));
  const [month, setMonth] = useState(Number(sp.get('month') ?? now.getMonth() + 1));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ event: CalendarEvent; x: number; y: number } | null>(null);

  const token = (session as any)?.accessToken ?? '';

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [evts, roomsData] = await Promise.all([
        dashboardApi.calendar(token, year, month),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/rooms`,
          { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json()).then(j => j.data?.items ?? []),
      ]);
      setEvents(evts);
      setRooms(roomsData.map((r: any) => ({ id: r.id, name: r.name })));
    } finally { setLoading(false); }
  }, [token, year, month]);

  useEffect(() => { load(); }, [load]);

  const navigate = (dir: -1 | 1) => {
    let m = month + dir; let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setYear(y); setMonth(m);
    router.replace(`/cms/calendar?year=${y}&month=${m}`, { scroll: false });
  };

  const days = daysInMonth(year, month);
  const dayNums = Array.from({ length: days }, (_, i) => i + 1);
  const today = now.getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;

  const getEventsForRoom = (roomId: string) =>
    events.filter((e) => e.room.id === roomId && e.source !== 'block');

  const getBlocksForRoom = (roomId: string) =>
    events.filter((e) => e.room.id === roomId && e.source === 'block');

  function eventSpan(e: CalendarEvent) {
    const ci = new Date(e.checkIn);
    const co = new Date(e.checkOut);
    const start = Math.max(1, ci.getDate());
    const end   = Math.min(days, co.getDate());
    return { start, span: end - start + 1 };
  }

  return (
    <>
      <Header title="Lịch đặt phòng" />
      <main className="flex-1 p-6 overflow-auto">
        {/* Controls */}
        <div className="flex items-center gap-3 mb-5">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}><ChevronLeft size={14} /></Button>
          <h2 className="text-base font-semibold text-slate-800 w-36 text-center">
            Tháng {month}/{year}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigate(1)}><ChevronRight size={14} /></Button>
          <Button variant="outline" size="sm" className="ml-2 text-xs"
            onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}>
            Hôm nay
          </Button>
          <span className="ml-auto text-xs text-slate-400">{events.length} booking trong tháng</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="border-collapse min-w-max w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left text-slate-500 font-semibold w-32 min-w-[8rem] border-r border-slate-200">
                    Phòng
                  </th>
                  {dayNums.map((d) => (
                    <th key={d} className={cn(
                      'w-8 min-w-[2rem] px-0 py-2 text-center font-medium',
                      isCurrentMonth && d === today ? 'text-blue-600 bg-blue-50' : 'text-slate-500',
                    )}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map((room, ri) => {
                  const roomEvents = getEventsForRoom(room.id);
                  const roomBlocks = getBlocksForRoom(room.id);

                  return (
                    <tr key={room.id} className={cn('border-b border-slate-100', ri % 2 === 1 && 'bg-slate-50/50')}>
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 font-medium text-slate-700 border-r border-slate-200 truncate max-w-[8rem]">
                        {room.name}
                      </td>
                      {dayNums.map((d) => {
                        const dayDate = new Date(year, month - 1, d);

                        const bookingOnDay = roomEvents.find((e) => {
                          const ci = new Date(e.checkIn);
                          const co = new Date(e.checkOut);
                          return ci.getDate() === d && ci.getMonth() + 1 === month;
                        });

                        const blocked = roomBlocks.some((e) => {
                          const ci = new Date(e.checkIn);
                          const co = new Date(e.checkOut);
                          return dayDate >= ci && dayDate < co;
                        });

                        const ongoing = roomEvents.find((e) => {
                          const ci = new Date(e.checkIn);
                          const co = new Date(e.checkOut);
                          return dayDate > ci && dayDate < co;
                        });

                        if (bookingOnDay) {
                          const { span } = eventSpan(bookingOnDay);
                          return (
                            <td key={d} className={cn(
                              'relative h-8 px-0',
                              isCurrentMonth && d === today && 'border-l-2 border-blue-400',
                            )}>
                              <div
                                className={cn(
                                  'absolute inset-y-1 left-0 rounded-l border-l-2 cursor-pointer flex items-center pl-1 overflow-hidden text-white font-semibold',
                                  STATUS_COLOR[bookingOnDay.status] ?? 'bg-slate-300',
                                )}
                                style={{ width: `${span * 2}rem`, zIndex: 2 }}
                                onMouseEnter={(ev) => setTooltip({ event: bookingOnDay, x: ev.clientX, y: ev.clientY })}
                                onMouseLeave={() => setTooltip(null)}
                              >
                                <span className="truncate text-xs">{bookingOnDay.guest.fullName}</span>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={d} className={cn(
                            'h-8 border-l border-slate-100 px-0',
                            blocked && 'bg-slate-200',
                            ongoing && 'bg-current opacity-30',
                            isCurrentMonth && d === today && 'border-l-2 border-blue-400',
                          )} />
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-600">
          {Object.entries({ PENDING: 'Chờ TT', CONFIRMED: 'Đã xác nhận', CHECKED_IN: 'Check-in' }).map(([k, label]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={`inline-block w-3 h-3 rounded-sm ${STATUS_COLOR[k]}`} />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-slate-200 border border-slate-300" />
            Block
          </span>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs space-y-1 pointer-events-none"
            style={{ top: tooltip.y + 12, left: tooltip.x + 8 }}
          >
            <p className="font-mono font-semibold text-slate-800">{tooltip.event.bookingCode}</p>
            <p className="text-slate-600">{tooltip.event.guest.fullName}</p>
            <p className="text-slate-500">
              {new Date(tooltip.event.checkIn).toLocaleDateString('vi-VN')}
              {' → '}
              {new Date(tooltip.event.checkOut).toLocaleDateString('vi-VN')}
            </p>
            <p className="text-blue-600 font-semibold">{tooltip.event.totalPrice.toLocaleString('vi-VN')}₫</p>
          </div>
        )}
      </main>
    </>
  );
}

export default function CalendarPage() {
  return <Suspense><CalendarContent /></Suspense>;
}
