import { notFound } from 'next/navigation';
import { getBookingByCode } from '@/lib/bookings';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, CalendarDays, Clock, Users, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xác nhận thanh toán', color: 'text-orange-600 bg-orange-50' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'text-green-600 bg-green-50' },
  CHECKED_IN: { label: 'Đã check-in', color: 'text-blue-600 bg-blue-50' },
  CHECKED_OUT: { label: 'Đã check-out', color: 'text-slate-600 bg-slate-100' },
  CANCELLED: { label: 'Đã hủy', color: 'text-red-600 bg-red-50' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const code = sp.code;
  if (!code) notFound();

  let booking;
  try {
    booking = await getBookingByCode(code);
  } catch {
    notFound();
  }

  const status = STATUS_LABEL[booking.status] ?? STATUS_LABEL.PENDING;
  const isNightly = booking.bookingType === 'NIGHTLY';

  return (
    <div className="space-y-5">
      {/* Success header */}
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Đặt phòng thành công!</h1>
        <p className="text-slate-500 mt-1">Chúng tôi đã nhận được yêu cầu của bạn.</p>
      </div>

      {/* Booking code */}
      <div className="bg-blue-600 text-white rounded-2xl p-5 text-center">
        <p className="text-blue-200 text-sm mb-1">Mã đặt phòng của bạn</p>
        <p className="text-3xl font-mono font-bold tracking-widest">{booking.bookingCode}</p>
        <p className="text-blue-200 text-xs mt-2">Lưu lại mã này để tra cứu trạng thái</p>
      </div>

      {/* Booking details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">{booking.room.name}</h2>
          <Badge className={status.color}>{status.label}</Badge>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-slate-600">
            <CalendarDays size={15} className="text-blue-500 shrink-0" />
            {isNightly ? (
              <span>
                Check-in: <strong>{formatDate(booking.checkIn)}</strong>
                {' → '}
                Check-out: <strong>{formatDate(booking.checkOut)}</strong>
              </span>
            ) : (
              <span>
                Từ: <strong>{new Date(booking.checkIn).toLocaleString('vi-VN')}</strong>
              </span>
            )}
          </div>
          {!isNightly && (
            <div className="flex items-center gap-3 text-slate-600">
              <Clock size={15} className="text-blue-500 shrink-0" />
              <span>Số giờ: <strong>{booking.durationHours} giờ</strong></span>
            </div>
          )}
          <div className="flex items-center gap-3 text-slate-600">
            <Users size={15} className="text-blue-500 shrink-0" />
            <span>{booking.adults} người lớn{booking.children > 0 ? `, ${booking.children} trẻ em` : ''}</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
          <span className="text-slate-600">Tổng thanh toán</span>
          <span className="text-xl font-bold text-blue-600">{booking.totalPrice.toLocaleString('vi-VN')}₫</span>
        </div>
      </div>

      {/* Guest info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-3">Thông tin khách</h3>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-slate-400" />
            <span>{booking.guest.fullName} · {booking.guest.phone}</span>
          </div>
          {booking.guest.email && (
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-slate-400" />
              <span>{booking.guest.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment status note */}
      {booking.payment?.status === 'PENDING' && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
          💳 Vui lòng chuyển khoản theo thông tin đã cung cấp. Đặt phòng sẽ được xác nhận sau khi thanh toán.
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/booking/lookup"
          className="flex-1 flex items-center justify-center h-11 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
        >
          Tra cứu trạng thái
        </Link>
        <Link
          href="/"
          className="flex-1 flex items-center justify-center h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
