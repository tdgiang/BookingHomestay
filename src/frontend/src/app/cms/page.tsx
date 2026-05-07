import { Header } from '@/components/cms/header';
import { RevenueChart } from '@/components/cms/revenue-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dashboardApi } from '@/lib/dashboard';
import { auth } from '@/lib/auth';
import {
  BedDouble, CalendarDays, Users, TrendingUp, Clock, CheckCircle2, BarChart2,
} from 'lucide-react';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-orange-600 bg-orange-50',
  CONFIRMED: 'text-green-600 bg-green-50',
  CHECKED_IN: 'text-blue-600 bg-blue-50',
  CHECKED_OUT: 'text-slate-600 bg-slate-100',
  CANCELLED: 'text-red-600 bg-red-50',
};

export default async function DashboardPage() {
  const session = await auth();
  const token = (session as any)?.accessToken ?? '';

  const [kpis, revenue, tasks] = await Promise.all([
    dashboardApi.kpis(token).catch(() => null),
    dashboardApi.revenue(token).catch(() => []),
    dashboardApi.tasks(token).catch(() => []),
  ]);

  const KPI_CARDS = [
    { label: 'Tổng số phòng', value: kpis?.totalRooms ?? '—', icon: BedDouble, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Check-in hôm nay', value: kpis?.checkInsToday ?? '—', icon: CalendarDays, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Khách đang ở', value: kpis?.currentGuests ?? '—', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
    {
      label: 'Doanh thu tháng',
      value: kpis ? `${(kpis.revenueThisMonth / 1_000_000).toFixed(1)}M₫` : '—',
      icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50',
    },
    {
      label: 'Công suất hôm nay',
      value: kpis ? `${kpis.occupancyRate}%` : '—',
      icon: BarChart2, color: 'text-teal-600', bg: 'bg-teal-50',
    },
    {
      label: 'Chờ xác nhận',
      value: kpis?.pendingBookings ?? '—',
      icon: Clock, color: 'text-red-600', bg: 'bg-red-50',
    },
  ];

  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 p-6 space-y-6 overflow-auto">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {KPI_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-slate-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</CardTitle>
                <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon size={15} className={color} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Revenue Chart */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <BarChart2 size={15} className="text-blue-500" />
                Doanh thu 14 ngày gần nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenue as any} />
            </CardContent>
          </Card>

          {/* Task list */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock size={15} className="text-orange-500" />
                Chờ xác nhận ({tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-slate-400 text-sm">
                  <CheckCircle2 size={24} className="text-green-400" />
                  <p>Không có booking nào đang chờ</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {tasks.map((t) => (
                    <li key={t.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                      <Link href={`/cms/bookings/${t.id}`} className="block">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-mono text-xs font-semibold text-slate-700 truncate">{t.bookingCode}</p>
                            <p className="text-xs text-slate-500 truncate">{t.room.name} · {t.guest.fullName}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(t.checkIn).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-blue-600 shrink-0">
                            {(t.totalPrice / 1000).toFixed(0)}K₫
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
