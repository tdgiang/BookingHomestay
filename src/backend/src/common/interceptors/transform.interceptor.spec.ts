/**
 * User Journeys — TransformInterceptor
 *
 * TI-1: Wraps every response in { success, statusCode, timestamp, path, message, data }
 * TI-2: Uses data.message as the message field when present
 * TI-3: Falls back to "Success" when message is absent
 * TI-4: Uses data.data as the data field when present; otherwise uses full value
 * TI-5: success is always boolean true
 * TI-6: timestamp is a valid ISO date string
 */

import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

function makeContext(url = '/api/v1/rooms', statusCode = 200): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ url }),
      getResponse: () => ({ statusCode }),
    }),
  } as unknown as ExecutionContext;
}

function makeHandler(value: unknown): CallHandler {
  return { handle: () => of(value) };
}

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should be defined', () => expect(interceptor).toBeDefined());

  // ─── TI-1: envelope ──────────────────────────────────────────────────────

  describe('response envelope (TI-1)', () => {
    it('TI-1: emits an object with the standard envelope keys', (done) => {
      const ctx = makeContext();
      const handler = makeHandler({ message: 'ok', data: [1, 2] });

      interceptor.intercept(ctx, handler).subscribe({
        next: (result: any) => {
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('statusCode');
          expect(result).toHaveProperty('timestamp');
          expect(result).toHaveProperty('path');
          expect(result).toHaveProperty('message');
          expect(result).toHaveProperty('data');
          done();
        },
      });
    });

    it('TI-1: path matches the request URL', (done) => {
      const ctx = makeContext('/api/v1/bookings');
      interceptor.intercept(ctx, makeHandler({ message: 'ok', data: {} })).subscribe({
        next: (result: any) => {
          expect(result.path).toBe('/api/v1/bookings');
          done();
        },
      });
    });

    it('TI-1: statusCode matches the response status', (done) => {
      const ctx = makeContext('/api/v1/rooms', 201);
      interceptor.intercept(ctx, makeHandler({})).subscribe({
        next: (result: any) => {
          expect(result.statusCode).toBe(201);
          done();
        },
      });
    });
  });

  // ─── TI-2 / TI-3: message ────────────────────────────────────────────────

  describe('message field (TI-2, TI-3)', () => {
    it('TI-2: uses data.message when present', (done) => {
      const ctx = makeContext();
      interceptor.intercept(ctx, makeHandler({ message: 'Tạo thành công', data: {} })).subscribe({
        next: (result: any) => {
          expect(result.message).toBe('Tạo thành công');
          done();
        },
      });
    });

    it('TI-3: defaults to "Success" when message is absent', (done) => {
      const ctx = makeContext();
      interceptor.intercept(ctx, makeHandler(null)).subscribe({
        next: (result: any) => {
          expect(result.message).toBe('Success');
          done();
        },
      });
    });
  });

  // ─── TI-4: data extraction ───────────────────────────────────────────────

  describe('data field (TI-4)', () => {
    it('TI-4: uses data.data when the envelope has a nested data key', (done) => {
      const ctx = makeContext();
      const payload = { message: 'ok', data: { id: 'room-1' } };
      interceptor.intercept(ctx, makeHandler(payload)).subscribe({
        next: (result: any) => {
          expect(result.data).toEqual({ id: 'room-1' });
          done();
        },
      });
    });

    it('TI-4: uses full value as data when no nested data key', (done) => {
      const ctx = makeContext();
      interceptor.intercept(ctx, makeHandler([1, 2, 3])).subscribe({
        next: (result: any) => {
          expect(result.data).toEqual([1, 2, 3]);
          done();
        },
      });
    });
  });

  // ─── TI-5: success ───────────────────────────────────────────────────────

  describe('success flag (TI-5)', () => {
    it('TI-5: success is always true', (done) => {
      const ctx = makeContext();
      interceptor.intercept(ctx, makeHandler({ message: 'ok', data: {} })).subscribe({
        next: (result: any) => {
          expect(result.success).toBe(true);
          done();
        },
      });
    });
  });

  // ─── TI-6: timestamp ─────────────────────────────────────────────────────

  describe('timestamp (TI-6)', () => {
    it('TI-6: timestamp is a valid ISO date string', (done) => {
      const ctx = makeContext();
      interceptor.intercept(ctx, makeHandler({})).subscribe({
        next: (result: any) => {
          expect(typeof result.timestamp).toBe('string');
          expect(() => new Date(result.timestamp)).not.toThrow();
          expect(new Date(result.timestamp).getTime()).not.toBeNaN();
          done();
        },
      });
    });
  });
});
