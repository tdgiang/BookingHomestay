import { notFound } from 'next/navigation';
import { getBookingByCode } from '@/lib/bookings';
import { BookingSteps } from '@/components/booking/steps';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Users, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const BANK_ID = process.env.NEXT_PUBLIC_BANK_ID ?? '970436';
const ACCOUNT_NO = process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? '1234567890';
const ACCOUNT_NAME = process.env.NEXT_PUBLIC_BANK_NAME ?? 'NGUYEN VAN A';

function vietqrUrl(amount: number, info: string) {
  const params = new URLSearchParams({ amount: String(amount), addInfo: info, accountName: ACCOUNT_NAME });
  return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?${params}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const bookingCode = sp.bookingCode;
  if (!bookingCode) notFound();

  let booking;
  try {
    booking = await getBookingByCode(bookingCode);
  } catch {
    notFound();
  }

  const qrUrl = vietqrUrl(booking.totalPrice, bookingCode);
  const isNightly = booking.bookingType === 'NIGHTLY';

  return (
    <div>
      <BookingSteps current={3} />

      <div className="space-y-4">
        {/* Booking summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{booking.room.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Mã đặt phòng: <span className="font-mono font-semibold text-slate-800">{booking.bookingCode}</span>
              </p>
            </div>
            <Badge variant="secondary" className="text-orange-600 bg-orange-50">Chờ thanh toán</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <CalendarDays size={14} className="text-blue-500" />
              <div>
                <p className="text-xs text-slate-400">Check-in</p>
                <p className="font-medium">{formatDate(booking.checkIn)}</p>
              </div>
            </div>
            {isNightly ? (
              <div className="flex items-center gap-2 text-slate-600">
                <CalendarDays size={14} className="text-blue-500" />
                <div>
                  <p className="text-xs text-slate-400">Check-out</p>
                  <p className="font-medium">{formatDate(booking.checkOut)}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-600">
                <Clock size={14} className="text-blue-500" />
                <div>
                  <p className="text-xs text-slate-400">Số giờ</p>
                  <p className="font-medium">{booking.durationHours} giờ</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-600">
              <Users size={14} className="text-blue-500" />
              <div>
                <p className="text-xs text-slate-400">Khách</p>
                <p className="font-medium">{booking.adults} người lớn{booking.children > 0 ? `, ${booking.children} trẻ em` : ''}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-600 font-medium">Tổng thanh toán</span>
            <span className="text-2xl font-bold text-blue-600">{booking.totalPrice.toLocaleString('vi-VN')}₫</span>
          </div>
        </div>

        {/* QR Payment */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Thanh toán qua chuyển khoản</h3>

          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {/* QR code */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="QR VietQR"
                width={200}
                height={200}
                className="rounded-xl border border-slate-200 shadow-sm"
              />
              <p className="text-xs text-slate-400">Quét mã bằng app ngân hàng</p>
            </div>

            {/* Manual info */}
            <div className="space-y-3 text-sm flex-1 w-full">
              <InfoRow label="Ngân hàng" value="Vietcombank (VCB)" />
              <InfoRow label="Số tài khoản" value={ACCOUNT_NO} mono />
              <InfoRow label="Chủ tài khoản" value={ACCOUNT_NAME} />
              <InfoRow label="Số tiền" value={`${booking.totalPrice.toLocaleString('vi-VN')} VND`} highlight />
              <InfoRow label="Nội dung CK" value={bookingCode} mono highlight />
            </div>
          </div>

          <div className="mt-5 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
            ⚠️ Vui lòng ghi đúng nội dung chuyển khoản <strong>{bookingCode}</strong> để hệ thống tự động xác nhận.
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/booking/success?code=${bookingCode}`}
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            <CheckCircle2 size={16} /> Tôi đã chuyển khoản
          </Link>
          <Link
            href="/rooms"
            className="flex-1 flex items-center justify-center h-11 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            Xem phòng khác
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className={cn('text-right', mono && 'font-mono', highlight && 'font-semibold text-blue-600')}>
        {value}
      </span>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
