/**
 * User Journeys — JwtAuthGuard
 *
 * JG-1: @Public() routes bypass JWT authentication entirely
 * JG-2: Protected routes delegate to the Passport JWT strategy
 */

import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

function makeContext(isPublic: boolean): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new JwtAuthGuard(reflector);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(guard).toBeDefined());

  // ─── JG-1: public routes ─────────────────────────────────────────────────

  describe('@Public() bypass (JG-1)', () => {
    it('JG-1: returns true immediately for @Public() routes', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const ctx = makeContext(true);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('JG-1: reads the IS_PUBLIC_KEY from handler and class', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const ctx = makeContext(true);

      guard.canActivate(ctx);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        [ctx.getHandler(), ctx.getClass()],
      );
    });
  });

  // ─── JG-2: protected routes ──────────────────────────────────────────────

  describe('protected routes (JG-2)', () => {
    it('JG-2: delegates to super.canActivate when route is not public', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const ctx = makeContext(false);

      const superSpy = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true);

      guard.canActivate(ctx);

      expect(superSpy).toHaveBeenCalledWith(ctx);
      superSpy.mockRestore();
    });

    it('JG-2: delegates when IS_PUBLIC_KEY is undefined (not decorated)', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const ctx = makeContext(false);

      const superSpy = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(false);

      const result = guard.canActivate(ctx);

      expect(result).toBe(false);
      superSpy.mockRestore();
    });
  });
});
