'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Users, ChevronRight, Loader2 } from 'lucide-react';

type Mode = 'nightly' | 'hourly';

interface PriceResult {
  bookingType: string;
  nights?: number;
  hours?: number;
  subtotal: number;
  discount: number;
  discountRate: number;
  totalPrice: number;
}

interface Props {
  roomId: string;
  roomName: string;
  basePrice: number | null;
  initialCheckIn?: string;
  initialCheckOut?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export function BookingWidget({
  roomId,
  basePrice,
  initialCheckIn,
  initialCheckOut,
}: Props) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [mode, setMode] = useState<Mode>('nightly');
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? '');
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? '');
  const [startTime, setStartTime] = useState('');
  const [hours, setHours] = useState(2);
  const [adults, setAdults] = useState(1);
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPrice = useCallback(async () => {
    if (mode === 'nightly' && checkIn && checkOut) {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          bookingType: 'NIGHTLY',
          checkIn: `${checkIn}T14:00:00`,
          checkOut: `${checkOut}T12:00:00`,
        });
        const res = await fetch(`${API_URL}/api/v1/rooms/${roomId}/pricing?${qs}`);
        if (res.ok) {
          const json = await res.json();
          setPriceResult(json.data ?? null);
        } else {
          setPriceResult(null);
        }
      } catch {
        setPriceResult(null);
      } finally {
        setLoading(false);
      }
    } else if (mode === 'hourly' && startTime && hours >= 2) {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          bookingType: 'HOURLY',
          checkIn: startTime,
          durationHours: String(hours),
        });
        const res = await fetch(`${API_URL}/api/v1/rooms/${roomId}/pricing?${qs}`);
        if (res.ok) {
          const json = await res.json();
          setPriceResult(json.data ?? null);
        } else {
          setPriceResult(null);
        }
      } catch {
        setPriceResult(null);
      } finally {
        setLoading(false);
      }
    } else {
      setPriceResult(null);
    }
  }, [mode, checkIn, checkOut, startTime, hours, roomId]);

  useEffect(() => {
    const timer = setTimeout(fetchPrice, 400);
    return () => clearTimeout(timer);
  }, [fetchPrice]);

  const handleBook = () => {
    const params = new URLSearchParams();
    params.set('mode', mode);
    params.set('adults', String(adults));
    if (mode === 'nightly') {
      if (checkIn) params.set('checkIn', checkIn);
      if (checkOut) params.set('checkOut', checkOut);
    } else {
      if (startTime) params.set('startTime', startTime);
      params.set('durationHours', String(hours));
    }
    router.push(`/booking/${roomId}?${params.toString()}`);
  };

  const canBook =
    mode === 'nightly' ? checkIn && checkOut && checkIn < checkOut : startTime && hours >= 2;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5">
      {/* Price headline */}
      <div className="mb-5">
        {basePrice ? (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">
              {basePrice.toLocaleString('vi-VN')}₫
            </span>
            <span className="text-slate-400 text-sm">/đêm</span>
          </div>
        ) : (
          <span className="text-slate-500 text-sm">Liên hệ để biết giá</span>
        )}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 rounded-lg p-1">
        {(['nightly', 'hourly'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setPriceResult(null); }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              mode === m
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {m === 'nightly' ? (
              <><Calendar size={14} /> Theo đêm</>
            ) : (
              <><Clock size={14} /> Theo giờ</>
            )}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="space-y-3 mb-5">
        {mode === 'nightly' ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Check-in</Label>
                <Input
                  type="date"
                  min={today}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Check-out</Label>
                <Input
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Ngày & giờ bắt đầu</Label>
              <Input
                type="datetime-local"
                min={`${today}T00:00`}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Số giờ (tối thiểu 2)</Label>
              <Input
                type="number"
                min={2}
                max={12}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="text-sm"
              />
            </div>
          </>
        )}

        {/* Guests */}
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Số khách</Label>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-slate-400" />
            <Input
              type="number"
              min={1}
              max={10}
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Price preview */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-400">
          <Loader2 size={14} className="animate-spin" />
          Đang tính giá...
        </div>
      )}

      {!loading && priceResult && (
        <div className="mb-5 rounded-xl bg-slate-50 p-4 space-y-2 text-sm">
          {priceResult.nights && (
            <div className="flex justify-between text-slate-600">
              <span>Số đêm</span>
              <span>{priceResult.nights} đêm</span>
            </div>
          )}
          {priceResult.hours && (
            <div className="flex justify-between text-slate-600">
              <span>Số giờ</span>
              <span>{priceResult.hours} giờ</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Tạm tính</span>
            <span>{priceResult.subtotal.toLocaleString('vi-VN')}₫</span>
          </div>
          {priceResult.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Giảm giá ({Math.round(priceResult.discountRate * 100)}%)</span>
              <span>-{priceResult.discount.toLocaleString('vi-VN')}₫</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-200 pt-2 mt-2">
            <span>Tổng cộng</span>
            <span className="text-blue-600">{priceResult.totalPrice.toLocaleString('vi-VN')}₫</span>
          </div>
        </div>
      )}

      <Button
        className="w-full gap-2 h-11 text-base"
        disabled={!canBook}
        onClick={handleBook}
      >
        Đặt phòng ngay
        <ChevronRight size={16} />
      </Button>

      <p className="text-center text-xs text-slate-400 mt-3">
        Không thu phí đặt phòng · Thanh toán tại chỗ
      </p>
    </div>
  );
}
