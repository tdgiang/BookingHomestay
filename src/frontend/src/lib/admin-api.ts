import api from './api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface AdminBooking {
  id: string;
  bookingCode: string;
  bookingType: 'NIGHTLY' | 'HOURLY';
  checkIn: string;
  checkOut: string;
  durationHours: number | null;
  adults: number;
  children: number;
  specialRequest: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  totalPrice: number;
  source: string;
  internalNote: string | null;
  room: { id: string; name: string; images: string[] };
  guest: { id: string; fullName: string; phone: string; email: string | null };
  payment: { id: string; amount: number; status: 'PENDING' | 'PAID' | 'REFUNDED'; bankRef: string | null } | null;
}

export interface AdminPriceRule {
  id: string;
  roomId: string;
  priceType: 'BASE_NIGHTLY' | 'WEEKEND_NIGHTLY' | 'SEASONAL_NIGHTLY' | 'HOURLY';
  price: number;
  startDate: string | null;
  endDate: string | null;
  daysOfWeek: number[];
  hourFrom: number | null;
  hourTo: number | null;
  minNights: number | null;
  discount: number | null;
}

export const adminBookingsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ data: { items: AdminBooking[]; meta: { total: number; page: number; limit: number; totalPages: number } } }>(
      '/admin/bookings', { params }
    ).then(r => r.data.data),

  get: (id: string) =>
    api.get<{ data: AdminBooking }>(`/admin/bookings/${id}`).then(r => r.data.data),

  update: (id: string, payload: { status?: string; internalNote?: string }) =>
    api.patch<{ data: AdminBooking }>(`/admin/bookings/${id}`, payload).then(r => r.data.data),

  cancel: (id: string) =>
    api.delete(`/admin/bookings/${id}`),

  confirmPayment: (paymentId: string, bankRef?: string) =>
    api.patch(`/admin/payments/${paymentId}/confirm`, { bankRef }),
};

export interface AdminGuest {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GuestBookingHistory {
  id: string;
  bookingCode: string;
  bookingType: 'NIGHTLY' | 'HOURLY';
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
  room: { id: string; name: string; images: string[] };
  payment: { id: string; status: string; amount: number } | null;
}

export const adminGuestsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ data: { items: AdminGuest[]; meta: { total: number; page: number; limit: number; totalPages: number } } }>(
      '/admin/guests', { params }
    ).then(r => r.data.data),

  get: (id: string) =>
    api.get<{ data: AdminGuest }>(`/admin/guests/${id}`).then(r => r.data.data),

  history: (id: string) =>
    api.get<{ data: GuestBookingHistory[] }>(`/admin/guests/${id}/history`).then(r => r.data.data),

  update: (id: string, payload: { tags?: string[]; notes?: string }) =>
    api.patch<{ data: AdminGuest }>(`/admin/guests/${id}`, payload).then(r => r.data.data),

  exportCsv: async (params?: Record<string, unknown>) => {
    const session = await import('next-auth/react').then(m => m.getSession());
    const url = `${API_BASE}/api/v1/admin/guests/export${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${session?.accessToken ?? ''}` } });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'guests.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  },
};

export const adminBookingsExportApi = {
  exportCsv: async (params?: Record<string, unknown>) => {
    const session = await import('next-auth/react').then(m => m.getSession());
    const url = `${API_BASE}/api/v1/admin/bookings/export${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${session?.accessToken ?? ''}` } });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bookings.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  },
};

export const adminPricingApi = {
  listByRoom: (roomId: string) =>
    api.get<{ data: AdminPriceRule[] }>(`/admin/pricing/rooms/${roomId}`).then(r => r.data.data),

  create: (roomId: string, payload: Omit<AdminPriceRule, 'id' | 'roomId'>) =>
    api.post<{ data: AdminPriceRule }>(`/admin/pricing/rooms/${roomId}`, payload).then(r => r.data.data),

  update: (id: string, payload: Partial<Omit<AdminPriceRule, 'id' | 'roomId'>>) =>
    api.patch<{ data: AdminPriceRule }>(`/admin/pricing/${id}`, payload).then(r => r.data.data),

  remove: (id: string) =>
    api.delete(`/admin/pricing/${id}`),
};
