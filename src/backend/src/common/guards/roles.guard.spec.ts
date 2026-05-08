/**
 * User Journeys — RolesGuard
 *
 * RG-1: Route with no @Roles() decorator → any authenticated user passes
 * RG-2: User with matching role is granted access
 * RG-3: User with a different role is denied
 * RG-4: No user in request → denied
 */

import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

function makeContext(requiredRoles: Role[] | undefined, userRole?: Role): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => (userRole ? { user: { role: userRole } } : { user: undefined }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(guard).toBeDefined());

  // ─── RG-1: no roles required ─────────────────────────────────────────────

  describe('no roles required (RG-1)', () => {
    it('RG-1: allows access when @Roles() is not set', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const ctx = makeContext(undefined, Role.USER);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('RG-1: reads ROLES_KEY from handler and class', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const ctx = makeContext(undefined);

      guard.canActivate(ctx);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        ROLES_KEY,
        [ctx.getHandler(), ctx.getClass()],
      );
    });
  });

  // ─── RG-2: matching role ──────────────────────────────────────────────────

  describe('matching role (RG-2)', () => {
    it('RG-2: grants access when user has the required role', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const ctx = makeContext([Role.ADMIN], Role.ADMIN);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('RG-2: grants access when user has one of multiple required roles', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.USER]);
      const ctx = makeContext([Role.ADMIN, Role.USER], Role.USER);

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  // ─── RG-3: wrong role ────────────────────────────────────────────────────

  describe('wrong role (RG-3)', () => {
    it('RG-3: denies access when user role does not match required', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const ctx = makeContext([Role.ADMIN], Role.USER);

      expect(guard.canActivate(ctx)).toBe(false);
    });
  });

  // ─── RG-4: no user ───────────────────────────────────────────────────────

  describe('no user in request (RG-4)', () => {
    it('RG-4: denies access when user is not attached to request', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const ctx = makeContext([Role.ADMIN], undefined);

      expect(guard.canActivate(ctx)).toBeFalsy();
    });
  });
});
