import { notFound } from 'next/navigation';
import { serverApi } from '@/lib/api';
import { Room } from '@/lib/rooms';
import { RoomGallery } from '@/components/marketing/room-gallery';
import { BookingWidget } from '@/components/marketing/booking-widget';
import { Badge } from '@/components/ui/badge';
import { Users, Layers, MapPin, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface RoomPriceRule {
  id: string;
  priceType: string;
  price: number;
  minNights?: number;
  startDate?: string;
  endDate?: string;
  fromHour?: number;
  toHour?: number;
  daysOfWeek?: number[];
}

interface RoomDetail extends Room {
  prices?: RoomPriceRule[];
}

async function getRoom(id: string): Promise<RoomDetail | null> {
  try {
    const res = await serverApi().get(`/rooms/${id}`);
    return res.data.data ?? null;
  } catch {
    return null;
  }
}

function resolveBasePrice(prices: RoomPriceRule[] = []): number | null {
  const base = prices.find((p) => p.priceType === 'BASE_NIGHTLY');
  return base?.price ?? null;
}

export default async function RoomDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const room = await getRoom(id);
  if (!room) notFound();

  const checkIn = sp.checkIn ?? '';
  const checkOut = sp.checkOut ?? '';
  const basePrice = resolveBasePrice(room.prices);

  const amenitiesAll = room.amenities ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        href={`/rooms${checkIn ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ''}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ChevronLeft size={15} /> Quay lại danh sách
      </Link>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Left */}
        <div>
          {/* Gallery */}
          <RoomGallery images={room.images} name={room.name} />

          {/* Info */}
          <div className="mt-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">{room.name}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-4">
              <span className="flex items-center gap-1">
                <Users size={14} /> {room.capacity} người
              </span>
              {room.area && (
                <span className="flex items-center gap-1">
                  <Layers size={14} /> {room.area} m²
                </span>
              )}
              {room.floor && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> Tầng {room.floor}
                </span>
              )}
            </div>

            {room.description && (
              <p className="text-slate-600 leading-relaxed mb-6">{room.description}</p>
            )}

            {/* Amenities */}
            {amenitiesAll.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-3">Tiện nghi phòng</h2>
                <div className="flex flex-wrap gap-2">
                  {amenitiesAll.map((a) => (
                    <Badge key={a} variant="secondary" className="text-sm px-3 py-1">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing table */}
            {room.prices && room.prices.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-800 mb-3">Bảng giá</h2>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {room.prices.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-slate-600">{formatPriceType(p)}</span>
                      <span className="font-semibold text-slate-800">
                        {p.price.toLocaleString('vi-VN')}₫
                        <span className="text-slate-400 font-normal">
                          {p.priceType.includes('NIGHTLY') ? '/đêm' : '/giờ'}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — Booking widget */}
        <div className="lg:sticky lg:top-24">
          <BookingWidget
            roomId={room.id}
            roomName={room.name}
            basePrice={basePrice}
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
          />
        </div>
      </div>
    </div>
  );
}

function formatPriceType(p: RoomPriceRule): string {
  switch (p.priceType) {
    case 'BASE_NIGHTLY':
      return `Giá cơ bản${p.minNights ? ` (từ ${p.minNights} đêm)` : ''}`;
    case 'WEEKEND_NIGHTLY':
      return 'Cuối tuần';
    case 'SEASONAL_NIGHTLY':
      return `Mùa cao điểm${p.startDate ? ` (${p.startDate} – ${p.endDate})` : ''}`;
    case 'HOURLY':
      return `Theo giờ${p.fromHour !== undefined ? ` (${p.fromHour}h–${p.toHour}h)` : ''}`;
    default:
      return p.priceType;
  }
}
