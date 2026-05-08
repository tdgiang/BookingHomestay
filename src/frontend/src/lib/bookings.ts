const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface CreateBookingPayload {
  roomId: string;
  bookingType: 'NIGHTLY' | 'HOURLY';
  checkIn: string;
  checkOut: string;
  durationHours?: number;
  fullName: string;
  phone: string;
  email?: string;
  adults?: number;
  children?: number;
  specialRequest?: string;
}

export interface BookingDetail {
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
  room: { id: string; name: string; images: string[]; floor: number | null };
  guest: { id: string; fullName: string; phone: string; email: string | null };
  payment: {
    id: string;
    amount: number;
    method: string;
    status: 'PENDING' | 'PAID' | 'REFUNDED';
    bankRef: string | null;
    paidAt: string | null;
  } | null;
}

export async function createBooking(payload: CreateBookingPayload): Promise<{ booking: BookingDetail; priceResult: unknown }> {
  const res = await fetch(`${API_URL}/api/v1/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message ?? json?.message ?? 'Đặt phòng thất bại';
    throw new Error(Array.isArray(msg) ? msg[0] : msg);
  }
  return json.data;
}

export async function getBookingByCode(bookingCode: string): Promise<BookingDetail> {
  const res = await fetch(`${API_URL}/api/v1/bookings/code/${encodeURIComponent(bookingCode)}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message ?? 'Không tìm thấy đặt phòng');
  return json.data;
}
