'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { BookingSteps } from '@/components/booking/steps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Users, ChevronRight, Loader2, ImageIcon } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface PriceResult {
  bookingType: string;
  nights?: number;
  hours?: number;
  subtotal: number;
  discount: number;
  discountRate: number;
  totalPrice: number;
}

interface RoomInfo {
  id: string;
  name: string;
  images: string[];
  capacity: number;
}

function Step1Content() {
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);
  const initMode = (searchParams.get('mode') ?? 'nightly') as 'nightly' | 'hourly';

  const [mode, setMode] = useState<'nightly' | 'hourly'>(initMode);
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') ?? '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') ?? '');
  const [startTime, setStartTime] = useState(searchParams.get('startTime') ?? '');
  const [hours, setHours] = useState(Number(searchParams.get('durationHours') ?? 2));
  const [adults, setAdults] = useState(Number(searchParams.get('adults') ?? 1));
  const [children, setChildren] = useState(0);
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState<RoomInfo | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/rooms/${params.roomId}`)
      .then((r) => r.json())
      .then((j) => setRoom(j.data))
      .catch(() => null);
  }, [params.roomId]);

  const fetchPrice = useCallback(async () => {
    const roomId = params.roomId;
    if (mode === 'nightly' && checkIn && checkOut && checkIn < checkOut) {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          bookingType: 'NIGHTLY',
          checkIn: `${checkIn}T14:00:00`,
          checkOut: `${checkOut}T12:00:00`,
        });
        const res = await fetch(`${API_URL}/api/v1/rooms/${roomId}/pricing?${qs}`);
        if (res.ok) setPriceResult((await res.json()).data);
        else setPriceResult(null);
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
        if (res.ok) setPriceResult((await res.json()).data);
        else setPriceResult(null);
      } finally {
        setLoading(false);
      }
    } else {
      setPriceResult(null);
    }
  }, [params.roomId, mode, checkIn, checkOut, startTime, hours]);

  useEffect(() => {
    const t = setTimeout(fetchPrice, 400);
    return () => clearTimeout(t);
  }, [fetchPrice]);

  const canContinue =
    mode === 'nightly' ? checkIn && checkOut && checkIn < checkOut : startTime && hours >= 2;

  const handleContinue = () => {
    const p = new URLSearchParams();
    p.set('mode', mode);
    p.set('adults', String(adults));
    p.set('children', String(children));
    if (mode === 'nightly') {
      p.set('checkIn', `${checkIn}T14:00:00`);
      p.set('checkOut', `${checkOut}T12:00:00`);
    } else {
      p.set('checkIn', startTime);
      p.set('checkOut', startTime);
      p.set('durationHours', String(hours));
    }
    if (priceResult) p.set('totalPrice', String(priceResult.totalPrice));
    router.push(`/booking/${params.roomId}/info?${p.toString()}`);
  };

  return (
    <div>
      <BookingSteps current={1} />

      {/* Room summary */}
      {room && (
        <div className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
            {room.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${API_URL}${room.images[0]}`} alt={room.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <ImageIcon size={20} />
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{room.name}</p>
            <p className="text-sm text-slate-500">Sức chứa tối đa {room.capacity} người</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-5">Chọn thời gian</h2>

        {/* Mode switch */}
        <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1">
          {(['nightly', 'hourly'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setPriceResult(null); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all',
                mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
              )}
            >
              {m === 'nightly' ? <><Calendar size={14} /> Theo đêm</> : <><Clock size={14} /> Theo giờ</>}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {mode === 'nightly' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 uppercase tracking-wide">Check-in</Label>
                <Input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 uppercase tracking-wide">Check-out</Label>
                <Input type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 uppercase tracking-wide">Ngày & giờ bắt đầu</Label>
                <Input type="datetime-local" min={`${today}T00:00`} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 uppercase tracking-wide">Số giờ (tối thiểu 2)</Label>
                <Input type="number" min={2} max={12} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 uppercase tracking-wide flex items-center gap-1"><Users size={12} /> Người lớn</Label>
              <Input type="number" min={1} max={10} value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Trẻ em</Label>
              <Input type="number" min={0} max={6} value={children} onChange={(e) => setChildren(Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Price preview */}
        {loading && (
          <div className="flex items-center gap-2 mt-5 text-sm text-slate-400">
            <Loader2 size={14} className="animate-spin" /> Đang tính giá...
          </div>
        )}
        {!loading && priceResult && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4 space-y-2 text-sm border border-slate-100">
            {priceResult.nights && <div className="flex justify-between text-slate-600"><span>Số đêm</span><span>{priceResult.nights} đêm</span></div>}
            {priceResult.hours && <div className="flex justify-between text-slate-600"><span>Số giờ</span><span>{priceResult.hours} giờ</span></div>}
            <div className="flex justify-between text-slate-600"><span>Tạm tính</span><span>{priceResult.subtotal.toLocaleString('vi-VN')}₫</span></div>
            {priceResult.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá ({Math.round(priceResult.discountRate * 100)}%)</span>
                <span>-{priceResult.discount.toLocaleString('vi-VN')}₫</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-200 pt-2 mt-1">
              <span>Tổng cộng</span>
              <span className="text-blue-600">{priceResult.totalPrice.toLocaleString('vi-VN')}₫</span>
            </div>
          </div>
        )}

        <Button className="w-full mt-6 h-11 gap-2 text-base" disabled={!canContinue} onClick={handleContinue}>
          Tiếp tục <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

export default function BookingStep1Page() {
  return (
    <Suspense>
      <Step1Content />
    </Suspense>
  );
}
