'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/cms/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminBookingsApi, adminBookingsExportApi, AdminBooking } from '@/lib/admin-api';
import {
  Search, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2, Download,
} from 'lucide-react';

const STATUS_OPTS = [
  { value: '', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ TT' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'CHECKED_IN', label: 'Check-in' },
  { value: 'CHECKED_OUT', label: 'Check-out' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'text-orange-600 bg-orange-50',
  CONFIRMED: 'text-green-600 bg-green-50',
  CHECKED_IN: 'text-blue-600 bg-blue-50',
  CHECKED_OUT: 'text-slate-600 bg-slate-100',
  CANCELLED: 'text-red-600 bg-red-50',
};

function BookingsContent() {
  const sp = useSearchParams();
  const router = useRouter();

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [meta, setMeta] = useState<{ total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const status = sp.get('status') ?? '';
  const page   = Number(sp.get('page') ?? 1);
  const search = sp.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(search);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' };
      if (status) params.status = status;
      const result = await adminBookingsApi.list(params);
      setBookings(result.items);
      setMeta({ total: result.meta.total, totalPages: result.meta.totalPages });
    } catch { setBookings([]); }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.set('page', '1');
    router.push(`/cms/bookings?${p.toString()}`);
  };

  const confirmPayment = async (booking: AdminBooking) => {
    if (!booking.payment || confirming) return;
    setConfirming(booking.payment.id);
    try {
      await adminBookingsApi.confirmPayment(booking.payment.id);
      await load();
    } finally { setConfirming(null); }
  };

  const changeStatus = async (booking: AdminBooking, newStatus: string) => {
    try {
      await adminBookingsApi.update(booking.id, { status: newStatus });
      await load();
    } catch {}
  };

  return (
    <>
      <Header title="Quản lý đặt phòng" />
      <main className="flex-1 p-6 overflow-auto">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex gap-2 flex-1 min-w-0">
            <Input
              placeholder="Tìm mã đặt phòng..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setParam('search', searchInput)}
              className="h-9 text-sm max-w-xs"
            />
            <Button size="sm" onClick={() => setParam('search', searchInput)} className="gap-1">
              <Search size={13} />
            </Button>
          </div>
          <Select value={status || 'all'} onValueChange={(v) => setParam('status', v === 'all' ? '' : (v ?? ''))}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTS.map((o) => (
                <SelectItem key={o.value || 'all'} value={o.value || 'all'}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {meta && <span className="text-sm text-slate-500">{meta.total} kết quả</span>}
          <Button
            size="sm" variant="outline" className="gap-1.5 ml-auto"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                const p: Record<string, unknown> = {};
                if (status) p.status = status;
                await adminBookingsExportApi.exportCsv(p);
              } finally { setExporting(false); }
            }}
          >
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Export CSV
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mã đặt phòng</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Phòng</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Khách</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Check-in</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trạng thái</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Thanh toán</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tổng</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-400">
                    <Loader2 size={20} className="animate-spin mx-auto" />
                  </td></tr>
                ) : bookings.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">Không tìm thấy đặt phòng nào</td></tr>
                ) : bookings.map((b) => (
                  <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 font-semibold">{b.bookingCode}</td>
                    <td className="px-4 py-3 text-slate-700">{b.room.name}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">{b.guest.fullName}</p>
                      <p className="text-slate-400 text-xs">{b.guest.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {new Date(b.checkIn).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${STATUS_BADGE[b.status] ?? ''}`}>
                        {STATUS_OPTS.find(o => o.value === b.status)?.label ?? b.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {b.payment?.status === 'PAID' ? (
                        <Badge className="text-xs text-green-600 bg-green-50">Đã TT</Badge>
                      ) : b.payment?.status === 'PENDING' ? (
                        <Badge className="text-xs text-orange-600 bg-orange-50">Chờ TT</Badge>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {b.totalPrice.toLocaleString('vi-VN')}₫
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {b.payment?.status === 'PENDING' && b.status === 'PENDING' && (
                          <button
                            onClick={() => confirmPayment(b)}
                            disabled={confirming === b.payment?.id}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                            title="Xác nhận thanh toán"
                          >
                            {confirming === b.payment?.id
                              ? <Loader2 size={11} className="animate-spin" />
                              : <CheckCircle2 size={11} />}
                            Xác nhận TT
                          </button>
                        )}
                        {b.status === 'CONFIRMED' && (
                          <button
                            onClick={() => changeStatus(b, 'CHECKED_IN')}
                            className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            Check-in
                          </button>
                        )}
                        {b.status === 'CHECKED_IN' && (
                          <button
                            onClick={() => changeStatus(b, 'CHECKED_OUT')}
                            className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            Check-out
                          </button>
                        )}
                        {!['CANCELLED', 'CHECKED_OUT'].includes(b.status) && (
                          <button
                            onClick={() => { if (confirm('Hủy booking này?')) adminBookingsApi.cancel(b.id).then(load); }}
                            className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Hủy booking"
                          >
                            <XCircle size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <Button variant="outline" size="sm" disabled={page <= 1}
              onClick={() => setParam('page', String(page - 1))}>
              <ChevronLeft size={14} />
            </Button>
            <span className="text-sm text-slate-500">Trang {page} / {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages}
              onClick={() => setParam('page', String(page + 1))}>
              <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </main>
    </>
  );
}

export default function BookingsPage() {
  return <Suspense><BookingsContent /></Suspense>;
}
