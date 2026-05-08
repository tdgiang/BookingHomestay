/**
 * User Journeys — AuthService
 *
 * AS-1: Admin registers a new account via UsersService.create
 * AS-2: Admin logs in with valid credentials → receives accessToken + refreshToken + user (no password)
 * AS-3: Login throws UnauthorizedException when password is wrong
 * AS-4: Login throws UnauthorizedException when account is inactive
 * AS-5: Login throws UnauthorizedException when user email not found
 * AS-6: Refresh validates refresh token and returns new accessToken
 * AS-7: Refresh throws UnauthorizedException for wrong token type
 * AS-8: Refresh throws UnauthorizedException when user inactive or missing
 * AS-9: Refresh throws UnauthorizedException for expired / invalid token
 * AS-10: validateUser returns the user record for a valid JWT payload
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/application/users.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as { compare: jest.Mock; hash: jest.Mock };

const USER_STUB = {
  id: 'user-1',
  email: 'admin@example.com',
  password: 'hashed-pw',
  firstName: 'Admin',
  lastName: null,
  role: 'ADMIN',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockUsers = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByEmail: jest.fn(),
    };
    const mockJwt = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn(),
    };
    const mockConfig = { get: jest.fn().mockReturnValue('15m') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsers },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── AS-1: register ──────────────────────────────────────────────────────

  describe('register (AS-1)', () => {
    it('AS-1: delegates to usersService.create', async () => {
      const dto = { email: 'new@example.com', password: 'pw123', firstName: 'A' };
      usersService.create.mockResolvedValue({ id: 'user-2', ...dto } as any);

      const result = await service.register(dto as any);

      expect(usersService.create).toHaveBeenCalledWith(dto);
      expect((result as any).id).toBe('user-2');
    });
  });

  // ─── AS-2: login success ─────────────────────────────────────────────────

  describe('login — success (AS-2)', () => {
    beforeEach(async () => {
      usersService.findByEmail.mockResolvedValue(USER_STUB as any);
      bcrypt.compare.mockResolvedValue(true as any);
    });

    it('AS-2: returns accessToken, refreshToken, and user without password', async () => {
      const result = await service.login({ email: USER_STUB.email, password: 'plain' });

      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect((result.user as any).password).toBeUndefined();
    });

    it('AS-2: user email matches input', async () => {
      const result = await service.login({ email: USER_STUB.email, password: 'plain' });

      expect((result.user as any).email).toBe(USER_STUB.email);
    });

    it('AS-2: jwtService.sign called twice (access + refresh)', async () => {
      await service.login({ email: USER_STUB.email, password: 'plain' });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('AS-2: access token payload includes sub and email', async () => {
      await service.login({ email: USER_STUB.email, password: 'plain' });

      const firstCall = jwtService.sign.mock.calls[0][0];
      expect(firstCall).toMatchObject({ sub: USER_STUB.id, email: USER_STUB.email });
    });

    it('AS-2: refresh token payload includes type="refresh"', async () => {
      await service.login({ email: USER_STUB.email, password: 'plain' });

      const secondCall = jwtService.sign.mock.calls[1][0];
      expect(secondCall).toMatchObject({ sub: USER_STUB.id, type: 'refresh' });
    });
  });

  // ─── AS-3: wrong password ────────────────────────────────────────────────

  describe('login — wrong password (AS-3)', () => {
    it('AS-3: throws UnauthorizedException when bcrypt.compare returns false', async () => {
      usersService.findByEmail.mockResolvedValue(USER_STUB as any);
      bcrypt.compare.mockResolvedValue(false as any);

      await expect(service.login({ email: USER_STUB.email, password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── AS-4: inactive account ──────────────────────────────────────────────

  describe('login — inactive account (AS-4)', () => {
    it('AS-4: throws UnauthorizedException when account is inactive', async () => {
      usersService.findByEmail.mockResolvedValue({ ...USER_STUB, isActive: false } as any);
      bcrypt.compare.mockResolvedValue(true as any);

      await expect(service.login({ email: USER_STUB.email, password: 'plain' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── AS-5: user not found ────────────────────────────────────────────────

  describe('login — user not found (AS-5)', () => {
    it('AS-5: throws UnauthorizedException when email does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login({ email: 'no@example.com', password: 'plain' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── AS-6: refresh success ───────────────────────────────────────────────

  describe('refresh — success (AS-6)', () => {
    it('AS-6: returns new accessToken when refresh token is valid', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', type: 'refresh' });
      usersService.findOne.mockResolvedValue({ ...USER_STUB } as any);

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('signed-token');
    });

    it('AS-6: calls jwtService.verify with the refresh secret', async () => {
      configService.get.mockReturnValue('refresh-secret');
      jwtService.verify.mockReturnValue({ sub: 'user-1', type: 'refresh' });
      usersService.findOne.mockResolvedValue({ ...USER_STUB } as any);

      await service.refresh('token');

      expect(jwtService.verify).toHaveBeenCalledWith('token', expect.objectContaining({ secret: 'refresh-secret' }));
    });
  });

  // ─── AS-7: wrong token type ──────────────────────────────────────────────

  describe('refresh — wrong type (AS-7)', () => {
    it('AS-7: throws UnauthorizedException when type != "refresh"', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', type: 'access' });

      await expect(service.refresh('access-token-passed-as-refresh'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── AS-8: user inactive ─────────────────────────────────────────────────

  describe('refresh — inactive user (AS-8)', () => {
    it('AS-8: throws when user is inactive', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', type: 'refresh' });
      usersService.findOne.mockResolvedValue({ ...USER_STUB, isActive: false } as any);

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── AS-9: invalid token ─────────────────────────────────────────────────

  describe('refresh — invalid token (AS-9)', () => {
    it('AS-9: throws UnauthorizedException when verify throws', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('expired'); });

      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── AS-10: validateUser ─────────────────────────────────────────────────

  describe('validateUser (AS-10)', () => {
    it('AS-10: returns user by id from the JWT payload', async () => {
      usersService.findOne.mockResolvedValue(USER_STUB as any);

      const result = await service.validateUser({ sub: 'user-1', email: USER_STUB.email });

      expect(usersService.findOne).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(USER_STUB);
    });
  });
});
