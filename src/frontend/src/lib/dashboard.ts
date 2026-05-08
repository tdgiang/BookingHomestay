const API = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface Kpis {
  totalRooms: number;
  checkInsToday: number;
  currentGuests: number;
  revenueThisMonth: number;
  pendingBookings: number;
  occupancyRate: number;
}

export interface RevenuePoint { date: string; revenue: number; }

export interface PendingTask {
  id: string;
  bookingCode: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  room: { id: string; name: string };
  guest: { fullName: string; phone: string };
  payment: { id: string; amount: number; status: string } | null;
}

export interface CalendarEvent {
  id: string;
  bookingCode: string;
  bookingType: string;
  checkIn: string;
  checkOut: string;
  status: string;
  source: string;
  totalPrice: number;
  room: { id: string; name: string };
  guest: { fullName: string };
}

async function fetchAdmin<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}/api/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  const json = await res.json();
  if (json.data === null || json.data === undefined) throw new Error(`API ${path} returned null data`);
  return json.data as T;
}

export const dashboardApi = {
  kpis: (token: string) => fetchAdmin<Kpis>('/admin/dashboard', token),
  revenue: (token: string) => fetchAdmin<RevenuePoint[]>('/admin/dashboard/revenue', token),
  tasks: (token: string) => fetchAdmin<PendingTask[]>('/admin/dashboard/tasks', token),
  calendar: (token: string, year: number, month: number) =>
    fetchAdmin<CalendarEvent[]>(`/admin/dashboard/calendar?year=${year}&month=${month}`, token),
};
