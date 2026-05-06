import { Header } from '@/components/cms/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BedDouble, CalendarDays, Users, TrendingUp } from 'lucide-react';

const KPI_CARDS = [
  { label: 'Tổng số phòng', value: '—', icon: BedDouble, color: 'text-blue-600' },
  { label: 'Đặt phòng hôm nay', value: '—', icon: CalendarDays, color: 'text-green-600' },
  { label: 'Khách đang ở', value: '—', icon: Users, color: 'text-violet-600' },
  { label: 'Doanh thu tháng', value: '—', icon: TrendingUp, color: 'text-orange-600' },
];

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {KPI_CARDS.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
                <Icon size={18} className={color} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-slate-400 text-sm">Dashboard sẽ được hoàn thiện ở Phase 4.</p>
      </main>
    </>
  );
}
