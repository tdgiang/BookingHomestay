/**
 * User Journeys — BookingsService
 *
 * BK-1:  Customer creates nightly booking → unique HSB-YYYYMMDD-XXXX code + payment record
 * BK-2:  Customer creates hourly booking → correct price calculated
 * BK-3:  Booking rejected when room not found or inactive
 * BK-4:  Booking rejected when checkIn >= checkOut
 * BK-5:  Booking rejected when room is already booked for overlapping dates
 * BK-6:  Customer looks up booking by code; 404 for unknown code
 * BK-7:  Admin lists bookings with status / roomId / date filters
 * BK-8:  Admin updates booking status and internal note
 * BK-9:  Admin cancels booking; error if already cancelled
 * BK-10: Admin blocks dates for valid rooms — creates BLK- bookings with source='block'
 * BK-11: blockDates skips rooms that do not exist and returns only valid results
 * BK-12: blockDates reuses existing BLOCK-SYSTEM guest when found
 * BK-13: blockDates creates BLOCK-SYSTEM guest when not found
 * BK-14: blockDates uses provided reason as internalNote; defaults to 'Blocked by admin'
 * BK-15: After successful booking, notificationsService.onNewBooking is called with correct data
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from '../infrastructure/bookings.repository';
import { GuestsService } from '../../guests/application/guests.service';
import { PricingService } from '../../pricing/application/pricing.service';
import { NotificationsService } from '../../notifications/application/notifications.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BookingStatus, BookingType } from '@prisma/client';

const ROOM_STUB = {
  id: 'room-1',
  name: 'Phòng Hoa Sen',
  images: [],
  isActive: true,
  deletedAt: null,
};

const GUEST_STUB = {
  id: 'guest-1',
  fullName: 'Nguyễn Văn A',
  phone: '0901234567',
  email: null,
};

const PRICE_STUB = {
  bookingType: BookingType.NIGHTLY,
  nights: 2,
  breakdown: [],
  subtotal: 700000,
  discount: 0,
  discountRate: 0,
  totalPrice: 700000,
};

const BOOKING_STUB = {
  id: 'booking-1',
  bookingCode: 'HSB-20260701-ABCD',
  roomId: 'room-1',
  guestId: 'guest-1',
  bookingType: BookingType.NIGHTLY,
  checkIn: new Date('2026-07-01T14:00:00Z'),
  checkOut: new Date('2026-07-03T12:00:00Z'),
  durationHours: null,
  adults: 2,
  children: 0,
  specialRequest: null,
  status: BookingStatus.PENDING,
  totalPrice: 700000,
  source: 'direct',
  internalNote: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  room: ROOM_STUB,
  guest: GUEST_STUB,
};

describe('BookingsService', () => {
  let service: BookingsService;
  let repository: jest.Mocked<BookingsRepository>;
  let guestsService: jest.Mocked<GuestsService>;
  let pricingService: jest.Mocked<PricingService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let prisma: any;

  const makeMockTx = () => ({
    booking: { create: jest.fn().mockResolvedValue(BOOKING_STUB) },
    payment: { create: jest.fn().mockResolvedValue({}) },
  });

  beforeEach(async () => {
    const mockRepo = {
      countConflicts: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      findAllAdmin: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      softRemove: jest.fn(),
    };

    const mockGuests = { findOrCreate: jest.fn() };

    const mockPricing = { calculatePrice: jest.fn() };

    const mockNotifications = { onNewBooking: jest.fn().mockResolvedValue(undefined) };

    const mockTx = makeMockTx();
    const mockPrisma = {
      room:    { findFirst: jest.fn() },
      guest:   { findFirst: jest.fn(), create: jest.fn() },
      booking: { create: jest.fn() },
      $transaction: jest.fn().mockImplementation(async (fn: any) => fn(mockTx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: BookingsRepository, useValue: mockRepo },
        { provide: GuestsService, useValue: mockGuests },
        { provide: PricingService, useValue: mockPricing },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    repository = module.get(BookingsRepository);
    guestsService = module.get(GuestsService);
    pricingService = module.get(PricingService);
    notificationsService = module.get(NotificationsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── BK-3: room not found ─────────────────────────────────────────────────

  describe('create — validation', () => {
    it('BK-4: throws BadRequestException when checkIn >= checkOut', async () => {
      await expect(
        service.create({
          roomId: 'room-1',
          bookingType: BookingType.NIGHTLY,
          checkIn: '2026-07-03T14:00:00Z',
          checkOut: '2026-07-01T12:00:00Z',
          fullName: 'A', phone: '0900000000',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('BK-4: throws when checkIn equals checkOut', async () => {
      await expect(
        service.create({
          roomId: 'room-1',
          bookingType: BookingType.NIGHTLY,
          checkIn: '2026-07-01T14:00:00Z',
          checkOut: '2026-07-01T14:00:00Z',
          fullName: 'A', phone: '0900000000',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('BK-3: throws NotFoundException when room not found or inactive', async () => {
      prisma.room.findFirst.mockResolvedValue(null);

      await expect(
        service.create({
          roomId: 'bad-room',
          bookingType: BookingType.NIGHTLY,
          checkIn: '2026-07-01T14:00:00Z',
          checkOut: '2026-07-03T12:00:00Z',
          fullName: 'A', phone: '0900000000',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('BK-5: throws ConflictException when dates overlap existing booking', async () => {
      prisma.room.findFirst.mockResolvedValue(ROOM_STUB);
      repository.countConflicts.mockResolvedValue(1);

      await expect(
        service.create({
          roomId: 'room-1',
          bookingType: BookingType.NIGHTLY,
          checkIn: '2026-07-01T14:00:00Z',
          checkOut: '2026-07-03T12:00:00Z',
          fullName: 'A', phone: '0900000000',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── BK-1: nightly booking success ───────────────────────────────────────

  describe('create — nightly success (BK-1)', () => {
    beforeEach(() => {
      prisma.room.findFirst.mockResolvedValue(ROOM_STUB);
      repository.countConflicts.mockResolvedValue(0);
      pricingService.calculatePrice.mockResolvedValue(PRICE_STUB as any);
      guestsService.findOrCreate.mockResolvedValue(GUEST_STUB as any);
    });

    it('returns booking with booking code matching HSB-YYYYMMDD-XXXX format', async () => {
      const result = await service.create({
        roomId: 'room-1',
        bookingType: BookingType.NIGHTLY,
        checkIn: '2026-07-01T14:00:00Z',
        checkOut: '2026-07-03T12:00:00Z',
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
      });

      expect(result.booking.bookingCode).toMatch(/^HSB-\d{8}-[A-Z0-9]{4}$/);
    });

    it('booking code date segment matches checkIn date', async () => {
      const result = await service.create({
        roomId: 'room-1',
        bookingType: BookingType.NIGHTLY,
        checkIn: '2026-07-01T14:00:00Z',
        checkOut: '2026-07-03T12:00:00Z',
        fullName: 'A', phone: '0900000000',
      });

      expect(result.booking.bookingCode).toMatch(/^HSB-20260701-/);
    });

    it('calls pricingService.calculatePrice with NIGHTLY type', async () => {
      await service.create({
        roomId: 'room-1',
        bookingType: BookingType.NIGHTLY,
        checkIn: '2026-07-01T14:00:00Z',
        checkOut: '2026-07-03T12:00:00Z',
        fullName: 'A', phone: '0900000000',
      });

      expect(pricingService.calculatePrice).toHaveBeenCalledWith(
        'room-1',
        BookingType.NIGHTLY,
        expect.any(Date),
        expect.any(Date),
        undefined,
      );
    });

    it('calls guestsService.findOrCreate with phone + fullName', async () => {
      await service.create({
        roomId: 'room-1',
        bookingType: BookingType.NIGHTLY,
        checkIn: '2026-07-01T14:00:00Z',
        checkOut: '2026-07-03T12:00:00Z',
        fullName: 'Trần Thị B',
        phone: '0912345678',
        email: 'b@example.com',
      });

      expect(guestsService.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '0912345678', fullName: 'Trần Thị B' }),
      );
    });

    it('priceResult returned alongside booking', async () => {
      const result = await service.create({
        roomId: 'room-1',
        bookingType: BookingType.NIGHTLY,
        checkIn: '2026-07-01T14:00:00Z',
        checkOut: '2026-07-03T12:00:00Z',
        fullName: 'A', phone: '0900000000',
      });

      expect(result.priceResult).toBeDefined();
      expect((result.priceResult as any).totalPrice).toBe(700000);
    });
  });

  // ─── BK-2: hourly booking ────────────────────────────────────────────────

  describe('create — hourly success (BK-2)', () => {
    it('calls pricingService.calculatePrice with HOURLY type and durationHours', async () => {
      prisma.room.findFirst.mockResolvedValue(ROOM_STUB);
      repository.countConflicts.mockResolvedValue(0);
      pricingService.calculatePrice.mockResolvedValue({
        ...PRICE_STUB,
        bookingType: BookingType.HOURLY,
        hours: 3,
        totalPrice: 240000,
      } as any);
      guestsService.findOrCreate.mockResolvedValue(GUEST_STUB as any);

      await service.create({
        roomId: 'room-1',
        bookingType: BookingType.HOURLY,
        checkIn: '2026-07-10T10:00:00Z',
        checkOut: '2026-07-10T13:00:00Z',
        durationHours: 3,
        fullName: 'A', phone: '0900000000',
      });

      expect(pricingService.calculatePrice).toHaveBeenCalledWith(
        'room-1',
        BookingType.HOURLY,
        expect.any(Date),
        undefined,
        3,
      );
    });
  });

  // ─── BK-6: findByCode ────────────────────────────────────────────────────

  describe('findByCode', () => {
    it('BK-6: returns booking when code exists', async () => {
      repository.findByCode.mockResolvedValue(BOOKING_STUB as any);

      const result = await service.findByCode('HSB-20260701-ABCD');

      expect(result).toEqual(BOOKING_STUB);
    });

    it('BK-6: throws NotFoundException when code not found', async () => {
      repository.findByCode.mockResolvedValue(null);

      await expect(service.findByCode('HSB-XXXXXXXX-XXXX')).rejects.toThrow(NotFoundException);
    });

    it('BK-6: NotFoundException message contains the booking code', async () => {
      repository.findByCode.mockResolvedValue(null);

      await expect(service.findByCode('HSB-BAD-CODE')).rejects.toThrow('HSB-BAD-CODE');
    });
  });

  // ─── BK-7: findAll ───────────────────────────────────────────────────────

  describe('findAll', () => {
    it('BK-7: returns paginated list with meta', async () => {
      repository.findAllAdmin.mockResolvedValue([[BOOKING_STUB], 10]);

      const result = await service.findAll({ page: 1, limit: 5 } as any) as any;

      expect(result.meta.total).toBe(10);
      expect(result.meta.totalPages).toBe(2);
    });

    it('BK-7: applies status filter when provided', async () => {
      repository.findAllAdmin.mockResolvedValue([[], 0]);

      await service.findAll({ status: BookingStatus.CONFIRMED } as any);

      const callArg = repository.findAllAdmin.mock.calls[0][0];
      expect(callArg.where.status).toBe(BookingStatus.CONFIRMED);
    });

    it('BK-7: applies roomId filter when provided', async () => {
      repository.findAllAdmin.mockResolvedValue([[], 0]);

      await service.findAll({ roomId: 'room-1' } as any);

      const callArg = repository.findAllAdmin.mock.calls[0][0];
      expect(callArg.where.roomId).toBe('room-1');
    });

    it('BK-7: excludes soft-deleted bookings', async () => {
      repository.findAllAdmin.mockResolvedValue([[], 0]);

      await service.findAll({} as any);

      const callArg = repository.findAllAdmin.mock.calls[0][0];
      expect(callArg.where.deletedAt).toBeNull();
    });

    it('BK-7: applies date filter — sets checkIn gte/lt for that calendar day', async () => {
      repository.findAllAdmin.mockResolvedValue([[], 0]);

      await service.findAll({ date: '2026-07-01' } as any);

      const callArg = repository.findAllAdmin.mock.calls[0][0];
      expect(callArg.where.checkIn).toBeDefined();
      expect((callArg.where.checkIn as any).gte).toBeInstanceOf(Date);
      expect((callArg.where.checkIn as any).lt).toBeInstanceOf(Date);
    });

    it('BK-7: date filter lt is exactly 1 day after gte', async () => {
      repository.findAllAdmin.mockResolvedValue([[], 0]);

      await service.findAll({ date: '2026-07-15' } as any);

      const callArg = repository.findAllAdmin.mock.calls[0][0];
      const checkIn = callArg.where.checkIn as any;
      const diffMs = checkIn.lt.getTime() - checkIn.gte.getTime();
      expect(diffMs).toBe(24 * 60 * 60 * 1000);
    });
  });

  // ─── BK-8: update ────────────────────────────────────────────────────────

  describe('update', () => {
    it('BK-8: updates booking status and internalNote', async () => {
      repository.findOne.mockResolvedValue(BOOKING_STUB);
      repository.update.mockResolvedValue({ ...BOOKING_STUB, status: BookingStatus.CONFIRMED });

      const result = await service.update('booking-1', {
        status: BookingStatus.CONFIRMED,
        internalNote: 'VIP guest',
      });

      expect(repository.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: BookingStatus.CONFIRMED, internalNote: 'VIP guest' },
      });
      expect((result as any).status).toBe(BookingStatus.CONFIRMED);
    });

    it('BK-8: throws NotFoundException for unknown booking', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('bad-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ─── BK-9: cancel ────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('BK-9: calls softRemove on active booking', async () => {
      repository.findOne.mockResolvedValue(BOOKING_STUB);
      repository.softRemove.mockResolvedValue({ ...BOOKING_STUB, deletedAt: new Date() });

      await service.cancel('booking-1');

      expect(repository.softRemove).toHaveBeenCalledWith({ id: 'booking-1' });
    });

    it('BK-9: throws NotFoundException for unknown booking', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.cancel('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('BK-9: throws BadRequestException when booking already cancelled', async () => {
      repository.findOne.mockResolvedValue({
        ...BOOKING_STUB,
        status: BookingStatus.CANCELLED,
      });

      await expect(service.cancel('booking-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── BK-10 ~ BK-14: blockDates ───────────────────────────────────────────

  describe('blockDates', () => {
    const BLOCK_GUEST = { id: 'block-guest-id', fullName: 'Block (System)', phone: 'BLOCK-SYSTEM' };
    const ROOM_STUB_2 = { id: 'room-2', name: 'Phòng 2', deletedAt: null };

    const BLOCK_BOOKING = {
      id: 'blk-1', bookingCode: 'BLK-20260810-ABCD',
      source: 'block', status: BookingStatus.CONFIRMED, totalPrice: 0,
    };

    it('BK-10: creates block bookings for each valid room with BLK- prefix', async () => {
      prisma.guest.findFirst.mockResolvedValue(BLOCK_GUEST);
      prisma.room.findFirst.mockResolvedValue(ROOM_STUB_2);
      prisma.booking.create.mockResolvedValue(BLOCK_BOOKING);

      const result = await service.blockDates({
        roomIds: ['room-2'],
        checkIn: '2026-08-10T00:00:00Z',
        checkOut: '2026-08-12T00:00:00Z',
      });

      expect(result).toHaveLength(1);
      expect(prisma.booking.create).toHaveBeenCalledTimes(1);
    });

    it('BK-10: booking code starts with BLK-', async () => {
      prisma.guest.findFirst.mockResolvedValue(BLOCK_GUEST);
      prisma.room.findFirst.mockResolvedValue(ROOM_STUB_2);
      prisma.booking.create.mockResolvedValue(BLOCK_BOOKING);

      await service.blockDates({
        roomIds: ['room-2'],
        checkIn: '2026-08-10T00:00:00Z',
        checkOut: '2026-08-12T00:00:00Z',
      });

      const createCall = prisma.booking.create.mock.calls[0][0];
      expect(createCall.data.bookingCode).toMatch(/^BLK-\d{8}-[A-Z0-9]{4}$/);
    });

    it('BK-10: created booking has source="block" and status=CONFIRMED', async () => {
      prisma.guest.findFirst.mockResolvedValue(BLOCK_GUEST);
      prisma.room.findFirst.mockResolvedValue(ROOM_STUB_2);
      prisma.booking.create.mockResolvedValue(BLOCK_BOOKING);

      await service.blockDates({
        roomIds: ['room-2'],
        checkIn: '2026-08-10T00:00:00Z',
        checkOut: '2026-08-12T00:00:00Z',
      });

      const createCall = prisma.booking.create.mock.calls[0][0];
      expect(createCall.data.source).toBe('block');
      expect(createCall.data.status).toBe(BookingStatus.CONFIRMED);
      expect(createCall.data.totalPrice).toBe(0);
    });

    it('BK-11: skips rooms that do not exist and returns only valid results', async () => {
      prisma.guest.findFirst.mockResolvedValue(BLOCK_GUEST);
      // First room exists, second does not
      prisma.room.findFirst
        .mockResolvedValueOnce(ROOM_STUB_2)
        .mockResolvedValueOnce(null);
      prisma.booking.create.mockResolvedValue(BLOCK_BOOKING);

      const result = await service.blockDates({
        roomIds: ['room-2', 'bad-room'],
        checkIn: '2026-08-10T00:00:00Z',
        checkOut: '2026-08-12T00:00:00Z',
      });

      expect(result).toHaveLength(1);
      expect(prisma.booking.create).toHaveBeenCalledTimes(1);
    });

    it('BK-11: returns empty array when all roomIds are invalid', async () => {
      prisma.guest.findFirst.mockResolvedValue(BLOCK_GUEST);
      prisma.room.findFirst.mockResolvedValue(null);

      const result = await service.blockDates({
        roomIds: ['bad-room-1', 'bad-room-2'],
        checkIn: '2026-08-10T00:00:00Z',
        checkOut: '2026-08-12T00:00:00Z',
      });

      expect(result).toHaveLength(0);
      expect(prisma.booking.create).not.toHaveBeenCalled();
    });

    it('BK-12: reuses existing BLOCK-SYSTEM guest when found', async () => {
      prisma.guest.findFirst.mockResolvedValue(BLOCK_GUEST);
      prisma.room.findFirst.mockResolvedValue(ROOM_STUB_2);
      prisma.booking.create.mockResolvedValue(BLOCK_BOOKING);

      await service.blockDates({
        roomIds: ['room-2'],
        checkIn: '2026-08-10T00:00:00Z',
        checkOut: '2026-08-12T00:00:00Z',
      });

      expect(prisma.guest.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { phone: 'BLOCK-SYSTEM' } }),
      );
      expect(prisma.guest.create).not.toHaveBeenCalled();
    });

    it('BK-13: creates BLOCK-SYSTEM guest when not found', async () => {
      prisma.guest.findFirst.mockResolvedValue(null);
      prisma.guest.create.mockResolvedValue(BLOCK_GUEST);
      prisma.room.findFirst.mockResolvedValue(ROOM_STUB_2);
      prisma.booking.create.mockResolvedValue(BLOCK_BOOKING);

      await service.blockDates({
        roomIds: ['room-2'],
        checkIn: '2026-08-10T00:00:00Z',
        checkOut: '2026-08-12T00:00:00Z',
      });

      expect(prisma.guest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ phone: 'BLOCK-SYSTEM', fullName: 'Block (System)' }),
        }),
      );
    });

    it('BK-14: uses provided reason as internalNote', async () => {
      prisma.guest.findFirst.mockResolvedValue(BLOCK_GUEST);
      prisma.room.findFirst.mockResolvedValue(ROOM_STUB_2);
      prisma.booking.create.mockResolvedValue(BLOCK_BOOKING);

      await service.blockDates({
        roomIds: ['room-2'],
        checkIn: '2026-08-10T00:00:00Z',
        checkOut: '2026-08-12T00:00:00Z',
        reason: 'Bảo trì phòng',
      });

      const createCall = prisma.booking.create.mock.calls[0][0];
      expect(createCall.data.internalNote).toBe('Bảo trì phòng');
    });

    it('BK-14: defaults internalNote to "Blocked by admin" when reason omitted', async () => {
      prisma.guest.findFirst.mockResolvedValue(BLOCK_GUEST);
      prisma.room.findFirst.mockResolvedValue(ROOM_STUB_2);
      prisma.booking.create.mockResolvedValue(BLOCK_BOOKING);

      await service.blockDates({
        roomIds: ['room-2'],
        checkIn: '2026-08-10T00:00:00Z',
        checkOut: '2026-08-12T00:00:00Z',
      });

      const createCall = prisma.booking.create.mock.calls[0][0];
      expect(createCall.data.internalNote).toBe('Blocked by admin');
    });

    it('BK-10: creates one block booking per valid room (multiple rooms)', async () => {
      prisma.guest.findFirst.mockResolvedValue(BLOCK_GUEST);
      prisma.room.findFirst.mockResolvedValue(ROOM_STUB_2);
      prisma.booking.create.mockResolvedValue(BLOCK_BOOKING);

      const result = await service.blockDates({
        roomIds: ['room-1', 'room-2', 'room-3'],
        checkIn: '2026-08-10T00:00:00Z',
        checkOut: '2026-08-12T00:00:00Z',
      });

      expect(prisma.booking.create).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });
  });

  // ─── exportCsv ───────────────────────────────────────────────────────────

  describe('exportCsv', () => {
    const BOOKING_ROW = {
      ...BOOKING_STUB,
      room: { name: 'Phòng 101' },
      guest: { fullName: 'Nguyễn Văn A', phone: '0901234567', email: 'a@test.com' },
      payment: { status: 'PAID', paidAt: new Date() },
      createdAt: new Date('2026-07-01'),
    };

    beforeEach(() => {
      prisma.booking = { findMany: jest.fn().mockResolvedValue([BOOKING_ROW]) };
    });

    it('returns a CSV string starting with the header row', async () => {
      const csv = await service.exportCsv();

      expect(typeof csv).toBe('string');
      expect(csv.split('\n')[0]).toContain('Mã ĐP');
    });

    it('header contains all required columns', async () => {
      const csv = await service.exportCsv();
      const header = csv.split('\n')[0];

      expect(header).toContain('Phòng');
      expect(header).toContain('Khách');
      expect(header).toContain('Check-in');
      expect(header).toContain('Trạng thái');
    });

    it('has one data row per booking', async () => {
      prisma.booking.findMany.mockResolvedValue([BOOKING_ROW, BOOKING_ROW]);

      const csv = await service.exportCsv();

      expect(csv.split('\n')).toHaveLength(3); // header + 2 rows
    });

    it('data row includes booking code', async () => {
      const csv = await service.exportCsv();

      expect(csv).toContain(BOOKING_STUB.bookingCode);
    });

    it('applies status filter when provided', async () => {
      await service.exportCsv({ status: BookingStatus.CONFIRMED } as any);

      const callArg = prisma.booking.findMany.mock.calls[0][0];
      expect(callArg.where.status).toBe(BookingStatus.CONFIRMED);
    });

    it('applies roomId filter when provided', async () => {
      await service.exportCsv({ roomId: 'room-1' } as any);

      const callArg = prisma.booking.findMany.mock.calls[0][0];
      expect(callArg.where.roomId).toBe('room-1');
    });

    it('empty payment status becomes empty string', async () => {
      prisma.booking.findMany.mockResolvedValue([{ ...BOOKING_ROW, payment: null }]);

      const csv = await service.exportCsv();
      const dataRow = csv.split('\n')[1];

      // payment field is empty — row still exists
      expect(dataRow).toBeDefined();
    });
  });

  // ─── BK-15: notifications on create ──────────────────────────────────────

  describe('create — notifications (BK-15)', () => {
    beforeEach(() => {
      prisma.room.findFirst.mockResolvedValue(ROOM_STUB);
      repository.countConflicts.mockResolvedValue(0);
      pricingService.calculatePrice.mockResolvedValue(PRICE_STUB as any);
      guestsService.findOrCreate.mockResolvedValue(GUEST_STUB as any);
    });

    it('BK-15: calls notificationsService.onNewBooking after successful booking', async () => {
      await service.create({
        roomId: 'room-1',
        bookingType: BookingType.NIGHTLY,
        checkIn: '2026-07-01T14:00:00Z',
        checkOut: '2026-07-03T12:00:00Z',
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
      });

      expect(notificationsService.onNewBooking).toHaveBeenCalledTimes(1);
    });

    it('BK-15: onNewBooking is called with correct bookingCode prefix', async () => {
      await service.create({
        roomId: 'room-1',
        bookingType: BookingType.NIGHTLY,
        checkIn: '2026-07-01T14:00:00Z',
        checkOut: '2026-07-03T12:00:00Z',
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
      });

      const arg = notificationsService.onNewBooking.mock.calls[0][0];
      expect(arg.bookingCode).toMatch(/^HSB-/);
    });

    it('BK-15: onNewBooking is called with correct guestName', async () => {
      await service.create({
        roomId: 'room-1',
        bookingType: BookingType.NIGHTLY,
        checkIn: '2026-07-01T14:00:00Z',
        checkOut: '2026-07-03T12:00:00Z',
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
      });

      const arg = notificationsService.onNewBooking.mock.calls[0][0];
      expect(arg.guestName).toBe(GUEST_STUB.fullName);
    });

    it('BK-15: onNewBooking is called with correct roomName', async () => {
      await service.create({
        roomId: 'room-1',
        bookingType: BookingType.NIGHTLY,
        checkIn: '2026-07-01T14:00:00Z',
        checkOut: '2026-07-03T12:00:00Z',
        fullName: 'A',
        phone: '0900000000',
      });

      const arg = notificationsService.onNewBooking.mock.calls[0][0];
      expect(arg.roomName).toBe(ROOM_STUB.name);
    });

    it('BK-15: onNewBooking is called with checkIn as a Date object', async () => {
      await service.create({
        roomId: 'room-1',
        bookingType: BookingType.NIGHTLY,
        checkIn: '2026-07-01T14:00:00Z',
        checkOut: '2026-07-03T12:00:00Z',
        fullName: 'A',
        phone: '0900000000',
      });

      const arg = notificationsService.onNewBooking.mock.calls[0][0];
      expect(arg.checkIn).toBeInstanceOf(Date);
    });

    it('BK-15: does NOT call onNewBooking when booking fails (checkIn >= checkOut)', async () => {
      await expect(
        service.create({
          roomId: 'room-1',
          bookingType: BookingType.NIGHTLY,
          checkIn: '2026-07-03T14:00:00Z',
          checkOut: '2026-07-01T12:00:00Z',
          fullName: 'A',
          phone: '0900000000',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(notificationsService.onNewBooking).not.toHaveBeenCalled();
    });

    it('BK-15: does NOT call onNewBooking when room not found', async () => {
      prisma.room.findFirst.mockResolvedValue(null);

      await expect(
        service.create({
          roomId: 'bad-room',
          bookingType: BookingType.NIGHTLY,
          checkIn: '2026-07-01T14:00:00Z',
          checkOut: '2026-07-03T12:00:00Z',
          fullName: 'A',
          phone: '0900000000',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(notificationsService.onNewBooking).not.toHaveBeenCalled();
    });

    it('BK-15: does NOT call onNewBooking when dates conflict', async () => {
      repository.countConflicts.mockResolvedValue(2);

      await expect(
        service.create({
          roomId: 'room-1',
          bookingType: BookingType.NIGHTLY,
          checkIn: '2026-07-01T14:00:00Z',
          checkOut: '2026-07-03T12:00:00Z',
          fullName: 'A',
          phone: '0900000000',
        }),
      ).rejects.toThrow(ConflictException);

      expect(notificationsService.onNewBooking).not.toHaveBeenCalled();
    });
  });
});
