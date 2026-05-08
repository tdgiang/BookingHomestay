'use client';

import { Suspense, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookingSteps } from '@/components/booking/steps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createBooking } from '@/lib/bookings';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ (VD: 0901234567)'),
  email: z.string().email('Email không hợp lệ').or(z.literal('')).optional(),
  specialRequest: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

function InfoContent() {
  const params = useParams<{ roomId: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const [serverError, setServerError] = useState('');

  const mode = sp.get('mode') ?? 'nightly';
  const checkIn = sp.get('checkIn') ?? '';
  const checkOut = sp.get('checkOut') ?? '';
  const durationHours = sp.get('durationHours') ? Number(sp.get('durationHours')) : undefined;
  const adults = Number(sp.get('adults') ?? 1);
  const children = Number(sp.get('children') ?? 0);
  const totalPrice = sp.get('totalPrice') ? Number(sp.get('totalPrice')) : null;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const result = await createBooking({
        roomId: params.roomId,
        bookingType: mode === 'hourly' ? 'HOURLY' : 'NIGHTLY',
        checkIn,
        checkOut,
        durationHours,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || undefined,
        adults,
        children,
        specialRequest: data.specialRequest || undefined,
      });
      router.push(`/booking/${params.roomId}/payment?bookingCode=${result.booking.bookingCode}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const backParams = new URLSearchParams(sp.toString());

  return (
    <div>
      <BookingSteps current={2} />

      <Link
        href={`/booking/${params.roomId}?${backParams.toString()}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors"
      >
        <ChevronLeft size={14} /> Quay lại
      </Link>

      {/* Booking summary bar */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-800">
        {mode === 'nightly' ? (
          <span>
            Check-in <strong>{checkIn.slice(0, 10)}</strong> → Check-out <strong>{checkOut.slice(0, 10)}</strong>
            {' · '}{adults} người lớn{children > 0 ? `, ${children} trẻ em` : ''}
          </span>
        ) : (
          <span>
            Từ <strong>{new Date(checkIn).toLocaleString('vi-VN')}</strong>
            {' · '}{durationHours} giờ{' · '}{adults} người
          </span>
        )}
        {totalPrice && (
          <span className="ml-2 font-semibold text-blue-700">
            · Tổng: {totalPrice.toLocaleString('vi-VN')}₫
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-800">Thông tin khách</h2>

          <div className="space-y-1.5">
            <Label htmlFor="fullName">Họ và tên <span className="text-red-500">*</span></Label>
            <Input id="fullName" placeholder="Nguyễn Văn A" {...register('fullName')} />
            {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Số điện thoại <span className="text-red-500">*</span></Label>
            <Input id="phone" placeholder="0901234567" type="tel" {...register('phone')} />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email <span className="text-slate-400 text-xs">(không bắt buộc)</span></Label>
            <Input id="email" type="email" placeholder="email@example.com" {...register('email')} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="specialRequest">Yêu cầu đặc biệt <span className="text-slate-400 text-xs">(không bắt buộc)</span></Label>
            <Textarea
              id="specialRequest"
              placeholder="Cần thêm gối, đến muộn..."
              rows={3}
              {...register('specialRequest')}
            />
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full h-11 text-base gap-2" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</> : 'Xác nhận đặt phòng'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function BookingInfoPage() {
  return (
    <Suspense>
      <InfoContent />
    </Suspense>
  );
}
