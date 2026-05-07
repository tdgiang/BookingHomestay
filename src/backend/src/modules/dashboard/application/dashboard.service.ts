import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BookingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis() {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      totalRooms,
      checkInsToday,
      currentGuests,
      revenueResult,
      pendingCount,
    ] = await Promise.all([
      this.prisma.room.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.booking.count({
        where: {
          deletedAt: null,
          status: { not: BookingStatus.CANCELLED },
          checkIn: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.prisma.booking.count({
        where: {
          deletedAt: null,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
          checkIn: { lte: now },
          checkOut: { gte: now },
        },
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID, paidAt: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      this.prisma.booking.count({
        where: { deletedAt: null, status: BookingStatus.PENDING },
      }),
    ]);

    // Occupancy today: rooms with an active booking overlapping today
    const occupiedToday = await this.prisma.booking.count({
      where: {
        deletedAt: null,
        status: { notIn: [BookingStatus.CANCELLED] },
        checkIn: { lte: todayEnd },
        checkOut: { gt: todayStart },
      },
    });

    return {
      totalRooms,
      checkInsToday,
      currentGuests,
      revenueThisMonth: revenueResult._sum.amount ?? 0,
      pendingBookings: pendingCount,
      occupancyRate: totalRooms > 0 ? Math.round((occupiedToday / totalRooms) * 100) : 0,
    };
  }

  async getRevenueChart(days = 30) {
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const start = new Date(); start.setDate(start.getDate() - days + 1); start.setHours(0, 0, 0, 0);

    const payments = await this.prisma.payment.findMany({
      where: { status: PaymentStatus.PAID, paidAt: { gte: start, lte: end } },
      select: { amount: true, paidAt: true },
    });

    const map = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    for (const p of payments) {
      if (!p.paidAt) continue;
      const key = p.paidAt.toISOString().slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + p.amount);
    }

    return Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue }));
  }

  async getPendingTasks(limit = 10) {
    return this.prisma.booking.findMany({
      where: { deletedAt: null, status: BookingStatus.PENDING },
      include: {
        room: { select: { id: true, name: true } },
        guest: { select: { fullName: true, phone: true } },
        payment: { select: { id: true, amount: true, status: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async getCalendarEvents(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59, 999);

    return this.prisma.booking.findMany({
      where: {
        deletedAt: null,
        status: { notIn: [BookingStatus.CANCELLED] },
        OR: [
          { checkIn: { gte: start, lte: end } },
          { checkOut: { gte: start, lte: end } },
          { AND: [{ checkIn: { lte: start } }, { checkOut: { gte: end } }] },
        ],
      },
      include: {
        room: { select: { id: true, name: true } },
        guest: { select: { fullName: true } },
      },
      orderBy: [{ roomId: 'asc' }, { checkIn: 'asc' }],
    });
  }
}
