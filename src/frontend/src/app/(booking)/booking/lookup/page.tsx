'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getBookingByCode, BookingDetail } from '@/lib/bookings';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, CalendarDays, Clock, Users } from 'lucide-react';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xác nhận thanh toán', color: 'text-orange-600 bg-orange-50' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'text-green-600 bg-green-50' },
  CHECKED_IN: { label: 'Đã check-in', color: 'text-blue-600 bg-blue-50' },
  CHECKED_OUT: { label: 'Đã check-out', color: 'text-slate-600 bg-slate-100' },
  CANCELLED: { label: 'Đã hủy', color: 'text-red-600 bg-red-50' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function LookupContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const [code, setCode] = useState(sp.get('code') ?? '');
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setBooking(null);
    try {
      const result = await getBookingByCode(trimmed);
      setBooking(result);
      router.replace(`/booking/lookup?code=${trimmed}`, { scroll: false });
    } catch {
      setError('Không tìm thấy đặt phòng với mã này. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const status = booking ? (STATUS_LABEL[booking.status] ?? STATUS_LABEL.PENDING) : null;

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Tra cứu đặt phòng</h1>
        <p className="text-slate-500">Nhập mã đặt phòng (VD: HSB-20260610-A3F2)</p>
      </div>

      <div className="flex gap-2 mb-6">
        <Input
          placeholder="HSB-YYYYMMDD-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          className="font-mono text-sm h-11"
        />
        <Button onClick={handleSearch} disabled={loading || !code.trim()} className="h-11 gap-2 px-5">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Tra cứu
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {booking && status && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-lg font-bold text-slate-800">{booking.bookingCode}</p>
              <p className="text-slate-500 text-sm">{booking.room.name}</p>
            </div>
            <Badge className={status.color}>{status.label}</Badge>
          </div>

          <div className="space-y-2 text-sm text-slate-600">
            {booking.bookingType === 'NIGHTLY' ? (
              <div className="flex items-center gap-2">
                <CalendarDays size={14} className="text-blue-500" />
                <span>
                  {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-blue-500" />
                <span>
                  {new Date(booking.checkIn).toLocaleString('vi-VN')} · {booking.durationHours} giờ
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users size={14} className="text-blue-500" />
              <span>{booking.guest.fullName} · {booking.guest.phone}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <span className="text-slate-500 text-sm">Tổng thanh toán</span>
            <span className="text-lg font-bold text-blue-600">{booking.totalPrice.toLocaleString('vi-VN')}₫</span>
          </div>

          {booking.payment?.status === 'PENDING' && (
            <a
              href={`/booking/${booking.room.id}/payment?bookingCode=${booking.bookingCode}`}
              className="block w-full text-center h-10 leading-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Xem thông tin thanh toán
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function LookupPage() {
  return (
    <Suspense>
      <LookupContent />
    </Suspense>
  );
}
