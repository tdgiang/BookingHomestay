import Link from 'next/link';
import { Room } from '@/lib/rooms';
import { Badge } from '@/components/ui/badge';
import { Users, Layers, ImageIcon, ArrowRight } from 'lucide-react';

interface Props {
  room: Room;
  checkIn?: string;
  checkOut?: string;
  basePrice?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export function RoomCard({ room, checkIn, checkOut, basePrice }: Props) {
  const params = new URLSearchParams();
  if (checkIn) params.set('checkIn', checkIn);
  if (checkOut) params.set('checkOut', checkOut);
  const href = `/rooms/${room.id}${params.size ? `?${params}` : ''}`;

  return (
    <Link
      href={href}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-slate-100 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative h-52 bg-slate-100 overflow-hidden">
        {room.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${API_URL}${room.images[0]}`}
            alt={room.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <ImageIcon size={40} />
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {room.amenities.slice(0, 3).map((a) => (
            <Badge key={a} className="text-xs bg-black/60 text-white border-none hover:bg-black/60">
              {a}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-slate-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">
          {room.name}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem] mb-4">
          {room.description ?? 'Phòng nghỉ thoải mái, tiện nghi đầy đủ.'}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Users size={13} /> {room.capacity} người
            </span>
            {room.area && (
              <span className="flex items-center gap-1">
                <Layers size={13} /> {room.area} m²
              </span>
            )}
          </div>

          <div className="text-right">
            {basePrice ? (
              <div>
                <span className="text-blue-600 font-bold">
                  {basePrice.toLocaleString('vi-VN')}₫
                </span>
                <span className="text-xs text-slate-400">/đêm</span>
              </div>
            ) : (
              <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                Xem giá <ArrowRight size={13} />
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
