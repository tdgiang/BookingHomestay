/**
 * User Journeys — UsersService
 *
 * US-1: findOne returns user from cache; falls back to DB; throws 404 for unknown id
 * US-2: findAll returns cached list; queries DB on miss; applies search/email/isActive filters
 * US-3: create hashes password, throws ConflictException if email already exists
 * US-4: update hashes new password if provided; invalidates cache
 * US-5: remove soft-deletes; strips password; invalidates cache
 * US-6: findByEmail delegates to repository.findFirst
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from '../infrastructure/users.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, NotFoundException } from '@nestjs/common';

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed'), compare: jest.fn() }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as { hash: jest.Mock; compare: jest.Mock };

const USER_STUB = {
  id: 'user-1',
  email: 'user@example.com',
  password: 'hashed',
  firstName: 'Nguyen',
  lastName: 'A',
  role: 'USER',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    softRemove: jest.fn(),
    remove: jest.fn(),
    userSelect: {},
  };

  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── US-3: create ────────────────────────────────────────────────────────

  describe('create (US-3)', () => {
    it('US-3: hashes password before persisting', async () => {
      mockRepository.findFirst.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed-pw' as any);
      mockRepository.create.mockResolvedValue(USER_STUB as any);

      await service.create({ email: 'new@example.com', password: 'plain123' } as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain123', 10);
    });

    it('US-3: returned value does not contain password', async () => {
      mockRepository.findFirst.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as any);
      mockRepository.create.mockResolvedValue(USER_STUB as any);

      const result = await service.create({ email: 'new@example.com', password: 'pw' } as any) as any;

      expect(result.password).toBeUndefined();
    });

    it('US-3: throws ConflictException when email already exists', async () => {
      mockRepository.findFirst.mockResolvedValue(USER_STUB as any);

      await expect(service.create({ email: USER_STUB.email, password: 'pw' } as any))
        .rejects.toThrow(ConflictException);
    });

    it('US-3: does NOT call repository.create when email conflict detected', async () => {
      mockRepository.findFirst.mockResolvedValue(USER_STUB as any);

      await expect(service.create({ email: USER_STUB.email, password: 'pw' } as any)).rejects.toThrow();

      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  // ─── US-2: findAll ───────────────────────────────────────────────────────

  describe('findAll (US-2)', () => {
    it('US-2: returns cached list without querying DB', async () => {
      const cached = { items: [USER_STUB], meta: { total: 1 } };
      mockCacheManager.get.mockResolvedValue(cached);

      const result = await service.findAll({} as any);

      expect(result).toEqual(cached);
      expect(mockRepository.findAll).not.toHaveBeenCalled();
    });

    it('US-2: queries DB and caches result on miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue([[USER_STUB], 1]);

      const result = await service.findAll({} as any) as any;

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it('US-2: applies isActive filter', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue([[], 0]);

      await service.findAll({ isActive: true } as any);

      const where = mockRepository.findAll.mock.calls[0][0].where;
      expect(where.isActive).toBe(true);
    });

    it('US-2: applies email filter', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue([[], 0]);

      await service.findAll({ email: 'x@y.com' } as any);

      const where = mockRepository.findAll.mock.calls[0][0].where;
      expect(where.email).toBe('x@y.com');
    });
  });

  // ─── US-4: update ────────────────────────────────────────────────────────

  describe('update (US-4)', () => {
    it('US-4: hashes password when included in update DTO', async () => {
      mockCacheManager.get.mockResolvedValue(USER_STUB);
      bcrypt.hash.mockResolvedValue('new-hash' as any);
      mockRepository.update.mockResolvedValue({ ...USER_STUB, firstName: 'B' } as any);

      await service.update('user-1', { password: 'new-plain' } as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('new-plain', 10);
    });

    it('US-4: does NOT call bcrypt when password not in DTO', async () => {
      mockCacheManager.get.mockResolvedValue(USER_STUB);
      mockRepository.update.mockResolvedValue(USER_STUB as any);
      bcrypt.hash.mockClear();

      await service.update('user-1', { firstName: 'B' } as any);

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('US-4: invalidates user cache entry after update', async () => {
      mockCacheManager.get.mockResolvedValue(USER_STUB);
      mockRepository.update.mockResolvedValue(USER_STUB as any);

      await service.update('user-1', { firstName: 'B' } as any);

      expect(mockCacheManager.del).toHaveBeenCalledWith('user_user-1');
    });

    it('US-4: throws NotFoundException when user not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('bad-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ─── US-5: remove ────────────────────────────────────────────────────────

  describe('remove (US-5)', () => {
    it('US-5: soft-deletes user', async () => {
      mockCacheManager.get.mockResolvedValue(USER_STUB);
      mockRepository.softRemove.mockResolvedValue({ ...USER_STUB, deletedAt: new Date() } as any);

      await service.remove('user-1');

      expect(mockRepository.softRemove).toHaveBeenCalledWith({ id: 'user-1' });
    });

    it('US-5: returned value strips password', async () => {
      mockCacheManager.get.mockResolvedValue(USER_STUB);
      mockRepository.softRemove.mockResolvedValue({ ...USER_STUB, deletedAt: new Date() } as any);

      const result = await service.remove('user-1') as any;

      expect(result.password).toBeUndefined();
    });

    it('US-5: throws NotFoundException when user not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── US-6: findByEmail ───────────────────────────────────────────────────

  describe('findByEmail (US-6)', () => {
    it('US-6: delegates to repository.findFirst with email and deletedAt filter', async () => {
      mockRepository.findFirst.mockResolvedValue(USER_STUB as any);

      const result = await service.findByEmail('user@example.com');

      expect(mockRepository.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@example.com', deletedAt: null }),
      );
      expect(result).toEqual(USER_STUB);
    });

    it('US-6: returns null when email not found', async () => {
      mockRepository.findFirst.mockResolvedValue(null);

      const result = await service.findByEmail('nobody@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return a user from cache if available', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockCacheManager.get.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toEqual(mockUser);
      expect(mockCacheManager.get).toHaveBeenCalledWith('user_1');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it('should return a user from repository if not in cache', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should call repository with correct search filters', async () => {
      const query = { search: 'John', page: 1, limit: 10 };
      const mockUsers = [
        { id: '1', email: 'john@example.com', firstName: 'John' },
      ];
      const total = 1;

      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue([mockUsers, total]);

      const result = await service.findAll(query as any);

      expect(result.items).toEqual(mockUsers);
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            OR: [
              { email: { contains: 'John', mode: 'insensitive' } },
              { firstName: { contains: 'John', mode: 'insensitive' } },
              { lastName: { contains: 'John', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });
});
