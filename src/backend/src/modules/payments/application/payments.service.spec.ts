/**
 * User Journeys — PaymentsService
 *
 * PM-1: Bank webhook auto-confirms booking when code found in description and amount matches
 * PM-2: Webhook is silently ignored when description has no booking code
 * PM-3: Webhook is silently ignored when booking code not found in DB
 * PM-4: Webhook skips already-paid bookings without error
 * PM-5: Webhook rejects when transferred amount differs by more than 1 000 VND
 * PM-6: Admin manually confirms a pending payment
 * PM-7: Admin confirm fails when payment already paid
 * PM-8: Admin confirm fails when payment not found
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from '../infrastructure/payments.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentStatus, BookingStatus } from '@prisma/client';

const PAYMENT_STUB = {
  id: 'pay-1',
  bookingId: 'booking-1',
  amount: 700000,
  method: 'bank_transfer',
  status: PaymentStatus.PENDING,
  bankRef: null,
  paidAt: null,
  confirmedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const BOOKING_WITH_PAYMENT = {
  id: 'booking-1',
  bookingCode: 'HSB-20260701-ABCD',
  status: BookingStatus.PENDING,
  payment: PAYMENT_STUB,
};

describe('PaymentsService', () => {
  let service: PaymentsService;
  let repository: jest.Mocked<PaymentsRepository>;
  let prisma: any;

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const paidPayment = { ...PAYMENT_STUB, status: PaymentStatus.PAID };
    const mockPrisma = {
      booking: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      payment: {
        update: jest.fn().mockResolvedValue(paidPayment),
      },
      $transaction: jest.fn().mockImplementation((ops: any[]) => Promise.all(ops)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PaymentsRepository, useValue: mockRepo },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    repository = module.get(PaymentsRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── PM-2: no code in description ────────────────────────────────────────

  describe('handleWebhook — no booking code', () => {
    it('PM-2: returns {received:true} without querying DB when no code in description', async () => {
      const result = await service.handleWebhook({
        bankRef: 'VCB001',
        amount: 700000,
        description: 'Chuyen tien khong co ma',
      });

      expect(result).toEqual({ received: true });
      expect(prisma.booking.findUnique).not.toHaveBeenCalled();
    });

    it('PM-2: description with partial HSB text does not match', async () => {
      const result = await service.handleWebhook({
        bankRef: 'VCB001',
        amount: 700000,
        description: 'HSB partial',
      });

      expect(result).toEqual({ received: true });
    });
  });

  // ─── PM-3: booking not found ──────────────────────────────────────────────

  describe('handleWebhook — booking not found', () => {
    it('PM-3: returns {received:true} without error when booking missing', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      const result = await service.handleWebhook({
        bankRef: 'VCB002',
        amount: 700000,
        description: 'Thanh toan HSB-20260701-ABCD',
      });

      expect(result).toEqual({ received: true });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('PM-3: also returns {received:true} when payment record is missing', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...BOOKING_WITH_PAYMENT, payment: null });

      const result = await service.handleWebhook({
        bankRef: 'VCB003',
        amount: 700000,
        description: 'HSB-20260701-ABCD',
      });

      expect(result).toEqual({ received: true });
    });
  });

  // ─── PM-4: already paid ───────────────────────────────────────────────────

  describe('handleWebhook — already paid', () => {
    it('PM-4: returns {received:true, alreadyPaid:true} for paid booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...BOOKING_WITH_PAYMENT,
        payment: { ...PAYMENT_STUB, status: PaymentStatus.PAID },
      });

      const result = await service.handleWebhook({
        bankRef: 'VCB004',
        amount: 700000,
        description: 'HSB-20260701-ABCD',
      });

      expect(result).toEqual({ received: true, alreadyPaid: true });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // ─── PM-5: amount mismatch ────────────────────────────────────────────────

  describe('handleWebhook — amount mismatch', () => {
    it('PM-5: returns {received:true, amountMismatch:true} when diff > 1000', async () => {
      prisma.booking.findUnique.mockResolvedValue(BOOKING_WITH_PAYMENT);

      const result = await service.handleWebhook({
        bankRef: 'VCB005',
        amount: 698000, // diff = 2000 > 1000
        description: 'HSB-20260701-ABCD',
      });

      expect(result).toEqual({ received: true, amountMismatch: true });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('PM-5: confirms when diff is exactly 1000 (boundary = within tolerance)', async () => {
      prisma.booking.findUnique.mockResolvedValue(BOOKING_WITH_PAYMENT);

      const result = await service.handleWebhook({
        bankRef: 'VCB006',
        amount: 699000, // diff = 1000, Math.abs(699000 - 700000) = 1000, NOT > 1000
        description: 'HSB-20260701-ABCD',
      });

      // diff is 1000 which is NOT > 1000, so should confirm
      expect(result).toEqual(expect.objectContaining({ received: true, confirmed: true }));
    });
  });

  // ─── PM-1: success confirm ────────────────────────────────────────────────

  describe('handleWebhook — success (PM-1)', () => {
    beforeEach(() => {
      prisma.booking.findUnique.mockResolvedValue(BOOKING_WITH_PAYMENT);
    });

    it('PM-1: returns confirmed:true with bookingCode on success', async () => {
      const result = await service.handleWebhook({
        bankRef: 'VCB-OK',
        amount: 700000,
        description: 'Chuyen khoan HSB-20260701-ABCD phong 101',
      });

      expect(result).toEqual({
        received: true,
        bookingCode: 'HSB-20260701-ABCD',
        confirmed: true,
      });
    });

    it('PM-1: calls $transaction to update payment and booking atomically', async () => {
      await service.handleWebhook({
        bankRef: 'VCB-OK',
        amount: 700000,
        description: 'HSB-20260701-ABCD',
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PAYMENT_STUB.id },
          data: expect.objectContaining({
            status: PaymentStatus.PAID,
            bankRef: 'VCB-OK',
          }),
        }),
      );
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'booking-1' },
          data: { status: BookingStatus.CONFIRMED },
        }),
      );
    });

    it('PM-1: uses transactionDate when provided', async () => {
      await service.handleWebhook({
        bankRef: 'VCB-OK',
        amount: 700000,
        description: 'HSB-20260701-ABCD',
        transactionDate: '2026-07-01T15:30:00Z',
      });

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paidAt: new Date('2026-07-01T15:30:00Z'),
          }),
        }),
      );
    });

    it('PM-1: falls back to current date when transactionDate not provided', async () => {
      const before = Date.now();
      await service.handleWebhook({
        bankRef: 'VCB-OK',
        amount: 700000,
        description: 'HSB-20260701-ABCD',
      });
      const after = Date.now();

      const paidAt: Date = prisma.payment.update.mock.calls[0][0].data.paidAt;
      expect(paidAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(paidAt.getTime()).toBeLessThanOrEqual(after);
    });
  });

  // ─── PM-6 ~ PM-8: confirmManual ──────────────────────────────────────────

  describe('confirmManual', () => {
    it('PM-6: updates payment status to PAID and booking to CONFIRMED', async () => {
      repository.findOne.mockResolvedValueOnce(PAYMENT_STUB).mockResolvedValueOnce({
        ...PAYMENT_STUB,
        status: PaymentStatus.PAID,
      });

      const result = await service.confirmManual('pay-1', 'admin-1', { bankRef: 'MANUAL-001' });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PaymentStatus.PAID,
            bankRef: 'MANUAL-001',
            confirmedBy: 'admin-1',
          }),
        }),
      );
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: BookingStatus.CONFIRMED },
        }),
      );
      expect(result).toBeDefined();
    });

    it('PM-7: throws BadRequestException when payment already paid', async () => {
      repository.findOne.mockResolvedValue({
        ...PAYMENT_STUB,
        status: PaymentStatus.PAID,
      });

      await expect(
        service.confirmManual('pay-1', 'admin-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('PM-8: throws NotFoundException when payment not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.confirmManual('bad-id', 'admin-1', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('PM-6: saves confirmedBy with the adminId', async () => {
      repository.findOne.mockResolvedValueOnce(PAYMENT_STUB).mockResolvedValueOnce(PAYMENT_STUB);

      await service.confirmManual('pay-1', 'admin-uuid-999', {});

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ confirmedBy: 'admin-uuid-999' }),
        }),
      );
    });
  });
});
