import api from './api';

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
