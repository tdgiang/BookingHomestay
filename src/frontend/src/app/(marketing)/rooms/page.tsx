'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RoomCard } from '@/components/marketing/room-card';
import { Room } from '@/lib/rooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const LIMIT = 9;

export default function RoomsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const checkIn = searchParams.get('checkIn') ?? '';
  const checkOut = searchParams.get('checkOut') ?? '';
  const mode = searchParams.get('mode') ?? 'nightly';
  const adults = searchParams.get('adults') ?? '1';

  const [capacity, setCapacity] = useState(searchParams.get('capacity') ?? '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'name');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1));

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: LIMIT,
        sort,
        isActive: 'true',
      };
      if (capacity) params.capacity = capacity;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
      ).toString();
      const res = await fetch(`${apiUrl}/api/v1/rooms?${qs}`);
      const json = await res.json();
      const data = json.data;
      setRooms(data?.items ?? []);
      setMeta(data?.meta ?? null);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort, capacity]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const applyFilters = () => {
    const p = new URLSearchParams(searchParams.toString());
    if (capacity) p.set('capacity', capacity); else p.delete('capacity');
    if (minPrice) p.set('minPrice', minPrice); else p.delete('minPrice');
    if (maxPrice) p.set('maxPrice', maxPrice); else p.delete('maxPrice');
    p.set('sort', sort);
    p.set('page', '1');
    router.push(`/rooms?${p.toString()}`);
    setPage(1);
  };

  const clearFilters = () => {
    setCapacity('');
    setMinPrice('');
    setMaxPrice('');
    setSort('name');
    setPage(1);
    router.push('/rooms');
  };

  const hasActiveFilters = capacity || minPrice || maxPrice || sort !== 'name';

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Danh sách phòng</h1>
          {meta && (
            <p className="text-sm text-slate-500 mt-0.5">{meta.total} phòng có sẵn</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-slate-500">
              <X size={14} /> Xóa bộ lọc
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal size={15} />
            Bộ lọc
          </Button>
          <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Tên phòng</SelectItem>
              <SelectItem value="capacity">Số khách</SelectItem>
              <SelectItem value="-createdAt">Mới nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search params summary */}
      {(checkIn || checkOut) && (
        <div className="mb-5 p-3 bg-blue-50 rounded-xl text-sm text-blue-700 flex items-center gap-2">
          <Search size={14} />
          {mode === 'nightly' && checkIn && checkOut && (
            <span>
              Check-in: <strong>{checkIn}</strong> → Check-out: <strong>{checkOut}</strong>
              {adults && <> · <strong>{adults}</strong> khách</>}
            </span>
          )}
          {mode === 'hourly' && checkIn && (
            <span>
              Từ: <strong>{new Date(checkIn).toLocaleString('vi-VN')}</strong>
              {adults && <> · <strong>{adults}</strong> khách</>}
            </span>
          )}
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Số khách (tối thiểu)</Label>
              <Input
                type="number"
                min={1}
                max={10}
                placeholder="Tất cả"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Giá từ (₫)</Label>
              <Input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Giá đến (₫)</Label>
              <Input
                type="number"
                placeholder="Không giới hạn"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full gap-2">
                <Search size={15} />
                Áp dụng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rooms grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-slate-100">
              <Skeleton className="h-52 w-full" />
              <div className="p-5 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg font-medium">Không tìm thấy phòng nào</p>
          <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc ngày tìm kiếm</p>
          <Button variant="outline" className="mt-4" onClick={clearFilters}>
            Xem tất cả phòng
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              checkIn={checkIn || undefined}
              checkOut={checkOut || undefined}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ← Trước
          </Button>
          {Array.from({ length: meta.totalPages }).map((_, i) => (
            <Button
              key={i}
              variant={page === i + 1 ? 'default' : 'outline'}
              size="sm"
              className="w-9"
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Sau →
          </Button>
        </div>
      )}
    </div>
  );
}
