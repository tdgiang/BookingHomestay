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
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 hover:border-sky-200 transition-all duration-300 cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-52 bg-slate-100 overflow-hidden">
        {room.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${API_URL}${room.images[0]}`}
            alt={room.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 gap-2">
            <ImageIcon size={36} />
            <span className="text-xs">Chưa có ảnh</span>
          </div>
        )}
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Amenity badges */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {room.amenities.slice(0, 3).map((a) => (
            <Badge key={a} className="text-xs bg-black/55 text-white border-none backdrop-blur-sm hover:bg-black/55">
              {a}
            </Badge>
          ))}
        </div>
        {/* View button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="bg-white/90 backdrop-blur-sm text-sky-700 font-semibold text-sm px-4 py-1.5 rounded-full flex items-center gap-1.5">
            Xem phòng <ArrowRight size={13} />
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-slate-800 text-base mb-1 group-hover:text-sky-600 transition-colors duration-200">
          {room.name}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem] mb-4 leading-relaxed">
          {room.description ?? 'Phòng nghỉ thoải mái, tiện nghi đầy đủ.'}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Users size={12} /> {room.capacity} khách
            </span>
            {room.area && (
              <span className="flex items-center gap-1">
                <Layers size={12} /> {room.area} m²
              </span>
            )}
          </div>

          <div className="text-right">
            {basePrice ? (
              <div>
                <span className="text-sky-600 font-extrabold text-base">
                  {basePrice.toLocaleString('vi-VN')}₫
                </span>
                <span className="text-xs text-slate-400">/đêm</span>
              </div>
            ) : (
              <span className="text-sky-600 text-sm font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all duration-200">
                Xem giá <ArrowRight size={13} />
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
