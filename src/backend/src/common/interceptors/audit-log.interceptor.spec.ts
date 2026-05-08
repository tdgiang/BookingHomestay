/**
 * User Journeys — AuditLogInterceptor
 *
 * AL-1: POST /admin/* — logs method, URL, and authenticated user email
 * AL-2: PATCH and DELETE /admin/* — also logged
 * AL-3: GET requests and non-admin routes — NOT logged, response still passes through
 */

import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { AuditLogInterceptor } from './audit-log.interceptor';

function makeContext(method: string, url: string, userEmail?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        url,
        user: userEmail ? { email: userEmail } : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

function makeHandler(value: unknown = { ok: true }): CallHandler {
  return { handle: () => of(value) };
}

describe('AuditLogInterceptor', () => {
  let interceptor: AuditLogInterceptor;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new AuditLogInterceptor();
    logSpy = jest.spyOn((interceptor as any).logger, 'log').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => expect(interceptor).toBeDefined());

  // ─── AL-1: POST /admin/* ─────────────────────────────────────────────────

  describe('POST /admin/* mutations (AL-1)', () => {
    it('AL-1: logs the request after it completes', (done) => {
      const ctx = makeContext('POST', '/api/v1/admin/bookings', 'admin@example.com');

      interceptor.intercept(ctx, makeHandler()).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledTimes(1);
          done();
        },
      });
    });

    it('AL-1: log message contains the admin email', (done) => {
      const ctx = makeContext('POST', '/api/v1/admin/bookings', 'admin@example.com');

      interceptor.intercept(ctx, makeHandler()).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('admin@example.com'));
          done();
        },
      });
    });

    it('AL-1: log message contains the URL', (done) => {
      const ctx = makeContext('POST', '/api/v1/admin/bookings', 'admin@example.com');

      interceptor.intercept(ctx, makeHandler()).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('/admin/bookings'));
          done();
        },
      });
    });

    it('AL-1: log message contains the HTTP method', (done) => {
      const ctx = makeContext('POST', '/api/v1/admin/guests', 'admin@example.com');

      interceptor.intercept(ctx, makeHandler()).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('POST'));
          done();
        },
      });
    });

    it('AL-1: uses "unknown" when no user is attached to the request', (done) => {
      const ctx = makeContext('POST', '/api/v1/admin/bookings');

      interceptor.intercept(ctx, makeHandler()).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('unknown'));
          done();
        },
      });
    });
  });

  // ─── AL-2: PATCH & DELETE ────────────────────────────────────────────────

  describe('PATCH and DELETE /admin/* mutations (AL-2)', () => {
    it('AL-2: logs PATCH /admin/*', (done) => {
      const ctx = makeContext('PATCH', '/api/v1/admin/bookings/booking-1', 'admin@example.com');

      interceptor.intercept(ctx, makeHandler()).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledTimes(1);
          done();
        },
      });
    });

    it('AL-2: logs DELETE /admin/*', (done) => {
      const ctx = makeContext('DELETE', '/api/v1/admin/guests/guest-1', 'admin@example.com');

      interceptor.intercept(ctx, makeHandler()).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledTimes(1);
          done();
        },
      });
    });

    it('AL-2: PATCH log includes the correct URL', (done) => {
      const ctx = makeContext('PATCH', '/api/v1/admin/payments/pay-1/confirm', 'admin@example.com');

      interceptor.intercept(ctx, makeHandler()).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('/admin/payments'));
          done();
        },
      });
    });
  });

  // ─── AL-3: no-op for GET / non-admin ─────────────────────────────────────

  describe('pass-through without logging (AL-3)', () => {
    it('AL-3: does NOT log GET /admin/* requests', (done) => {
      const ctx = makeContext('GET', '/api/v1/admin/bookings', 'admin@example.com');

      interceptor.intercept(ctx, makeHandler()).subscribe({
        complete: () => {
          expect(logSpy).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('AL-3: does NOT log POST to non-admin routes', (done) => {
      const ctx = makeContext('POST', '/api/v1/bookings', 'user@example.com');

      interceptor.intercept(ctx, makeHandler()).subscribe({
        complete: () => {
          expect(logSpy).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('AL-3: does NOT log PUT to non-admin routes', (done) => {
      const ctx = makeContext('PUT', '/api/v1/rooms/room-1');

      interceptor.intercept(ctx, makeHandler()).subscribe({
        complete: () => {
          expect(logSpy).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('AL-3: response value still passes through for non-logged routes', (done) => {
      const ctx = makeContext('GET', '/api/v1/rooms');
      const result: unknown[] = [];

      interceptor.intercept(ctx, makeHandler({ data: 'rooms' })).subscribe({
        next: (v) => result.push(v),
        complete: () => {
          expect(result).toEqual([{ data: 'rooms' }]);
          done();
        },
      });
    });

    it('AL-3: response value still passes through for logged routes', (done) => {
      const ctx = makeContext('POST', '/api/v1/admin/bookings', 'admin@example.com');
      const result: unknown[] = [];

      interceptor.intercept(ctx, makeHandler({ id: 'booking-1' })).subscribe({
        next: (v) => result.push(v),
        complete: () => {
          expect(result).toEqual([{ id: 'booking-1' }]);
          done();
        },
      });
    });
  });
});
