/**
 * User Journeys — ProductsService
 *
 * PS-1: Admin creates product → persists and invalidates list cache
 * PS-2: FindAll returns from cache when cache hit
 * PS-3: FindAll queries DB, caches result on cache miss
 * PS-4: FindAll applies search / category / isActive filters
 * PS-5: FindOne returns from cache; throws 404 for unknown id
 * PS-6: Update patches product and invalidates cache
 * PS-7: Remove soft-deletes product and invalidates cache
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { ProductsService } from './products.service';
import { ProductsRepository } from '../infrastructure/products.repository';

const PRODUCT_STUB = {
  id: 'prod-1',
  name: 'Test Product',
  description: 'A test product',
  price: 100000,
  stock: 10,
  category: 'Test',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<ProductsRepository>;
  let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    cache = { get: jest.fn().mockResolvedValue(null), set: jest.fn(), del: jest.fn() };

    const mockRepo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      softRemove: jest.fn(),
      productSelect: { id: true },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: ProductsRepository, useValue: mockRepo },
        { provide: CACHE_MANAGER, useValue: cache },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(60000) } },
      ],
    }).compile();

    service = module.get(ProductsService);
    repository = module.get(ProductsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── PS-1: create ─────────────────────────────────────────────────────────

  describe('create (PS-1)', () => {
    it('PS-1: creates product via repository', async () => {
      repository.create.mockResolvedValue(PRODUCT_STUB);

      const result = await service.create({ name: 'Test', price: 100000, stock: 1 } as any);

      expect(repository.create).toHaveBeenCalled();
      expect((result as any).id).toBe('prod-1');
    });

    it('PS-1: calls cache.set after creation (indirectly via findAll cache track)', async () => {
      repository.create.mockResolvedValue(PRODUCT_STUB);
      // pre-seed a list cache key by a findAll cache miss so invalidateListCache has work to do
      cache.get.mockResolvedValueOnce(null);
      repository.findAll.mockResolvedValue([[PRODUCT_STUB], 1]);
      await service.findAll({} as any);   // registers a cacheKey in listCacheKeys

      cache.del.mockClear();
      cache.get.mockResolvedValue(null);
      await service.create({ name: 'New', price: 50000, stock: 1 } as any);

      expect(cache.del).toHaveBeenCalled();
    });
  });

  // ─── PS-2 / PS-3: findAll cache ──────────────────────────────────────────

  describe('findAll — cache behaviour (PS-2, PS-3)', () => {
    it('PS-2: returns cached result without querying DB', async () => {
      const cached = { items: [PRODUCT_STUB], meta: { total: 1 } };
      cache.get.mockResolvedValue(cached);

      const result = await service.findAll({} as any);

      expect(result).toEqual(cached);
      expect(repository.findAll).not.toHaveBeenCalled();
    });

    it('PS-3: queries DB and stores in cache on cache miss', async () => {
      cache.get.mockResolvedValue(null);
      repository.findAll.mockResolvedValue([[PRODUCT_STUB], 1]);

      const result = await service.findAll({} as any) as any;

      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it('PS-3: meta totalPages is calculated correctly', async () => {
      cache.get.mockResolvedValue(null);
      repository.findAll.mockResolvedValue([[PRODUCT_STUB, PRODUCT_STUB], 11]);

      const result = await service.findAll({ limit: 5 } as any) as any;

      expect(result.meta.totalPages).toBe(3);
    });
  });

  // ─── PS-4: filters ────────────────────────────────────────────────────────

  describe('findAll — filters (PS-4)', () => {
    beforeEach(() => {
      cache.get.mockResolvedValue(null);
      repository.findAll.mockResolvedValue([[], 0]);
    });

    it('PS-4: applies name/description search filter', async () => {
      await service.findAll({ search: 'test' } as any);

      const where = repository.findAll.mock.calls[0][0].where;
      expect(where.OR).toBeDefined();
    });

    it('PS-4: applies category filter', async () => {
      await service.findAll({ category: 'Electronics' } as any);

      const where = repository.findAll.mock.calls[0][0].where;
      expect(where.category).toBe('Electronics');
    });

    it('PS-4: applies isActive filter', async () => {
      await service.findAll({ isActive: false } as any);

      const where = repository.findAll.mock.calls[0][0].where;
      expect(where.isActive).toBe(false);
    });

    it('PS-4: excludes soft-deleted products', async () => {
      await service.findAll({} as any);

      const where = repository.findAll.mock.calls[0][0].where;
      expect(where.deletedAt).toBeNull();
    });
  });

  // ─── PS-5: findOne ────────────────────────────────────────────────────────

  describe('findOne (PS-5)', () => {
    it('PS-5: returns cached product without DB call', async () => {
      cache.get.mockResolvedValue(PRODUCT_STUB);

      const result = await service.findOne('prod-1');

      expect(result).toEqual(PRODUCT_STUB);
      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it('PS-5: queries DB and caches on cache miss', async () => {
      cache.get.mockResolvedValue(null);
      repository.findOne.mockResolvedValue(PRODUCT_STUB as any);

      await service.findOne('prod-1');

      expect(repository.findOne).toHaveBeenCalledWith({ id: 'prod-1' }, expect.anything());
      expect(cache.set).toHaveBeenCalled();
    });

    it('PS-5: throws NotFoundException when product does not exist', async () => {
      cache.get.mockResolvedValue(null);
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── PS-6: update ─────────────────────────────────────────────────────────

  describe('update (PS-6)', () => {
    it('PS-6: updates product and invalidates its cache entry', async () => {
      cache.get.mockResolvedValue(PRODUCT_STUB);
      repository.update.mockResolvedValue({ ...PRODUCT_STUB, name: 'Updated' } as any);

      await service.update('prod-1', { name: 'Updated' } as any);

      expect(repository.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { name: 'Updated' },
      });
      expect(cache.del).toHaveBeenCalledWith('product_prod-1');
    });

    it('PS-6: throws NotFoundException when product does not exist', async () => {
      cache.get.mockResolvedValue(null);
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('bad-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ─── PS-7: remove ─────────────────────────────────────────────────────────

  describe('remove (PS-7)', () => {
    it('PS-7: soft-deletes product and invalidates cache', async () => {
      cache.get.mockResolvedValue(PRODUCT_STUB);
      repository.softRemove.mockResolvedValue({ ...PRODUCT_STUB, deletedAt: new Date() } as any);

      await service.remove('prod-1');

      expect(repository.softRemove).toHaveBeenCalledWith({ id: 'prod-1' });
      expect(cache.del).toHaveBeenCalledWith('product_prod-1');
    });

    it('PS-7: throws NotFoundException when product not found', async () => {
      cache.get.mockResolvedValue(null);
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
