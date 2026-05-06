import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from '../infrastructure/users.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    userSelect: {},
  };

  const mockCacheManager = {
    get: jest.fn(),
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
    repository = module.get<UsersRepository>(UsersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
