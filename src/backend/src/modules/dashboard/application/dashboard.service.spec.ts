/**
 * User Journeys — DashboardService
 *
 * DS-1: Admin views KPI snapshot — totalRooms, checkInsToday, currentGuests,
 *        revenueThisMonth, pendingBookings, occupancyRate all computed correctly
 * DS-2: Occupancy rate is 0 when no rooms exist (avoid divide-by-zero)
 * DS-3: Revenue this month falls back to 0 when no paid payments exist
 * DS-4: Admin views revenue chart — returns `days` data points sorted by date,
 *        aggregates multiple payments on the same day, zeroes out days with no payments
 * DS-5: Revenue chart skips payments with null paidAt without crashing
 * DS-6: Admin views pending task list — only PENDING bookings, up to `limit`
 * DS-7: Admin views calendar events for a given month — returns bookings that
 *        start in month, end in month, or span the entire month
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../../prisma/prisma.service';

// ─── Stubs ────────────────────────────────────────────────────────────────────

const ROOM_STUB = { id: 'room-1', name: 'Phòng Hoa Sen' };
const GUEST_STUB = { fullName: 'Nguyễn Văn A', phone: '0901234567' };
const PAYMENT_STUB = { id: 'pay-1', amount: 350000, status: 'PAID' };

const BOOKING_STUB = {
  id: 'bk-1', bookingCode: 'HSB-20260701-ABCD',
  checkIn: new Date('2026-07-01T14:00:00Z'),
  checkOut: new Date('2026-07-03T12:00:00Z'),
  totalPrice: 700000, status: 'PENDING',
  room: ROOM_STUB, guest: GUEST_STUB, payment: PAYMENT_STUB,
};

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrisma = {
      room:    { count: jest.fn() },
      booking: { count: jest.fn(), findMany: jest.fn() },
      payment: { aggregate: jest.fn(), findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma  = module.get(PrismaService);
  });

  afterEach(() => jest.resetAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── DS-1: getKpis happy path ─────────────────────────────────────────────

  describe('getKpis', () => {
    it('DS-1: returns all six KPI fields with correct values', async () => {
      prisma.room.count.mockResolvedValue(5);
      prisma.booking.count
        .mockResolvedValueOnce(2)   // checkInsToday
        .mockResolvedValueOnce(3)   // currentGuests
        .mockResolvedValueOnce(1)   // pendingCount
        .mockResolvedValueOnce(2);  // occupiedToday
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 940000 } });

      const result = await service.getKpis();

      expect(result.totalRooms).toBe(5);
      expect(result.checkInsToday).toBe(2);
      expect(result.currentGuests).toBe(3);
      expect(result.revenueThisMonth).toBe(940000);
      expect(result.pendingBookings).toBe(1);
      expect(result.occupancyRate).toBe(40); // Math.round(2/5*100)
    });

    it('DS-2: occupancyRate is 0 when totalRooms is 0 (no divide-by-zero)', async () => {
      prisma.room.count.mockResolvedValue(0);
      prisma.booking.count.mockResolvedValue(0);
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });

      const result = await service.getKpis();

      expect(result.occupancyRate).toBe(0);
      expect(result.totalRooms).toBe(0);
    });

    it('DS-3: revenueThisMonth is 0 when no paid payments exist (null sum)', async () => {
      prisma.room.count.mockResolvedValue(3);
      prisma.booking.count.mockResolvedValue(0);
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });

      const result = await service.getKpis();

      expect(result.revenueThisMonth).toBe(0);
    });

    it('DS-1: occupancyRate rounds to nearest integer', async () => {
      prisma.room.count.mockResolvedValue(3);
      prisma.booking.count
        .mockResolvedValueOnce(0) // checkInsToday
        .mockResolvedValueOnce(0) // currentGuests
        .mockResolvedValueOnce(0) // pendingCount
        .mockResolvedValueOnce(1); // occupiedToday (1 out of 3 = 33.33%)
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

      const result = await service.getKpis();

      expect(result.occupancyRate).toBe(33); // Math.round(1/3*100)
    });

    it('DS-1: occupancyRate is 100 when all rooms occupied', async () => {
      prisma.room.count.mockResolvedValue(4);
      prisma.booking.count
        .mockResolvedValueOnce(4) .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(0) .mockResolvedValueOnce(4);
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

      const result = await service.getKpis();

      expect(result.occupancyRate).toBe(100);
    });
  });

  // ─── DS-4 & DS-5: getRevenueChart ─────────────────────────────────────────

  describe('getRevenueChart', () => {
    it('DS-4: returns exactly `days` data points', async () => {
      prisma.payment.findMany.mockResolvedValue([]);

      const result = await service.getRevenueChart(7);

      expect(result).toHaveLength(7);
    });

    it('DS-4: returns 30 data points by default', async () => {
      prisma.payment.findMany.mockResolvedValue([]);

      const result = await service.getRevenueChart();

      expect(result).toHaveLength(30);
    });

    it('DS-4: all data points have { date, revenue } shape', async () => {
      prisma.payment.findMany.mockResolvedValue([]);

      const result = await service.getRevenueChart(3);

      for (const pt of result) {
        expect(pt).toHaveProperty('date');
        expect(pt).toHaveProperty('revenue');
        expect(typeof pt.date).toBe('string');
        expect(typeof pt.revenue).toBe('number');
      }
    });

    it('DS-4: days with no payments have revenue = 0', async () => {
      prisma.payment.findMany.mockResolvedValue([]);

      const result = await service.getRevenueChart(5);

      expect(result.every((p) => p.revenue === 0)).toBe(true);
    });

    it('DS-4: aggregates multiple payments on the same date', async () => {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);

      prisma.payment.findMany.mockResolvedValue([
        { amount: 200000, paidAt: new Date(`${todayStr}T09:00:00Z`) },
        { amount: 150000, paidAt: new Date(`${todayStr}T15:00:00Z`) },
      ]);

      const result = await service.getRevenueChart(1);
      const todayPoint = result.find((p) => p.date === todayStr);

      expect(todayPoint?.revenue).toBe(350000);
    });

    it('DS-5: skips payments with null paidAt without throwing', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { amount: 100000, paidAt: null },
        { amount: 200000, paidAt: new Date() },
      ]);

      await expect(service.getRevenueChart(1)).resolves.not.toThrow();
    });

    it('DS-4: data points are sorted chronologically (oldest first)', async () => {
      prisma.payment.findMany.mockResolvedValue([]);

      const result = await service.getRevenueChart(5);
      const dates = result.map((p) => p.date);

      expect(dates).toEqual([...dates].sort());
    });
  });

  // ─── DS-6: getPendingTasks ─────────────────────────────────────────────────

  describe('getPendingTasks', () => {
    it('DS-6: returns bookings from prisma.booking.findMany', async () => {
      prisma.booking.findMany.mockResolvedValue([BOOKING_STUB]);

      const result = await service.getPendingTasks();

      expect(result).toHaveLength(1);
      expect(result[0].bookingCode).toBe('HSB-20260701-ABCD');
    });

    it('DS-6: queries only PENDING bookings with deletedAt null', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      await service.getPendingTasks();

      const call = prisma.booking.findMany.mock.calls[0][0];
      expect(call.where.status).toBe('PENDING');
      expect(call.where.deletedAt).toBeNull();
    });

    it('DS-6: default limit is 10', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      await service.getPendingTasks();

      const call = prisma.booking.findMany.mock.calls[0][0];
      expect(call.take).toBe(10);
    });

    it('DS-6: respects custom limit parameter', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      await service.getPendingTasks(5);

      const call = prisma.booking.findMany.mock.calls[0][0];
      expect(call.take).toBe(5);
    });

    it('DS-6: orders by createdAt ascending (oldest first)', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      await service.getPendingTasks();

      const call = prisma.booking.findMany.mock.calls[0][0];
      expect(call.orderBy.createdAt).toBe('asc');
    });

    it('DS-6: includes room and guest relations', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      await service.getPendingTasks();

      const call = prisma.booking.findMany.mock.calls[0][0];
      expect(call.include.room).toBeDefined();
      expect(call.include.guest).toBeDefined();
    });
  });

  // ─── DS-7: getCalendarEvents ──────────────────────────────────────────────

  describe('getCalendarEvents', () => {
    it('DS-7: returns bookings from prisma.booking.findMany', async () => {
      prisma.booking.findMany.mockResolvedValue([BOOKING_STUB]);

      const result = await service.getCalendarEvents(2026, 7);

      expect(result).toHaveLength(1);
    });

    it('DS-7: excludes CANCELLED bookings', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      await service.getCalendarEvents(2026, 7);

      const call = prisma.booking.findMany.mock.calls[0][0];
      expect(call.where.status.notIn).toContain('CANCELLED');
    });

    it('DS-7: excludes soft-deleted bookings', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      await service.getCalendarEvents(2026, 7);

      const call = prisma.booking.findMany.mock.calls[0][0];
      expect(call.where.deletedAt).toBeNull();
    });

    it('DS-7: uses OR filter to catch bookings starting, ending, or spanning the month', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      await service.getCalendarEvents(2026, 7);

      const call = prisma.booking.findMany.mock.calls[0][0];
      expect(Array.isArray(call.where.OR)).toBe(true);
      expect(call.where.OR.length).toBe(3);
    });

    it('DS-7: orders by roomId asc then checkIn asc for Gantt layout', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      await service.getCalendarEvents(2026, 7);

      const call = prisma.booking.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual([{ roomId: 'asc' }, { checkIn: 'asc' }]);
    });

    it('DS-7: month boundaries use correct year and month (July 2026)', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      await service.getCalendarEvents(2026, 7);

      const call = prisma.booking.findMany.mock.calls[0][0];
      const orClauses = call.where.OR;
      // First clause: checkIn within July 2026
      const monthStart = orClauses[0].checkIn.gte;
      const monthEnd   = orClauses[0].checkIn.lte;
      expect(monthStart.getFullYear()).toBe(2026);
      expect(monthStart.getMonth()).toBe(6); // July = 6 (0-indexed)
      expect(monthStart.getDate()).toBe(1);
      expect(monthEnd.getMonth()).toBe(6);
    });
  });
});
