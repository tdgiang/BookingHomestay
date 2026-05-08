/**
 * User Journeys — NotificationsService
 *
 * NS-1: On new booking, WebSocket gateway emits 'new_booking' with booking details
 * NS-2: On new booking with future check-in + guest email, queues delayed check-in reminder
 * NS-3: On new booking without guest email, skips email queue
 * NS-4: On new booking where T-1 reminder time is already past, skips queue even with email
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { CHECK_IN_REMINDER_QUEUE } from './check-in-reminder.processor';

const TWO_DAYS_FROM_NOW = new Date(Date.now() + 48 * 60 * 60 * 1000);
const SIX_HOURS_FROM_NOW = new Date(Date.now() + 6 * 60 * 60 * 1000);

describe('NotificationsService', () => {
  let service: NotificationsService;
  let gateway: jest.Mocked<Pick<NotificationsGateway, 'emitNewBooking'>>;
  let queue: { add: jest.Mock };

  beforeEach(async () => {
    const mockGateway = { emitNewBooking: jest.fn() };
    const mockQueue = { add: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsGateway, useValue: mockGateway },
        { provide: getQueueToken(CHECK_IN_REMINDER_QUEUE), useValue: mockQueue },
      ],
    }).compile();

    service = module.get(NotificationsService);
    gateway = module.get(NotificationsGateway) as any;
    queue = mockQueue;
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── NS-1: WebSocket emit ────────────────────────────────────────────────

  describe('onNewBooking — WebSocket emit (NS-1)', () => {
    it('NS-1: calls gateway.emitNewBooking with bookingCode, guestName, roomName', async () => {
      await service.onNewBooking({
        bookingCode: 'HSB-20260701-ABCD',
        guestName: 'Nguyễn Văn A',
        guestEmail: 'a@example.com',
        roomName: 'Phòng Hoa Sen',
        checkIn: TWO_DAYS_FROM_NOW,
      });

      expect(gateway.emitNewBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingCode: 'HSB-20260701-ABCD',
          guestName: 'Nguyễn Văn A',
          roomName: 'Phòng Hoa Sen',
        }),
      );
    });

    it('NS-1: emitted checkIn is an ISO string', async () => {
      await service.onNewBooking({
        bookingCode: 'HSB-20260701-ABCD',
        guestName: 'A',
        guestEmail: null,
        roomName: 'R',
        checkIn: TWO_DAYS_FROM_NOW,
      });

      const payload = (gateway.emitNewBooking as jest.Mock).mock.calls[0][0];
      expect(typeof payload.checkIn).toBe('string');
      expect(new Date(payload.checkIn).toISOString()).toBe(TWO_DAYS_FROM_NOW.toISOString());
    });

    it('NS-1: gateway is called even when guestEmail is null', async () => {
      await service.onNewBooking({
        bookingCode: 'HSB-20260701-ABCD',
        guestName: 'Guest',
        guestEmail: null,
        roomName: 'Room',
        checkIn: TWO_DAYS_FROM_NOW,
      });

      expect(gateway.emitNewBooking).toHaveBeenCalledTimes(1);
    });
  });

  // ─── NS-2: email queue ───────────────────────────────────────────────────

  describe('onNewBooking — email queue (NS-2)', () => {
    it('NS-2: queues check-in reminder when email present and check-in is far in the future', async () => {
      await service.onNewBooking({
        bookingCode: 'HSB-20260701-ABCD',
        guestName: 'Nguyễn Văn A',
        guestEmail: 'a@example.com',
        roomName: 'R',
        checkIn: TWO_DAYS_FROM_NOW,
      });

      expect(queue.add).toHaveBeenCalledWith(
        'check-in-reminder',
        expect.objectContaining({
          bookingCode: 'HSB-20260701-ABCD',
          guestEmail: 'a@example.com',
          guestName: 'Nguyễn Văn A',
        }),
        expect.objectContaining({ delay: expect.any(Number) }),
      );
    });

    it('NS-2: delay is a positive number for future check-in', async () => {
      await service.onNewBooking({
        bookingCode: 'HSB-20260701-ABCD',
        guestName: 'A',
        guestEmail: 'a@example.com',
        roomName: 'R',
        checkIn: TWO_DAYS_FROM_NOW,
      });

      const opts = queue.add.mock.calls[0][2];
      expect(opts.delay).toBeGreaterThan(0);
    });

    it('NS-2: queued job includes checkIn as ISO string', async () => {
      await service.onNewBooking({
        bookingCode: 'HSB-20260701-ABCD',
        guestName: 'A',
        guestEmail: 'a@example.com',
        roomName: 'R',
        checkIn: TWO_DAYS_FROM_NOW,
      });

      const jobData = queue.add.mock.calls[0][1];
      expect(typeof jobData.checkIn).toBe('string');
    });
  });

  // ─── NS-3: no email ──────────────────────────────────────────────────────

  describe('onNewBooking — no email skips queue (NS-3)', () => {
    it('NS-3: does NOT add to queue when guestEmail is null', async () => {
      await service.onNewBooking({
        bookingCode: 'HSB-20260701-ABCD',
        guestName: 'A',
        guestEmail: null,
        roomName: 'R',
        checkIn: TWO_DAYS_FROM_NOW,
      });

      expect(queue.add).not.toHaveBeenCalled();
    });

    it('NS-3: does NOT add to queue when guestEmail is undefined', async () => {
      await service.onNewBooking({
        bookingCode: 'HSB-20260701-ABCD',
        guestName: 'A',
        guestEmail: undefined,
        roomName: 'R',
        checkIn: TWO_DAYS_FROM_NOW,
      });

      expect(queue.add).not.toHaveBeenCalled();
    });
  });

  // ─── NS-4: T-1 already past ──────────────────────────────────────────────

  describe('onNewBooking — T-1 past skips queue (NS-4)', () => {
    it('NS-4: does NOT queue when check-in is only 6 h away (T-1 is already past)', async () => {
      await service.onNewBooking({
        bookingCode: 'HSB-20260701-ABCD',
        guestName: 'A',
        guestEmail: 'a@example.com',
        roomName: 'R',
        checkIn: SIX_HOURS_FROM_NOW,
      });

      expect(queue.add).not.toHaveBeenCalled();
    });
  });
});
