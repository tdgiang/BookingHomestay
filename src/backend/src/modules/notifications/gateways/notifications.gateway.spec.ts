/**
 * User Journeys — NotificationsGateway
 *
 * NG-1: emitNewBooking broadcasts to all connected clients on the 'new_booking' channel
 * NG-2: emitted payload includes a timestamp field (at) for display in the UI
 */

import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let mockServer: { emit: jest.Mock };

  const PAYLOAD = {
    bookingCode: 'HSB-20260701-ABCD',
    guestName: 'Nguyễn Văn A',
    roomName: 'Phòng Hoa Sen',
    checkIn: '2026-07-01T14:00:00.000Z',
  };

  beforeEach(() => {
    gateway = new NotificationsGateway();
    mockServer = { emit: jest.fn() };
    (gateway as any).server = mockServer;
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(gateway).toBeDefined());

  // ─── NG-1: event channel ─────────────────────────────────────────────────

  describe('emitNewBooking — event channel (NG-1)', () => {
    it('NG-1: emits on the "new_booking" channel', () => {
      gateway.emitNewBooking(PAYLOAD);

      const eventName: string = mockServer.emit.mock.calls[0][0];
      expect(eventName).toBe('new_booking');
    });

    it('NG-1: calls server.emit exactly once per call', () => {
      gateway.emitNewBooking(PAYLOAD);

      expect(mockServer.emit).toHaveBeenCalledTimes(1);
    });

    it('NG-1: payload contains bookingCode, guestName, roomName, checkIn', () => {
      gateway.emitNewBooking(PAYLOAD);

      expect(mockServer.emit).toHaveBeenCalledWith(
        'new_booking',
        expect.objectContaining({
          bookingCode: PAYLOAD.bookingCode,
          guestName: PAYLOAD.guestName,
          roomName: PAYLOAD.roomName,
          checkIn: PAYLOAD.checkIn,
        }),
      );
    });
  });

  // ─── NG-2: timestamp ─────────────────────────────────────────────────────

  describe('emitNewBooking — timestamp (NG-2)', () => {
    it('NG-2: emitted payload includes an "at" timestamp field', () => {
      gateway.emitNewBooking(PAYLOAD);

      const emitted = mockServer.emit.mock.calls[0][1];
      expect(emitted.at).toBeDefined();
    });

    it('NG-2: "at" timestamp is a valid ISO date string', () => {
      gateway.emitNewBooking(PAYLOAD);

      const emitted = mockServer.emit.mock.calls[0][1];
      expect(() => new Date(emitted.at)).not.toThrow();
      expect(new Date(emitted.at).getTime()).not.toBeNaN();
    });

    it('NG-2: "at" timestamp reflects approximately the current time', () => {
      const before = Date.now();
      gateway.emitNewBooking(PAYLOAD);
      const after = Date.now();

      const emitted = mockServer.emit.mock.calls[0][1];
      const ts = new Date(emitted.at).getTime();
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });
  });
});
