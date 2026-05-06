'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

type Mode = 'nightly' | 'hourly';

export function SearchWidget({ className }: { className?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('nightly');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [startTime, setStartTime] = useState('');
  const [hours, setHours] = useState(2);
  const [adults, setAdults] = useState(1);

  const today = new Date().toISOString().slice(0, 10);

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set('mode', mode);
    params.set('adults', String(adults));
    if (mode === 'nightly') {
      if (checkIn) params.set('checkIn', checkIn);
      if (checkOut) params.set('checkOut', checkOut);
    } else {
      if (startTime) params.set('checkIn', startTime);
      params.set('durationHours', String(hours));
    }
    router.push(`/rooms?${params.toString()}`);
  };

  return (
    <div className={cn('bg-white rounded-2xl shadow-xl p-6', className)}>
      {/* Mode tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 rounded-lg p-1 w-fit">
        {(['nightly', 'hourly'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              mode === m
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {m === 'nightly' ? '🌙 Theo đêm' : '⏰ Theo giờ'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mode === 'nightly' ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Check-in</Label>
              <Input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Check-out</Label>
              <Input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Ngày & giờ bắt đầu</Label>
              <Input
                type="datetime-local"
                min={`${today}T00:00`}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Số giờ (≥ 2)</Label>
              <Input
                type="number"
                min={2}
                max={12}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500 uppercase tracking-wide">Số khách</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
          />
        </div>

        <div className="flex items-end">
          <Button onClick={handleSearch} className="w-full gap-2 h-10">
            <Search size={15} />
            Tìm phòng
          </Button>
        </div>
      </div>
    </div>
  );
}
