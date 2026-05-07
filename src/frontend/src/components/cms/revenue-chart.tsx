'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { RevenuePoint } from '@/lib/dashboard';

function fmt(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  if (!data.length) {
    return <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu doanh thu</div>;
  }

  const display = data.slice(-14).map((d) => ({
    ...d,
    label: d.date.slice(5),
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={display} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={42} />
        <Tooltip
          formatter={(v) => [`${Number(v ?? 0).toLocaleString('vi-VN')}₫`, 'Doanh thu']}
          labelFormatter={(l) => `Ngày ${l}`}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Bar dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
