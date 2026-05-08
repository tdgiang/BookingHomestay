/**
 * Controller specs — AuthController
 * Thin delegation: each action calls the correct service method and wraps { message, data }.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../application/auth.service';

const AUTH_RESULT = {
  user: { id: 'u1', email: 'a@b.com' },
  accessToken: 'access',
  refreshToken: 'refresh',
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockService = { register: jest.fn(), login: jest.fn(), refresh: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    }).compile();

    controller = module.get(AuthController);
    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  describe('register', () => {
    it('delegates to authService.register', async () => {
      service.register.mockResolvedValue({ id: 'u1' } as any);
      const result = await controller.register({ email: 'a@b.com', password: 'pw' } as any);
      expect(service.register).toHaveBeenCalled();
      expect(result.data).toBeDefined();
    });

    it('returns success message', async () => {
      service.register.mockResolvedValue({ id: 'u1' } as any);
      const result = await controller.register({ email: 'a@b.com', password: 'pw' } as any);
      expect(result.message).toContain('Đăng ký');
    });
  });

  describe('login', () => {
    it('delegates to authService.login', async () => {
      service.login.mockResolvedValue(AUTH_RESULT as any);
      const result = await controller.login({ email: 'a@b.com', password: 'pw' } as any);
      expect(service.login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' });
      expect(result.data).toEqual(AUTH_RESULT);
    });
  });

  describe('refresh', () => {
    it('delegates to authService.refresh with the token', async () => {
      service.refresh.mockResolvedValue({ accessToken: 'new' });
      const result = await controller.refresh({ refreshToken: 'rt' } as any);
      expect(service.refresh).toHaveBeenCalledWith('rt');
      expect(result.data).toEqual({ accessToken: 'new' });
    });
  });
});
