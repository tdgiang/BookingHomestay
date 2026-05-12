import { Suspense } from 'react';
import type { Metadata } from 'next';
import { serverApi } from '@/lib/api';
import { Room } from '@/lib/rooms';
import { RoomsContent } from './rooms-content';

export const metadata: Metadata = {
  title: 'Danh sách phòng — Homestay Đà Lạt',
  description:
    'Khám phá các phòng homestay tại Đà Lạt. Đặt phòng trực tiếp, giá tốt nhất, không qua trung gian.',
  openGraph: {
    title: 'Danh sách phòng — Homestay Đà Lạt',
    description:
      'Khám phá các phòng homestay tại Đà Lạt. Đặt phòng trực tiếp, giá tốt nhất, không qua trung gian.',
    type: 'website',
    locale: 'vi_VN',
  },
  alternates: {
    canonical: '/rooms',
  },
};

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface InitialData {
  items: Room[];
  meta: Meta;
}

async function getInitialRooms(searchParams: Record<string, string>): Promise<InitialData | null> {
  try {
    const { page = '1', sort = 'name', capacity } = searchParams;
    const isDesc = sort.startsWith('-');
    const sortBy = isDesc ? sort.slice(1) : sort;
    const sortOrder = isDesc ? 'desc' : 'asc';

    const params: Record<string, string | number> = {
      page: Number(page),
      limit: 9,
      sortBy,
      sortOrder,
      isActive: 'true',
    };
    if (capacity) params.capacity = capacity;

    const res = await serverApi().get('/rooms', { params });
    return res.data.data ?? null;
  } catch {
    return null;
  }
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const initial = await getInitialRooms(sp);

  return (
    <Suspense>
      <RoomsContent initial={initial} />
    </Suspense>
  );
}
